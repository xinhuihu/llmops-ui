<script setup lang="ts">
import { ref } from 'vue'
import { useGetDebugConversationSummary, useUpdateDebugConversationSummary } from '@/hooks/use-app'
// define the required data for custom component
const props = defineProps({
  app_id: { type: String, required: true },
  long_term_memory: { type: Object, default: { enable: false }, required: true },
})
const { debug_conversation_summary, loadDebugConversationSummary } =
  useGetDebugConversationSummary()
const { loading, handleUpdateDebugConversationSummary } = useUpdateDebugConversationSummary()

const summaryModalVisible = ref(false)
// Modal window opening processor
const openSummaryModal = async () => {
  // Call the API to get long-term memory
  await loadDebugConversationSummary(props.app_id)

  // 开启模态窗
  summaryModalVisible.value = true
}
</script>

<template>
  <div class="">
    <!-- 预览与调试头组件 -->
    <div class="flex items-center justify-between border-b h-[64px] px-4">
      <div class="text-base text-gray-700 font-bold">Preview and Debug</div>
      <a-button
        :disabled="!props.long_term_memory?.enable"
        size="mini"
        type="text"
        class="rounded-lg px-1 !text-blue-700"
        @click="openSummaryModal"
      >
        <template #icon>
          <icon-save />
        </template>
        long-term memory
      </a-button>
    </div>
    <!-- 长期记忆模态窗 -->
    <a-modal
      :width="520"
      v-model:visible="summaryModalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">long-term memory</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="summaryModalVisible = false"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 底部表单 -->
      <div class="pt-6">
        <a-textarea
          v-model:model-value="debug_conversation_summary"
          placeholder="Please enter the long-term memory for the current debugging session"
          show-word-limit
          :max-length="2000"
          :auto-size="{ minRows: 8, maxRows: 8 }"
        />
        <!-- 底部按钮 -->
        <div class="flex items-center justify-between">
          <div class=""></div>
          <a-space :size="16">
            <a-button class="rounded-lg" @click="summaryModalVisible = false">Cancel</a-button>
            <a-button
              :loading="loading"
              type="primary"
              class="rounded-lg"
              @click="
                async () => {
                  await handleUpdateDebugConversationSummary(
                    props.app_id,
                    debug_conversation_summary,
                  )
                  summaryModalVisible = false
                }
              "
            >
              Save
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>