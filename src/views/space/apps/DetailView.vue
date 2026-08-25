<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { debugApp } from '@/services/app'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const query = ref('')
type ChatMessage = {
  id: number
  role: 'human' | 'ai'
  content: string
  rawContent: string
}
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const route = useRoute()

let typeBuffer = ''
let typingTimer: number | null = null
let aiMsgIndex = -1

const clearMessages = () => {
  messages.value = []
  typeBuffer = ''
  aiMsgIndex = -1
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
}

const stopGenerate = () => {
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
  typeBuffer = ''
  aiMsgIndex = -1
  isLoading.value = false
}

/** Convert original Markdown to safe HTML */
function getRenderedMarkdown(raw: string) {
  const html = marked.parse(raw) as string
  return DOMPurify.sanitize(html)
}

function flushBuffer(speed = 45) {
  if (aiMsgIndex < 0 || aiMsgIndex >= messages.value.length) {
    typingTimer = null
    isLoading.value = false
    return
  }

  if (typeBuffer.length === 0) {
    typingTimer = null
    isLoading.value = false
    return
  }

  const char = typeBuffer[0]
  typeBuffer = typeBuffer.slice(1)
  messages.value[aiMsgIndex].content += char
  messages.value[aiMsgIndex].rawContent += char

  typingTimer = window.setTimeout(() => {
    flushBuffer(speed)
  }, speed)
}

function ensureTyping() {
  if (typingTimer === null && typeBuffer.length > 0) {
    flushBuffer(45)
  }
}

const send = async () => {
  if (!query.value.trim()) {
    Message.error('User questions cannot be empty')
    return
  }
  if (isLoading.value || typingTimer !== null) {
    Message.warning('Please wait for the current reply to complete')
    return
  }

  typeBuffer = ''
  aiMsgIndex = -1
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }

  try {
    const humanQuery = query.value.trim()
    messages.value.push({
      id: Date.now(),
      role: 'human',
      content: humanQuery,
      rawContent: humanQuery,
    })
    query.value = ''
    isLoading.value = true

    messages.value.push({
      id: Date.now() + 1,
      role: 'ai',
      content: '',
      rawContent: '',
    })
    aiMsgIndex = messages.value.length - 1

    await debugApp(route.params.app_id as string, humanQuery, (event_response) => {
      console.log('event_response', event_response)
      const event = event_response?.event
      const data = event_response?.data

      if (event === 'QueueEvent.AGENT_MESSAGE') {
        const chunk_content = data?.answer
        if (chunk_content && typeof chunk_content === 'string') {
          typeBuffer += chunk_content
          ensureTyping()
        }
      }

      // The backend completes the push, stops the typewriter effect, and closes the loading state.
      if (event === 'QueueEvent.AGENT_END') {
        stopGenerate()
      }
    })
  } catch (err) {
    Message.error('Request exception')
    stopGenerate()
  }
}

onUnmounted(() => {
  stopGenerate()
})
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center h-[74px] bg-gray-100 border-b border-gray-200 px-4">
      Top navigation
    </header>
    <div class="flex flex-row h-[calc(100vh-74px)]">
      <div class="w-2/3 bg-gray-50 h-full">
        <header class="flex items-center h-16 border-b border-gray-200 px-7 text-xl text-gray-700">
          Application Orchestration
        </header>
        <div class="flex flex-row h-[calc(100%-64px)]">
          <div class="flex-1 border-r border-gray-200 p-6">Persona and Response Logic</div>
          <div class="flex-1 p-6">Applied Competence</div>
        </div>
      </div>
      <div class="flex flex-col w-1/3 bg-white h-full">
        <header
          class="flex flex-shrink-0 items-center h-16 px-4 text-xl bg-white border-b border-gray-200 shadow-sm"
        >
          Debugging and Preview
        </header>
        <div class="h-full min-h-0 px-6 py-7 overflow-x-hidden overflow-y-scroll scrollbar-w-none">
          <div class="flex flex-row gap-2 mb-6" v-for="message in messages" :key="message.id">
            <a-avatar
              v-if="message.role === 'human'"
              :style="{ backgroundColor: '#3370ff' }"
              class="flex-shrink-0"
              :size="30"
            >
              Hu
            </a-avatar>
            <a-avatar
              v-else
              :style="{ backgroundColor: '#00d0b6' }"
              class="flex-shrink-0"
              :size="30"
            >
              <icon-apps />
            </a-avatar>
            <div class="flex flex-col gap-2">
              <div class="font-semibold text-gray-700">
                {{ message.role === 'human' ? 'Hu kevin' : 'Chatbot' }}
              </div>
              <div
                v-if="message.role === 'human'"
                class="max-w-max bg-blue-700 text-white border border-blue-800 px-4 py-3 rounded-2xl leading-5"
              >
                {{ message.content }}
              </div>

              <div
                v-else
                class="max-w-max bg-gray-100 text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl leading-5 markdown-wrap"
              >
                <template v-if="isLoading && aiMsgIndex === messages.indexOf(message)">
                  {{ message.content }}
                  <span class="cursor"></span>
                </template>
                <template v-else>
                  <div v-html="getRenderedMarkdown(message.rawContent)"></div>
                </template>
              </div>
            </div>
          </div>
          <div
            v-if="!messages.length"
            class="mt-[200px] flex flex-col items-center justify-center gap-2"
          >
            <a-avatar :size="70" shape="square" :style="{ backgroundColor: '#00d0b6' }">
              <icon-apps />
            </a-avatar>
            <div class="text-2xl font-semibold text-gray-900">ChatBot</div>
          </div>
        </div>

        <div class="w-full flex-shrink-0 flex flex-col px-6 pb-4">
          <div class="flex items-center gap-2 mb-2">
            <a-button v-if="isLoading" status="warning" @click="stopGenerate">
              stop
            </a-button>
          </div>
          <div
            class="h-[50px] flex items-center gap-2 px-4 flex-1 border border-gray-200 rounded-full"
          >
            <input
              type="text"
              class="flex-1 outline-0"
              v-model="query"
              @keyup.enter="send"
              placeholder="Please enter your question"
            />
            <a-button type="text" shape="circle">
              <template #icon>
                <icon-plus-circle size="16" :style="{ color: '#374151' }" />
              </template>
            </a-button>
            <a-button type="text" shape="circle" @click="send">
              <template #icon>
                <icon-send size="16" :style="{ color: '#1d4ed8' }" />
              </template>
            </a-button>
          </div>
          <div class="text-center text-gray-500 text-xs py-4">
            Content generated by AI cannot be guaranteed to be true and accurate and is for reference only.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor {
  display: inline-block;
  width: 1px;
  height: 14px;
  background-color: #444444;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.markdown-wrap :deep(h1) {
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0;
}
.markdown-wrap :deep(h2) {
  font-size: 16px;
  font-weight: bold;
  margin: 6px 0;
}
.markdown-wrap :deep(p) {
  margin: 4px 0;
  line-height: 1.6;
}
.markdown-wrap :deep(pre) {
  background: #222;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
}
.markdown-wrap :deep(code) {
  background: #eee;
  padding: 0 4px;
  border-radius: 3px;
}
.markdown-wrap :deep(pre code) {
  background: transparent;
}
.markdown-wrap :deep(ul),
.markdown-wrap :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
</style>