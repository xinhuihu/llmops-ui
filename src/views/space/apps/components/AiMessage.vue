<script setup lang="ts">
import { type PropType, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import DotFlashing from '@/components/DotFlashing.vue'
import AgentThought from './AgentThought.vue'

const props = defineProps({
  app: { type: Object, default: {}, required: true },
  answer: { type: String, default: '', required: true },
  loading: { type: Boolean, default: false, required: false },
  agent_thoughts: { type: Array as PropType<Record<string, any>[]>, default: [], required: true },
  suggested_questions: { type: Array as PropType<string[]>, default: [], required: false },
})
const emits = defineEmits(['selectSuggestedQuestion'])

// Convert the streaming markdown answer into sanitized HTML for live preview.
// `props.answer` grows incrementally as SSE chunks arrive, so this computed
// re-renders on every chunk and gives a "type as you go" preview effect.
const renderedAnswer = computed(() => {
  const raw = props.answer.trim()
  if (raw === '') return ''
  const html = marked.parse(raw, { async: false }) as string
  return DOMPurify.sanitize(html)
})
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
  background: #f7f7f8;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.5;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
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
