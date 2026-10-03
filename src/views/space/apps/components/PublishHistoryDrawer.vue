<script setup lang="ts">
import moment from 'moment'
import { watch } from 'vue'
import { useFallbackHistoryToDraft, useGetPublishHistoriesWithPage } from '@/hooks/use-app'
// 1.Define the data required by the component
const props = defineProps({
  visible: { type: Boolean, required: true },
  app: { type: Object, required: true },
})
const emits = defineEmits(['update:visible', 'loadDraftAppConfig'])
const { loading, paginator, publishHistories, loadPublishHistories } =
  useGetPublishHistoriesWithPage()

const handleScroll = async (event: UIEvent) => {
  // 1.Get the scroll distance, maximum scrollable distance, and the height of the client/browser window
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

  // 2.Determine whether it has scrolled to the bottom
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (loading.value) {
      return
    }
    await loadPublishHistories(String(props.app?.id))
  }
}
const { handleFallBackHistoryToDraft } = useFallbackHistoryToDraft()

// Load the publish history once when the drawer opens. Without this, no initial
// request is ever fired (scroll only appends), so the list stays empty.
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.app?.id) {
      loadPublishHistories(String(props.app.id), true)
    }
  },
)
</script>

<template>
  <!-- 发布历史配置抽屉组件 -->
  <a-drawer
    :visible="props.visible"
    title="Publish History"
    :width="394"
    :footer="false"
    :drawer-style="{ backgroundColor: '#f9fafb' }"
    @cancel="() => emits('update:visible', false)"
  >
    <a-spin
      :loading="loading"
      class="block h-full w-full scrollbar-w-none overflow-scroll"
      @scroll="handleScroll"
    >
      <!-- 顶部的应用信息 -->
      <div class="">
        <!-- 应用基础信息 -->
        <div class="flex items-center gap-3 mb-3">
          <!-- 左侧图标 -->
          <a-avatar :size="40" shape="square" class="rounded-lg" :image-url="app?.icon" />
          <!-- 右侧信息 -->
          <div class="flex flex-col">
            <div class="text-gray-700 font-bold">{{ app?.name }}</div>
            <div class="text-xs text-gray-500">
              Recent edits · {{ moment(app?.draft_updated_at * 1000).format('YYYY-MM-DD HH:mm:ss') }}
            </div>
          </div>
        </div>
        <!-- 应用描述 -->
        <div class="text-gray-500">{{ app?.description }}</div>
      </div>
      <!-- 中间分隔符 -->
      <a-divider />
      <!-- 记录总记录条数 -->
      <div class="text-gray-500 text-xs mb-[18px]">
        Total of {{ paginator.total_record }} published records
      </div>
      <!-- 底部的历史列表信息 -->
      <a-card
        v-for="(publishHistory, idx) in publishHistories"
        :key="publishHistory.id"
        hoverable
        class="rounded-lg mb-4 cursor-pointer group"
      >
        <div class="flex items-center justify-between">
          <!-- 左侧版本信息 -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <div class="font-bold text-gray-900">Version</div>
              <a-tag size="small" class="text-gray-700 rounded-lg !border !border-gray-100">
                # {{ String(publishHistory.version).padStart(3, '0') }}
              </a-tag>
              <a-tag
                v-if="idx === 0"
                size="small"
                class="text-gray-700 rounded-lg !border !border-gray-100"
              >
                Current version
              </a-tag>
            </div>
            <div class="text-xs text-gray-500">
              Publish time：{{ moment(publishHistory.created_at * 1000).format('YYYY-MM-DD HH:mm') }}
            </div>
          </div>
          <!-- 回退按钮 -->
          <a-button
            size="small"
            class="rounded-lg hidden group-hover:block"
            @click="
              async () => {
                await handleFallBackHistoryToDraft(
                  String(props.app?.id),
                  String(publishHistory.id),
                  async () => {
                    emits('update:visible', false)
                    emits('loadDraftAppConfig')
                  },
                )
              }
            "
          >
            FallBack
          </a-button>
        </div>
      </a-card>
      <!-- 数据加载状态 -->
      <div v-if="paginator.total_page >= 2" class="flex items-center justify-center">
        <!-- 数据加载中 -->
        <a-space v-if="paginator.current_page <= paginator.total_page" class="my-4">
          <a-spin />
          <div class="text-gray-400">Loading</div>
        </a-space>
        <!-- 数据加载完成 -->
        <div v-else class="text-gray-400 my-4">Data loading completed</div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<style scoped>

</style>