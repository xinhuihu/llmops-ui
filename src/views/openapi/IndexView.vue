<script setup lang="ts">
import CodeHighLight from '@/components/CodeHighLight.vue'
import {
  blockApiOutput,
  blockApiShell,
  streamApiOutput,
  streamApiShell,
} from '@/views/openapi/quick-start'
</script>

<template>
  <div class="pb-6">
    <div class="bg-white p-6 rounded-lg h-[calc(100vh-160px)] overflow-scroll scrollbar-w-none">
      <h2 class="text-base text-gray-700 font-bold mb-4">Overview</h2>
      <p class="text-gray-700 mb-4">
        WenQu API provides professional technical interaction capabilities for developers. Leveraging the API, developers can implement business requirements more efficiently and comprehensively.
        It also supports flexible, high-precision capability extensions for models, workflows, knowledge bases and extension plugins, enabling customized Agents to deliver higher accuracy, better execution efficiency and stronger intelligence.
      </p>
      <h2 class="text-base text-gray-900 font-bold mb-4">Prerequisites</h2>
      <p class="text-gray-700 mb-4">
        Before you get started, you need to create a personal access token and complete Agent creation and publication on the WenQu platform.
      </p>
      <h2 class="text-base text-gray-900 font-bold mb-4">Basic Usage</h2>
      <a-tabs type="text">
        <a-tab-pane key="block" title="Non-streaming Chat">
          <p class="text-gray-700 mb-4">Request curl</p>
          <code-high-light language="shell">{{ blockApiShell }}</code-high-light>
          <p class="text-gray-700 mb-4">Response Example</p>
          <code-high-light language="json">{{ blockApiOutput }}</code-high-light>
        </a-tab-pane>
        <a-tab-pane key="stream" title="Streaming Chat">
          <p class="text-gray-700 mb-4">Request curl</p>
          <code-high-light language="shell">{{ streamApiShell }}</code-high-light>
          <p class="text-gray-700 mb-4">Response Example</p>
          <code-high-light language="json">{{ streamApiOutput }}</code-high-light>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped></style>
