<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { renderAsync } from 'docx-preview'
import { getSegmentsWithPage, previewDocument } from '@/services/datasets'

// pdf.js runs its own worker; point it at the bundled worker asset.
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

// File types that can be rendered in-browser; everything else falls back to download only.
const PREVIEWABLE_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'markdown']

const props = defineProps({
  visible: { type: Boolean, required: true },
  dataset_id: { type: String, required: true },
  document: { type: Object as () => Record<string, any>, required: true },
})
const emits = defineEmits(['update:visible'])

const activeTab = ref('preview')
const loading = ref(false)
const previewError = ref('')
const renderContainer = ref<HTMLElement>()
const textContent = ref('')
const mdHtml = ref('')
const segments = ref<Array<any>>([])
const segmentsLoading = ref(false)

// 抽屉宽度与拖拽调整
const drawerWidth = ref(720)
const windowWidth = ref(window.innerWidth)
const MIN_WIDTH = 480
const MAX_WIDTH_RATIO = 0.95

const extension = () => {
  const name = props.document?.name || ''
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

const isPreviewable = () => PREVIEWABLE_EXTENSIONS.includes(extension())

const hideDrawer = () => emits('update:visible', false)

const onWindowResize = () => {
  windowWidth.value = window.innerWidth
  const max = window.innerWidth * MAX_WIDTH_RATIO
  if (drawerWidth.value > max) drawerWidth.value = max
}

const startResize = (e: PointerEvent) => {
  e.preventDefault()
  const handle = e.currentTarget as HTMLElement
  handle.setPointerCapture(e.pointerId)
  const startX = e.clientX
  const startWidth = drawerWidth.value
  const onMove = (ev: PointerEvent) => {
    // 向左拖 delta 为正 → 变宽；向右拖变窄
    const width = startWidth + (startX - ev.clientX)
    drawerWidth.value = Math.min(Math.max(width, MIN_WIDTH), window.innerWidth * MAX_WIDTH_RATIO)
  }
  const onEnd = (ev: PointerEvent) => {
    if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId)
    handle.removeEventListener('pointermove', onMove)
    handle.removeEventListener('pointerup', onEnd)
    handle.removeEventListener('pointercancel', onEnd)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
  handle.addEventListener('pointermove', onMove)
  handle.addEventListener('pointerup', onEnd)
  handle.addEventListener('pointercancel', onEnd)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

onMounted(() => window.addEventListener('resize', onWindowResize))
onBeforeUnmount(() => window.removeEventListener('resize', onWindowResize))

const handleDownload = async () => {
  try {
    const blob = await previewDocument(props.dataset_id, props.document.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.document.name || 'document'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    Message.error((e as Error)?.message || 'Download failed')
  }
}

const renderPdf = async (blob: Blob) => {
  const data = await blob.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const container = renderContainer.value
  if (!container) return
  container.innerHTML = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.className = 'mx-auto mb-4 shadow'
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport, canvas }).promise
    container.appendChild(canvas)
  }
}

const renderDocx = async (blob: Blob) => {
  const container = renderContainer.value
  if (!container) return
  container.innerHTML = ''
  await renderAsync(blob, container, undefined, {
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    className: 'docx-preview',
  })
}

const loadPreview = async () => {
  // Reset per-openapi state so a stale preview never lingers
  previewError.value = ''
  textContent.value = ''
  mdHtml.value = ''
  loading.value = true

  const blob = await previewDocument(props.dataset_id, props.document.id).catch((e) => {
    previewError.value = (e as Error)?.message || 'Failed to load preview'
    loading.value = false
    return null
  })
  if (!blob) return

  // Stop loading first so the render container mounts, then write into it.
  loading.value = false
  await nextTick()
  try {
    const ext = extension()
    if (ext === 'pdf') {
      await renderPdf(blob)
    } else if (ext === 'docx') {
      await renderDocx(blob)
    } else if (ext === 'md' || ext === 'markdown') {
      const html = await marked.parse(await blob.text())
      mdHtml.value = DOMPurify.sanitize(html)
    } else {
      textContent.value = await blob.text()
    }
  } catch (e) {
    previewError.value = (e as Error)?.message || 'Failed to load preview'
  }
}

const loadSegments = async () => {
  segmentsLoading.value = true
  try {
    const resp = await getSegmentsWithPage(props.dataset_id, props.document.id, {
      current_page: 1,
      page_size: 50,
      search_word: '',
    })
    segments.value = resp.data.list
  } catch (e) {
    Message.error((e as Error)?.message || 'Failed to load segments')
  } finally {
    segmentsLoading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = 'preview'
      segments.value = []
      if (isPreviewable()) {
        loadPreview()
      }
      loadSegments()
    }
  },
  { immediate: true },
)
</script>

<template>
  <a-drawer
    :visible="visible"
    :width="drawerWidth"
    :footer="false"
    unmount-on-close
    @cancel="hideDrawer"
  >
    <template #title>
      <div class="flex items-center justify-between gap-4 pr-6">
        <div class="truncate text-gray-700 font-semibold">{{ document.name }}</div>
        <a-button size="small" @click="handleDownload">
          <template #icon>
            <icon-download />
          </template>
          Download
        </a-button>
      </div>
    </template>

    <a-tabs v-model:active-key="activeTab">
      <a-tab-pane key="preview" title="Preview">
        <!-- 不支持在线预览的类型：统一降级为下载 -->
        <div
          v-if="!isPreviewable()"
          class="h-[400px] flex flex-col items-center justify-center gap-4"
        >
          <a-empty description="This format does not support online preview" />
          <a-button type="primary" @click="handleDownload">
            <template #icon>
              <icon-download />
            </template>
            Download file
          </a-button>
        </div>

        <!-- 加载中 / 出错 -->
        <a-spin v-else-if="loading" class="w-full h-[400px]" />
        <div v-else-if="previewError" class="text-red-700 py-8 text-center">
          {{ previewError }}
        </div>

        <!-- PDF / Word：渲染进容器 -->
        <div v-else-if="extension() === 'pdf' || extension() === 'docx'" ref="renderContainer" class="py-2"></div>

        <!-- Markdown：净化后渲染 HTML -->
        <div v-else-if="extension() === 'md' || extension() === 'markdown'" class="markdown-body py-2" v-html="mdHtml"></div>

        <!-- 纯文本 -->
        <pre v-else class="py-2 whitespace-pre-wrap break-all text-gray-700">{{ textContent }}</pre>
      </a-tab-pane>

      <a-tab-pane key="segments" title="Segments">
        <a-spin :loading="segmentsLoading" class="w-full min-h-[300px]">
          <a-empty
            v-if="segments.length === 0 && !segmentsLoading"
            description="No segments yet"
            class="h-[300px] flex flex-col items-center justify-center"
          />
          <div v-else class="flex flex-col gap-3 py-2">
            <div
              v-for="segment in segments"
              :key="segment.id"
              class="p-3 bg-white rounded-lg border border-gray-200"
            >
              <div class="flex items-center justify-between mb-1">
                <a-tag size="small" class="rounded-md text-gray-500">
                  #{{ String(segment.position).padStart(3, '0') }}
                </a-tag>
                <span class="text-xs text-gray-400">{{ segment.character_count }} chars</span>
              </div>
              <div class="text-gray-700 text-sm whitespace-pre-wrap line-clamp-6 break-all">
                {{ segment.content }}
              </div>
            </div>
          </div>
        </a-spin>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
  <!-- 拖拽手柄：抽屉被 Arco teleport 到 body，手柄也要一起挂到 body 才能盖在抽屉之上 -->
  <Teleport to="body">
    <div
      v-if="visible"
      class="resize-handle"
      :style="{ left: `${windowWidth - drawerWidth - 8}px` }"
      @pointerdown="startResize"
    ></div>
  </Teleport>
</template>

<style scoped>
.resize-handle {
  position: fixed;
  top: calc(50% - 32px);
  width: 16px;
  height: 64px;
  cursor: col-resize;
  z-index: 10000;
  pointer-events: auto;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.resize-handle::after {
  content: '';
  width: 10px;
  height: 44px;
  background-image: radial-gradient(circle 1.5px at 3px 6px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 7px 6px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 3px 16px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 7px 16px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 3px 26px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 7px 26px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 3px 36px, #94a3b8 100%, transparent),
    radial-gradient(circle 1.5px at 7px 36px, #94a3b8 100%, transparent);
}
.resize-handle:hover,
.resize-handle:active {
  border-color: #2563eb;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.3);
}

.markdown-body {
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  font-weight: 600;
  margin: 16px 0 8px;
}
.markdown-body :deep(p) {
  margin: 8px 0;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}
.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
}
.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
}
.markdown-body :deep(img) {
  max-width: 100%;
}

/* 行内代码：浅色药丸，与正文明显区分 */
.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace;
  font-size: 0.9em;
  background: #f1f5f9;
  color: #be185d;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

/* 代码块 / 命令行：深色终端风格 */
.markdown-body :deep(pre) {
  position: relative;
  margin: 12px 0;
  padding: 14px 16px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  border: 1px solid #1e293b;
  overflow-x: auto;
  line-height: 1.6;
}
.markdown-body :deep(pre)::before {
  content: '';
  display: block;
  position: sticky;
  left: 0;
  margin: -14px -16px 10px;
  padding: 6px 16px;
  height: 28px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  border-radius: 8px 8px 0 0;
  /* macOS 风格窗口圆点 */
  background-image: radial-gradient(circle 3px at 8px 14px, #f87171 100%, transparent),
    radial-gradient(circle 3px at 20px 14px, #fbbf24 100%, transparent),
    radial-gradient(circle 3px at 32px 14px, #34d399 100%, transparent);
}
.markdown-body :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 13px;
}
</style>
