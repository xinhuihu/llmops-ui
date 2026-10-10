<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'
import { useOptimizePrompt } from '@/hooks/use-ai'

// Define the data required for custom components
const props = defineProps({
  app_id: { type: String, required: true },
  preset_prompt: { type: String, default: '', required: true },
  // True while the draft config is still being fetched. Guarded so an early
  // blur can't persist the (empty) default and wipe the saved prompt.
  config_loading: { type: Boolean, default: false },
})
const emits = defineEmits(['update:preset_prompt'])

// 'edit' shows the raw textarea, 'preview' renders the markdown
const viewMode = ref<'edit' | 'preview'>('edit')

// Snapshot of the prompt before optimization, used to support undo
const original_prompt = ref('')
const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()
const { loading, optimize_prompt, handleOptimizePrompt } = useOptimizePrompt()

// Convert the prompt markdown to sanitized HTML for the preview pane
const renderedMarkdown = computed(() => {
  const html = marked.parse(props.preset_prompt || '') as string
  return DOMPurify.sanitize(html)
})

// Stream the optimized result back into the textarea.
// Skip the empty value so the original prompt stays visible until the first chunk arrives.
watch(optimize_prompt, (value) => {
  if (value === '') return
  emits('update:preset_prompt', value)
})

// Optimize the current preset prompt and write the streamed result back into the textarea
const handleOptimize = async () => {
  if (loading.value) return

  const current = props.preset_prompt.trim()
  if (current === '') {
    Message.warning('The original prompt cannot be empty')
    return
  }

  // Keep the original prompt so the user can undo the optimization
  original_prompt.value = props.preset_prompt

  await handleOptimizePrompt(current)

  // Persist the optimized prompt to the draft config once streaming finishes
  await handleUpdateDraftAppConfig(props.app_id, { preset_prompt: optimize_prompt.value })
}

// Revert the textarea back to the prompt before optimization
const handleUndo = async () => {
  emits('update:preset_prompt', original_prompt.value)
  await handleUpdateDraftAppConfig(props.app_id, { preset_prompt: original_prompt.value })
  original_prompt.value = ''
}

// Persist the prompt on blur, but only once the draft config has been loaded.
// Without this guard, an early blur saves the empty default and erases the prompt.
const handleBlur = async () => {
  if (props.config_loading) return
  await handleUpdateDraftAppConfig(props.app_id, { preset_prompt: props.preset_prompt })
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-173px)]">
    <!-- Header: view toggle + actions -->
    <div class="flex items-center justify-between px-4 mb-4">
      <div class="text-gray-700 font-bold">Preset Prompt</div>
      <div class="flex items-center gap-2">
        <a-radio-group v-model:model-value="viewMode" type="button" size="mini">
          <a-radio value="edit">
            <span class="flex items-center gap-1">
              <icon-edit />
              Edit
            </span>
          </a-radio>
          <a-radio value="preview">
            <span class="flex items-center gap-1">
              <icon-eye />
              Preview
            </span>
          </a-radio>
        </a-radio-group>
        <a-button
          v-if="original_prompt && !loading"
          size="mini"
          class="rounded-lg px-2"
          @click="handleUndo"
        >
          <template #icon>
            <icon-undo />
          </template>
          Undo
        </a-button>
        <a-button
          size="mini"
          class="rounded-lg px-2"
          :loading="loading"
          @click="handleOptimize"
        >
          <template #icon>
            <icon-sync />
          </template>
          Optimize
        </a-button>
      </div>
    </div>
    <!-- Body: edit or preview -->
    <div class="flex-1 overflow-hidden">
      <a-textarea
        v-if="viewMode === 'edit'"
        class="h-full resize-none !bg-transparent !border-0 text-gray-700 px-1 preset-prompt-textarea"
        placeholder="Please enter the preset prompt for the Agent here)"
        :max-length="8000"
        show-word-limit
        :model-value="props.preset_prompt"
        :disabled="loading"
        @update:model-value="(value) => emits('update:preset_prompt', value)"
        @blur="handleBlur"
      />
      <div
        v-else
        class="h-full overflow-x-hidden overflow-y-auto break-words px-1 text-gray-700 markdown-wrap"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>
</template>

<style scoped>
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
.markdown-wrap :deep(img) {
  max-width: 100%;
  height: auto;
}
.markdown-wrap :deep(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}
.markdown-wrap :deep(th),
.markdown-wrap :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
}
.markdown-wrap :deep(ul),
.markdown-wrap :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
</style>
