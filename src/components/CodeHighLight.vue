<script setup lang="ts">
import { onMounted, ref } from 'vue'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'

// Data required for defining custom components
const props = defineProps({
  language: { type: String, default: '', required: true },
})
const codeElement = ref(null)

// Highlight the code after the component is mounted successfully
onMounted(() => {
  if (codeElement.value) hljs.highlightElement(codeElement.value)
})
</script>

<template>
  <pre
    class="mb-4"
  ><code ref="codeElement" :class="`language-${props.language} whitespace-pre`"><slot></slot></code></pre>
</template>

<style scoped></style>
