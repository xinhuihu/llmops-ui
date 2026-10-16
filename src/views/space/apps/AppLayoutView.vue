<script setup lang="ts">
import moment from 'moment'
import { useRoute } from 'vue-router'
import { useCancelPublish, useGetApp, usePublish } from '@/hooks/use-app'
import { onMounted, ref } from 'vue'
import PublishHistoryDrawer from '@/views/space/apps/components/PublishHistoryDrawer.vue'
const route = useRoute()
const publishHistoryDrawerVisible = ref(false)
const { loading, app, loadApp } = useGetApp()
const { loading: publishLoading, handlePublish } = usePublish()
const { handleCancelPublish } = useCancelPublish()

onMounted(async () => await loadApp(String(route.params?.app_id)))
</script>

<template>
  <!--外层容器 -->
  <div class="min-h-screen flex flex-col h-full overflow-hidden">
    <!-- 顶部导航 -->
    <div class="h-[77px] bg-gray-50 p-4 flex items-center justify-between relative border-b">
      <!-- 左侧应用信息 -->
      <div class="flex items-center gap-2">
        <!-- 回退按钮 -->
        <router-link :to="{ name: 'space-apps-list' }">
          <a-button size="mini">
            <template #icon>
              <icon-left />
            </template>
          </a-button>
        </router-link>
        <!-- 应用容器 -->
        <div class="flex items-center gap-3">
          <!-- 应用图标 -->
          <a-avatar :size="40" shape="square" class="rounded-lg" :image-url="app.icon" />
          <!-- 应用信息 -->
          <div class="flex flex-col justify-between h-[40px]">
            <a-skeleton-line v-if="loading" :widths="[100]" />
            <div v-else class="text-gray-700 font-bold">{{ app.name }}</div>
            <div v-if="loading" class="flex items-center gap-2">
              <a-skeleton-line :widths="[60]" :line-height="18" />
              <a-skeleton-line :widths="[60]" :line-height="18" />
              <a-skeleton-line :widths="[60]" :line-height="18" />
            </div>
            <div v-else class="flex items-center gap-2">
              <div class="flex items-center h-[18px] text-xs text-gray-500">
                <icon-user />
                Personal-space
              </div>
              <div class="flex items-center h-[18px] text-xs text-gray-500">
                <icon-schedule />
                {{ app.status === 'draft' ? 'Draft' : 'Published' }}
              </div>
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                 Saved {{ moment(app.draft_updated_at * 1000).format('HH:mm:ss') }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
      <!-- 导航菜单 -->
      <div class="absolute left-1/2 -translate-x-1/2">
        <div class="flex items-center gap-6 tab-wrap">
          <router-link
            v-slot="{ navigate, isActive }"
            :to="{ name: 'space-apps-detail', params: { app_id: String(route.params?.app_id) } }"
            custom
          >
            <a-button
              type="text"
              class="tab-item"
              :class="{ 'tab-item--active': isActive }"
              @click="navigate"
            >
              Agent-config
            </a-button>
          </router-link>
          <router-link
            v-slot="{ navigate, isActive }"
            :to="{ name: 'space-apps-published', params: { app_id: String(route.params?.app_id) } }"
            custom
          >
            <a-button
              type="text"
              class="tab-item"
              :class="{ 'tab-item--active': isActive }"
              @click="navigate"
            >
              Publish-config
            </a-button>
          </router-link>
          <router-link
            v-slot="{ navigate, isActive }"
            :to="{ name: 'space-apps-analysis', params: { app_id: String(route.params?.app_id) } }"
            custom
          >
            <a-button
              type="text"
              class="tab-item"
              :class="{ 'tab-item--active': isActive }"
              @click="navigate"
            >
              Statistic
            </a-button>
          </router-link>
        </div>
      </div>
      <!-- 右侧按钮信息 -->
      <div class="">
        <a-space :size="12">
          <a-button
            :disabled="loading"
            class="rounded-lg"
            @click="publishHistoryDrawerVisible = true"
          >
            <template #icon>
              <icon-schedule />
            </template>
          </a-button>
          <a-button-group>
            <a-button
              :disabled="loading"
              :loading="publishLoading"
              type="primary"
              class="!rounded-tl-lg !rounded-bl-lg"
              @click="
                async () => {
                  const app_id = String(route.params?.app_id)
                  await handlePublish(app_id)
                  await loadApp(app_id)
                }
              "
            >
              Publish
            </a-button>
            <a-dropdown position="br">
              <a-button
                :disabled="loading"
                type="primary"
                class="!rounded-tr-lg !rounded-br-lg !w-5"
              >
                <template #icon>
                  <icon-down />
                </template>
              </a-button>
              <template #content>
                <a-doption
                  :disabled="app.status === 'draft'"
                  class="!text-red-700"
                  @click="
                    async () => {
                      const app_id = String(route.params?.app_id)
                      await handleCancelPublish(app_id, async () => await loadApp(app_id))
                    }
                  "
                >
                  Unpublish
                </a-doption>
              </template>
            </a-dropdown>
          </a-button-group>
        </a-space>
      </div>
    </div>
    <!-- 底部内容区域 -->
    <router-view :app="app" />
    <!-- 发布历史抽屉组件 -->
    <publish-history-drawer
      :app="app"
      v-model:visible="publishHistoryDrawerVisible"
      @load-draft-app-config="() => {}"
    />
  </div>
</template>

<style scoped>
.tab-wrap :deep(.arco-btn) {
  border-radius: 0 !important;
  padding: 8px 12px !important;
  background: transparent !important;
  border: none !important;
  position: relative;
  color: #5f6368;
  transition: color 0.2s ease;
}

.tab-wrap :deep(.arco-btn:hover) {
  background-color: transparent !important;
  color: #3370ff;
}

.tab-wrap :deep(.tab-item--active.arco-btn) {
  color: #3370ff !important;
  font-weight: 600 !important;
}

.tab-wrap :deep(.tab-item--active.arco-btn::after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3370ff;
}
</style>