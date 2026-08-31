<template>
  <div class="h-[100vh] flex flex-col overflow-hidden">
    <div class="flex-1 overflow-y-auto" style="background: linear-gradient(160deg, #e9e8ff 0%, #f3eef8 100%);">
      <div class="min-h-full flex justify-center items-center py-10 px-4 sm:px-6">
        <div class="max-w-[640px] w-full pb-32">
          <div class="mb-8">
            <h1 class="text-[30px] sm:text-[36px] font-bold text-slate-800 mb-3">
              Hi, I'm <span style="color:#2b5bd9">WenQu</span>
            </h1>
            <h2 class="text-[18px] sm:text-[22px] font-semibold text-slate-700 mb-4">
              Your dedicated <span style="color:#2b5bd9">Knowledge‑Orchestrated AI Q&A</span> Platform
            </h2>
            <p class="text-sm text-slate-700 leading-relaxed">
              Share your ideas, and I can quickly help you build knowledge bases and AI Agents. You may share them with friends or publish to multiple channels.
            </p>
          </div>

          <div class="flex gap-3 mb-6">
            <a-avatar :size="36" style="background-color:#2b5bd9" class="flex-shrink-0">
              <template #icon>
                <IconApps />
              </template>
            </a-avatar>
            <a-card bordered class="flex-1 !rounded-2xl !shadow-sm">
              <template #title>
                <span class="font-bold text-slate-800">Hello, welcome to WenQu 🪷</span>
              </template>
              <div class="text-sm text-slate-700 leading-relaxed">
                <p class="mb-2">
                  "As spring water surges, the canal turns clear." WenQu is a next‑generation knowledge‑orchestrated AI Q&A platform. Whether you have coding experience or not, you can rapidly build intelligent applications with traceable knowledge‑base citations.
                </p>
                <ul class="list-disc pl-5 my-3 space-y-1">
                  <li>Browse the app plaza to explore ready‑built AI applications</li>
                  <li>Upload documents to build RAG‑powered Q&A with source tracing</li>
                  <li>Describe your concept and I will create custom Agent applications</li>
                  <li>Ask me questions about platform usage</li>
                </ul>
                <p>If you have other questions about WenQu, feel free to ask me anytime!</p>
              </div>
            </a-card>
          </div>

          <div class="flex flex-col gap-2.5">
            <a-button class="w-fit" size="small">What is WenQu?</a-button>
            <a-button class="w-fit" size="small">Upload knowledge‑base documents</a-button>
            <a-button class="w-fit" size="small">Help me build a Q&A Agent</a-button>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 pb-4 sm:px-6 sm:pb-6 flex-shrink-0" style="background: linear-gradient(160deg, #e9e8ff 0%, #f3eef8 100%);">
      <div class="flex items-center border border-gray-200 bg-white rounded-full px-3 py-2 gap-2 sm:px-4 sm:py-2.5 sm:gap-3">
        <IconMessage class="text-slate-500 text-base sm:text-lg flex-shrink-0" />
        <a-input
          placeholder="Type your message or describe your AI‑app idea..."
          class="flex-1"
          :bordered="false"
        />
        <a-button type="text" class="flex-shrink-0">
          <template #icon>
            <IconSend />
          </template>
        </a-button>
      </div>
      <div class="text-center text-xs text-slate-400 mt-2">
        AI‑generated content is for reference only. WenQu attempts to trace knowledge sources whenever possible.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconApps, IconMessage, IconSend } from '@arco-design/web-vue/es/icon'
</script>

<style scoped>
:deep(.arco-card-header) {
  padding-top: 12px;
  padding-bottom: 8px;
}
:deep(.arco-card-body) {
  padding-top: 4px;
  padding-bottom: 12px;
}
</style>
