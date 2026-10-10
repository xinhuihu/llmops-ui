<script setup lang="ts">
import { type PropType, ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  useDebugChat,
  useDeleteDebugConversation,
  useGetDebugConversationMessagesWithPage,
  useStopDebugChat
} from '@/hooks/use-app'
import { useGenerateSuggestedQuestions } from '@/hooks/use-ai'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import { useAccountStore } from '@/stores/account'
import HumanMessage from './HumanMessage.vue'
import AiMessage from '@/views/space/apps/components/AiMessage.vue'
import { Message } from '@arco-design/web-vue'
import { QueueEvent } from '@/config'
//
const props = defineProps({
  app: { type: Object, default: {}, required: true },
  suggested_after_answer: {
    type: Object as PropType<{ enable: boolean }>,
    default: { enable: true },
    required: true,
  },
  opening_statement: { type: String, default: '', required: true },
  opening_questions: { type: Array as PropType<string[]>, default: [], required: true },
})
const route = useRoute()
const query = ref('')
const message_id = ref('')
const task_id = ref('')
const scroller = ref<any>(null)
const scrollHeight = ref(0)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const accountStore = useAccountStore()
const { loading: deleteDebugConversationLoading, handleDeleteDebugConversation } =
  useDeleteDebugConversation()
const {
  loading: getDebugConversationMessagesWithPageLoading,
  messages,
  paginator,
  loadDebugConversationMessages,
} = useGetDebugConversationMessagesWithPage()

const { loading: debugChatLoading, handleDebugChat } = useDebugChat()
const { loading: stopDebugChatLoading, handleStopDebugChat } = useStopDebugChat()
const { suggested_questions, handleGenerateSuggestedQuestions } = useGenerateSuggestedQuestions()

// Define the function for saving scroll height
const saveScrollHeight = () => {
  scrollHeight.value = scroller.value.$el.scrollHeight
}
// Define the function to restore scroll height
const restoreScrollPosition = () => {
  scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight - scrollHeight.value
}
// Define the scroll function
const handleScroll = async (event: UIEvent) => {
  const { scrollTop } = event.target as HTMLElement
  if (scrollTop <= 0 && !getDebugConversationMessagesWithPageLoading.value) {
    saveScrollHeight()
    await loadDebugConversationMessages(String(route.params?.app_id), false)
    restoreScrollPosition()
  }
}

// Run the agent for a query and stream the result into the message at targetIndex.
const runDebugChat = async (
  humanQuery: string,
  targetIndex: number,
  regenerateMessageId?: string,
) => {
  let position = 0

  // Call hooks to initiate the request
  await handleDebugChat(props.app?.id, humanQuery, (event_response) => {
    // Extract streaming event response data and event names
    const event = event_response?.event
    const data = event_response?.data
    const event_id = data?.id
    let agent_thoughts = messages.value[targetIndex].agent_thoughts

    // Initial data detection and assignment
    if (message_id.value === '' && data?.message_id) {
      task_id.value = data?.task_id
      message_id.value = data?.message_id
      messages.value[targetIndex].id = data?.message_id
      messages.value[targetIndex].conversation_id = data?.conversation_id
    }

    // Process the obtained events in a loop and record events other than ping.
    if (event !== QueueEvent.ping) {
      // The agent_message data is appended, while all others are overwritten.
      if (event === QueueEvent.agentMessage) {
        // Get the data index and check if it exists
        const agent_thought_idx = agent_thoughts.findIndex((item) => item?.id === event_id)

        // Add if the data does not exist
        if (agent_thought_idx === -1) {
          position += 1
          agent_thoughts.push({
            id: event_id,
            position: position,
            event: data?.event,
            thought: data?.thought,
            observation: data?.observation,
            tool: data?.tool,
            tool_input: data?.tool_input,
            retrieval_documents: data?.retrieval_documents || [],
            latency: data?.latency,
            created_at: 0,
          })
        } else {
          // Superimpose if data exists
          agent_thoughts[agent_thought_idx] = {
            ...agent_thoughts[agent_thought_idx],
            thought: agent_thoughts[agent_thought_idx]?.thought + data?.thought,
            latency: data?.latency,
          }
        }

        // Update / add answer
        messages.value[targetIndex].answer += data?.answer
      } else {
        // Handle other types of events and directly overwrite the data.
        position += 1
        agent_thoughts.push({
          id: event_id,
          position: position,
          event: data?.event,
          thought: data?.thought,
          observation: data?.observation,
          tool: data?.tool,
          tool_input: data?.tool_input,
          retrieval_documents: data?.retrieval_documents || [],
          latency: data?.latency,
          created_at: 0,
        })
      }

      // Update agent_thoughts
      messages.value[targetIndex].agent_thoughts = agent_thoughts

      scroller.value.scrollToBottom()
    }
  }, regenerateMessageId)

  // Determine whether the suggested question generation is enabled. If enabled, initiate an API request to retrieve data.
  if (props.suggested_after_answer.enable) {
    await handleGenerateSuggestedQuestions(message_id.value)
    setTimeout(() => scroller.value && scroller.value.scrollToBottom(), 100)
  }
}

// Grow the textarea with its content, clamped to a max height so it stays scrollable.
const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

// Enter sends the query; Shift+Enter inserts a newline. Guarded against IME
// composition so confirming a Chinese input candidate does not send by accident.
const handleKeydown = (e: KeyboardEvent) => {
  if (e.isComposing) return
  e.preventDefault()
  handleSubmit()
}

// Define the input box submission function
const handleSubmit = async () => {
  // Check whether the query has been entered; if not, terminate.
  if (query.value.trim() === '') {
    Message.warning('User query cannot be empty')
    return
  }

  // Detect whether the previous query has ended. A new query cannot be initiated if it has not ended.
  if (debugChatLoading.value) {
    Message.warning('The previous question has not been finished. Please wait a moment.')
    return
  }

  // Complete the pre-work for handling formal questions when conditions are met,
  // including clearing suggested questions, deleting message IDs and task IDs.
  suggested_questions.value = []
  message_id.value = ''
  task_id.value = ''

  const humanQuery = query.value
  query.value = ''
  nextTick(autoResize)

  // Add basic human messages to the message list
  messages.value.unshift({
    id: '',
    conversation_id: '',
    query: humanQuery,
    answer: '',
    total_token_count: 0,
    latency: 0,
    agent_thoughts: [],
    suggested_questions: [],
    created_at: 0,
  })

  await runDebugChat(humanQuery, 0)
}

//Stop debug session function
const handleStop = async () => {
  // If there is no task ID, or it is not loading, stop directly.
  if (task_id.value === '' || !debugChatLoading.value) return

  // Interrupt the API call request
  await handleStopDebugChat(props.app?.id, task_id.value)
}
// Define the problem submission function
const handleSubmitQuestion = async (question: string) => {
  // Synchronize the question into the query.
  query.value = question

  // Trigger the handleSubmit function
  await handleSubmit()
}

// Regenerate an existing answer in place: clear it and re-run the agent into the same message.
const handleRegenerate = async (item: Record<string, any>) => {
  if (debugChatLoading.value) {
    Message.warning('The previous question has not been finished. Please wait a moment.')
    return
  }

  const idx = messages.value.findIndex((m) => m.id === item.id)
  if (idx === -1) return

  // Reset the shared generation state before re-running.
  suggested_questions.value = []
  message_id.value = ''
  task_id.value = ''

  // Clear the previous answer and reasoning trace so the new response replaces them.
  messages.value[idx].answer = ''
  messages.value[idx].agent_thoughts = []
  messages.value[idx].suggested_questions = []
  messages.value[idx].total_token_count = 0
  messages.value[idx].latency = 0

  await runDebugChat(item.query, idx, item.id)
}


// Initialize data when the page DOM is fully loaded
onMounted(async () => {
  await loadDebugConversationMessages(String(route.params?.app_id), true)
  await nextTick(() => {
    // Ensure that the scroll operation is executed after the view update is completed.
    if (scroller.value) {
      scroller.value.scrollToBottom()
    }
  })
})
</script>

<template>
  <div class="flex flex-col">
    <!-- 历史对话列表 -->
    <div
      v-if="messages.length > 0"
      class="flex flex-col px-6 h-[calc(100vh-238px)] overflow-y-auto"
    >
      <dynamic-scroller
        ref="scroller"
        :items="messages.slice().reverse()"
        :min-item-size="1"
        @scroll="handleScroll"
        class="h-full scrollbar-w-none"
      >
        <template v-slot="{ item, index, active }">
          <dynamic-scroller-item :item="item" :active="active" :data-index="item.id">
            <div class="flex flex-col gap-6 py-6">
              <!--人类消息-->
              <human-message :query="item.query" :account="accountStore.account" />
              <!--AI消息-->
              <ai-message
                :agent_thoughts="item.agent_thoughts"
                :answer="item.answer"
                :app="props.app"
                :suggested_questions="item.suggested_questions?.length ? item.suggested_questions : (item.id === message_id ? suggested_questions : [])"
                :loading="item.id === message_id && debugChatLoading"
                @select-suggested-question="handleSubmitQuestion"
                @regenerate="handleRegenerate(item)"
              />
            </div>
          </dynamic-scroller-item>
        </template>
      </dynamic-scroller>
      <!-- 停止调试会话 -->
      <div v-if="task_id && debugChatLoading" class="h-[50px] flex items-center justify-center">
        <a-button :loading="stopDebugChatLoading" class="rounded-lg px-2" @click="handleStop">
          <template #icon>
            <icon-poweroff />
          </template>
          Stop
        </a-button>
      </div>
    </div>
    <!-- 对话列表为空时展示的对话开场白 -->
    <div v-else class="flex flex-col p-6 gap-2 items-center justify-center h-[calc(100vh-238px)]">
      <!-- 应用图标与名称 -->
      <div class="flex flex-col items-center gap-2">
        <a-avatar :size="48" shape="square" class="rounded-lg" :image-url="props.app?.icon" />
        <div class="text-sm text-gray-700">{{ props.app?.name }}</div>
      </div>
      <!-- 对话开场白 -->
      <div
        v-if="props.opening_statement"
        class="bg-gray-100 w-full px-4 py-3 rounded-lg text-gray-700 text-xs"
      >
        {{ props.opening_statement }}
      </div>
      <!-- 开场白建议问题 -->
      <div class="flex items-center flex-wrap gap-2 w-full">
        <div
          v-for="(opening_question, idx) in props.opening_questions.filter(
            (item) => item.trim() !== '',
          )"
          :key="idx"
          class="px-4 py-1.5 border rounded-lg text-gray-700 text-xs cursor-pointer hover:bg-gray-50"
          @click="async () => await handleSubmitQuestion(opening_question)"
        >
          {{ opening_question }}
        </div>
      </div>
    </div>
    <!-- 对话输入框 -->
    <div class="w-full flex flex-col flex-shrink-0">
      <!-- 顶部输入框 -->
      <div class="px-6 flex items-end gap-3">
        <!-- 清除按钮 -->
        <a-button
          :loading="deleteDebugConversationLoading"
          class="flex-shrink-0 mb-1 !text-gray-700"
          type="text"
          shape="circle"
          @click="
            async () => {
              // Call the stop response interface first
              await handleStop()
              // clear the conversation messages
              await handleDeleteDebugConversation(props.app?.id)
              //reloading the data
              await loadDebugConversationMessages(props.app?.id, true)
            }
          "
        >
          <template #icon>
            <icon-empty :size="16" />
          </template>
        </a-button>
        <!-- 输入框组件 -->
        <div
          class="flex-1 flex items-end gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl transition-colors focus-within:border-blue-400 focus-within:bg-white"
        >
          <textarea
            ref="inputRef"
            v-model="query"
            rows="1"
            placeholder="Enter a question. Enter to send, Shift+Enter for a newline"
            class="flex-1 resize-none bg-transparent outline-none max-h-40 text-sm leading-6 text-gray-700 placeholder:text-gray-400"
            @keydown.enter.exact="handleKeydown"
            @input="autoResize"
          ></textarea>
          <a-button
            :loading="debugChatLoading"
            type="text"
            shape="circle"
            class="flex-shrink-0 !text-gray-700"
            @click="handleSubmit"
          >
            <template #icon>
              <icon-send :size="16" />
            </template>
          </a-button>
        </div>
      </div>
      <!-- 底部提示信息 -->
      <div class="text-center text-gray-500 text-xs py-4">
        The content is AI-generated and cannot be guaranteed to be true or accurate; it is for
        reference only.
      </div>
    </div>
    <!-- 停止会话按钮 -->
  </div>
</template>

<style scoped></style>
