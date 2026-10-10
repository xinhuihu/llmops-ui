<script setup lang="ts">
import { type PropType, computed, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import DotFlashing from '@/components/DotFlashing.vue'
import AgentThought from './AgentThought.vue'
import { QueueEvent } from '@/config'
import { Message } from '@arco-design/web-vue'

const props = defineProps({
  app: { type: Object, default: {}, required: true },
  answer: { type: String, default: '', required: true },
  loading: { type: Boolean, default: false, required: false },
  agent_thoughts: { type: Array as PropType<Record<string, any>[]>, default: [], required: true },
  suggested_questions: { type: Array as PropType<string[]>, default: [], required: false },
})
const emits = defineEmits(['selectSuggestedQuestion', 'regenerate'])

// Convert the streaming markdown answer into sanitized HTML for live preview.
// `props.answer` grows incrementally as SSE chunks arrive, so this computed
// re-renders on every chunk and gives a "type as you go" preview effect.
const renderedAnswer = computed(() => {
  const raw = props.answer.trim()
  if (raw === '') return ''
  const html = marked.parse(raw, { async: false }) as string
  return DOMPurify.sanitize(html)
})

// Collect the documents cited by dataset-retrieval steps so they can be shown
// below the answer. Dedupe by document_id, preserving first-seen order.
const retrievalDocuments = computed(() => {
  const seen = new Set<string>()
  const docs: Record<string, any>[] = []
  for (const thought of props.agent_thoughts) {
    if (thought.event !== QueueEvent.datasetRetrieval) continue
    const citations = thought.retrieval_documents
    if (!Array.isArray(citations)) continue
    for (const doc of citations) {
      if (doc?.document_id && !seen.has(doc.document_id)) {
        seen.add(doc.document_id)
        docs.push(doc)
      }
    }
  }
  return docs
})

// Copy the raw Markdown answer to the clipboard.
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.answer)
    Message.success('Copied')
  } catch {
    Message.error('Copy failed')
  }
}

// Like / dislike feedback (visual toggle only for now; no backend endpoint yet).
const liked = ref(false)
const disliked = ref(false)

const handleLike = () => {
  liked.value = !liked.value
  if (liked.value) disliked.value = false
}

const handleDislike = () => {
  disliked.value = !disliked.value
  if (disliked.value) liked.value = false
}

// Ask the parent to regenerate this answer.
const handleRegenerate = () => emits('regenerate')
</script>

<template>
  <div class="flex gap-2">
    <!-- 左侧图标 -->
    <a-avatar :size="30" shape="circle" class="flex-shrink-0" :image-url="props.app?.icon" />
    <!-- 右侧名称与消息 -->
    <div class="flex flex-col items-start gap-2 min-w-0 flex-1">
      <!-- 应用名称 -->
      <div class="text-gray-700 font-bold">{{ props.app?.name }}</div>
      <!-- 推理步骤 -->
      <agent-thought :agent_thoughts="props.agent_thoughts" :loading="props.loading" />
      <!-- AI消息 -->
      <div
        class="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl max-w-full"
      >
        <template v-if="props.loading && props.answer.trim() === ''">
          <dot-flashing />
        </template>
        <template v-else>
          <!-- 流式渲染的 markdown 预览 -->
          <div class="markdown-body break-words" v-html="renderedAnswer" />
          <!-- 输出过程中的闪烁光标 -->
          <span
            v-if="props.loading"
            class="inline-block w-2 h-4 ml-0.5 bg-gray-700 align-text-bottom animate-pulse"
          />
        </template>
      </div>
      <!-- 操作按钮行：喜欢 / 不喜欢 / 重新生成 / 复制 -->
      <div v-if="props.answer.trim() !== ''" class="flex items-center gap-1">
        <a-button
          type="text"
          size="mini"
          :class="liked ? '!text-blue-500' : '!text-gray-500 hover:!text-gray-700'"
          @click="handleLike"
        >
          <template #icon><icon-thumb-up :size="16" /></template>
        </a-button>
        <a-button
          type="text"
          size="mini"
          :class="disliked ? '!text-red-500' : '!text-gray-500 hover:!text-gray-700'"
          @click="handleDislike"
        >
          <template #icon><icon-thumb-down :size="16" /></template>
        </a-button>
        <a-button type="text" size="mini" class="!text-gray-500 hover:!text-gray-700" @click="handleRegenerate">
          <template #icon><icon-refresh :size="16" /></template>
        </a-button>
        <a-button type="text" size="mini" class="!text-gray-500 hover:!text-gray-700" @click="handleCopy">
          <template #icon><icon-copy :size="16" /></template>
        </a-button>
      </div>
      <!-- 引用文档列表 -->
      <div v-if="retrievalDocuments.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="doc in retrievalDocuments"
          :key="doc.document_id"
          class="flex items-center gap-1 px-2 py-1 border rounded-lg text-xs text-gray-600 bg-white"
        >
          <icon-file :size="12" />
          {{ doc.document_name || doc.document_id }}
        </div>
      </div>
      <!-- 建议问题列表 -->
      <div v-if="props.suggested_questions.length > 0" class="flex flex-col gap-2">
        <div
          v-for="(suggested_question, idx) in props.suggested_questions"
          :key="idx"
          class="px-4 py-1.5 border rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50"
          @click="() => emits('selectSuggestedQuestion', suggested_question)"
        >
          {{ suggested_question }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tailwind preflight resets heading/list/code styles, so restore them for
   the markdown rendered by v-html. `:deep()` is required because the injected
   HTML nodes do not carry the scoped data attribute. */
.markdown-body {
  font-size: 14px;
  line-height: 1.65;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-body :deep(p) {
  margin: 0.4em 0;
}
.markdown-body :deep(p:first-child) {
  margin-top: 0;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 0.7em 0 0.4em;
  font-weight: 600;
  line-height: 1.3;
}
.markdown-body :deep(h1) {
  font-size: 1.35em;
}
.markdown-body :deep(h2) {
  font-size: 1.25em;
}
.markdown-body :deep(h3) {
  font-size: 1.15em;
}
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  font-size: 1em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.5em;
}
.markdown-body :deep(ul) {
  list-style: disc;
}
.markdown-body :deep(ol) {
  list-style: decimal;
}
.markdown-body :deep(li) {
  margin: 0.2em 0;
}

.markdown-body :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.35em;
  border-radius: 4px;
}
.markdown-body :deep(pre) {
  margin: 0.5em 0;
  padding: 0.8em 1em;
  background: #1e1e1e;
  color: #f8f8f8;
  border: 1px solid #333333;
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.5;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: #f8f8f8;
}

.markdown-body :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.2em 0.9em;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
}
.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
.markdown-body :deep(hr) {
  margin: 0.8em 0;
  border: 0;
  border-top: 1px solid #e5e7eb;
}
.markdown-body :deep(table) {
  margin: 0.5em 0;
  border-collapse: collapse;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.35em 0.7em;
}
.markdown-body :deep(th) {
  background: #f3f4f6;
  font-weight: 600;
}
</style>
