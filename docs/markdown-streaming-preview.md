# AI 输出 Markdown 流式预览

## 背景与目标

调试对话（Debug Chat）中，AI 的回复目前以纯文本形式渲染，无法展示标题、列表、代码块等富文本效果；同时回复是随 SSE 分片增量到达的，逐字「蹦」出来的纯文本观感较差。

本次改动的目标：

- 将 AI 输出的 Markdown 渲染为富文本（标题、列表、代码块、表格、引用、链接等）。
- 实现**一边输出、一边预览**——SSE 每到达一个分片，预览就立即刷新，而不是等整段回答结束后才一次性渲染。
- 保证安全性：模型输出先经消毒（sanitize）再注入 HTML，避免 XSS。

## 改动文件

| 文件 | 说明 |
| --- | --- |
| `src/views/space/apps/components/AiMessage.vue` | 本次主要改动：Markdown 渲染 + 流式预览 + 样式 |

流式数据来源（未改动，作为依赖说明）：

| 文件 | 说明 |
| --- | --- |
| `src/views/space/apps/components/PreviewDebugChat.vue` | 回调中 `messages.value[0].answer += data?.answer`，随 SSE 分片增量累加 `answer` |

## 核心实现

### 1. 渲染管线

```
props.answer (Markdown 字符串，随 SSE 增量增长)
        │
        ▼
   marked.parse(raw, { async: false })   // Markdown → HTML
        │
        ▼
   DOMPurify.sanitize(html)              // HTML 消毒，防 XSS
        │
        ▼
   renderedAnswer (computed)
        │
        ▼
   <div v-html="renderedAnswer" />       // 富文本预览
```

关键代码：

```ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const renderedAnswer = computed(() => {
  const raw = props.answer.trim()
  if (raw === '') return ''
  const html = marked.parse(raw, { async: false }) as string
  return DOMPurify.sanitize(html)
})
```

### 2. 为什么能「一边输出一边预览」

`renderedAnswer` 是 `computed`，其依赖是 `props.answer`。而 `props.answer` 在 `PreviewDebugChat.vue` 中通过下面的方式随流式事件累加：

```ts
messages.value[0].answer += data?.answer
```

因此每个 SSE 分片到达后，`answer` 变化 → `computed` 自动重算 → `v-html` 重新渲染，无需任何手动刷新逻辑，天然就是流式预览。

### 3. 加载态与光标

- **回答为空且加载中**：沿用原有 `DotFlashing` 动画。
- **已开始输出但仍在加载中**：渲染 Markdown 预览，并在末尾追加一个闪烁光标，模拟「正在输入」的观感。

```html
<template v-if="props.loading && props.answer.trim() === ''">
  <dot-flashing />
</template>
<template v-else>
  <div class="markdown-body break-words" v-html="renderedAnswer" />
  <span
    v-if="props.loading"
    class="inline-block w-2 h-4 ml-0.5 bg-gray-700 align-text-bottom animate-pulse"
  />
</template>
```

## 样式处理

Tailwind 的 preflight 会重置标题、列表、代码块等默认样式，因此需要在 `<style scoped>` 中通过 `:deep()` 选择器补回。

`v-html` 注入的 HTML 节点不携带 scoped 属性（`data-v-xxx`），所以必须使用 `:deep()` 才能命中：

```css
.markdown-body :deep(pre) {
  margin: 0.5em 0;
  padding: 0.8em 1em;
  background: #f7f7f8;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.5;
}
```

已覆盖的 Markdown 元素：`p`、`h1–h6`、`ul/ol/li`、`code`、`pre`、`blockquote`、`a`、`hr`、`table/th/td`。

## 安全性

模型输出是不可信内容，不能直接作为 HTML 注入。所有 Markdown 转换结果都先经过 `DOMPurify.sanitize()`，过滤掉 `<script>`、事件属性等危险内容，再交给 `v-html` 渲染。

## 依赖与类型说明

- 依赖：`marked@^18.0.9`、`dompurify@^3.4.13`（`package.json` 中已存在，无需新增）。
- 类型：marked v18 自带类型声明（`node_modules/marked/lib/marked.d.ts`），`@types/marked@^6.0.0` 不会生效、也不会冲突。
- `marked.parse(raw, { async: false })` 使用同步重载，返回值类型为 `string`，避免 `string | Promise<string>` 的联合类型。

## 验证

```sh
cd llmops-ui
yarn type-check
# vue-tsc --build --force → Done，无类型错误
```

## 已知表现说明

Markdown 流式渲染在 token 未闭合时（例如代码块只输出了一半的 ``` 围栏），会短暂按普通段落显示，待后续分片补齐后自动纠正。这是流式 Markdown 渲染器的通用表现，属于预期行为。
