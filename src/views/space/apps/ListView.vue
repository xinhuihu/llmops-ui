<script setup lang="ts">
import moment from 'moment/moment'
import { useRoute } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import { useCopyApp, useDeleteApp, useGetAppsWithPage } from '@/hooks/use-app'
import { useAccountStore } from '@/stores/account'
import CreateOrUpdateAppModal from './components/CreateOrUpdateAppModal.vue'
//1.define the required data for the page
const route = useRoute()
const props = defineProps({
  createType: { type: String, default: '', required: true },
})
const emits = defineEmits(['update-create-type'])

const createOrUpdateAppModalVisible = ref(false)
const updateAppId = ref('')
const accountStore = useAccountStore()
const { handleCopyApp } = useCopyApp()
const { loading: getAppsWithPageLoading, apps, paginator, loadApps } = useGetAppsWithPage()
const { handleDeleteApp } = useDeleteApp()


// 2.Define the handler of scroll data paginator
const handleScroll = async (event: UIEvent) => {
  // 1.Get the scroll distance, maximum scrollable distance, and the height of the client/browser window
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

  // 2.Determine whether it has scrolled to the bottom
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (getAppsWithPageLoading.value) return
    await loadApps()
  }
}

// Open the create modal when createType is 'app' (set by the "Create Agent" button or the sidebar query)
const openCreateModal = () => {
  updateAppId.value = ''
  createOrUpdateAppModalVisible.value = true
  emits('update-create-type', '')
}

//Execute after the page DOM is fully loaded
onMounted(async () => {
  // Initialize agent data
  await loadApps(true)

  // Open the create modal when landing with ?create_type=app (sidebar "Create Agent")
  if (props.createType === 'app') {
    openCreateModal()
  }
})

watch(
  () => props.createType,
  (newValue) => {
    if (newValue === 'app') {
      openCreateModal()
    }
  },
)

watch(
  () => route.query?.search_word,
  async () => await loadApps(true),
)
</script>
<template>
  <a-spin
    :loading="getAppsWithPageLoading"
    class="block h-full w-full scrollbar-w-none overflow-scroll"
    @scroll="handleScroll"
  >
    <!-- 底部应用列表 -->
    <a-row :gutter="[20, 20]" class="flex-1">
      <!-- 有数据的UI状态 -->
      <a-col v-for="app in apps" :key="app.id" :span="6">
        <a-card hoverable class="h-full cursor-pointer rounded-lg">
          <div class="flex items-center gap-3 mb-3">
            <!-- 左侧图标 -->
            <a-avatar :size="40" shape="square" :image-url="app.icon" />
            <!-- 右侧App信息 -->
            <div class="flex flex-1 justify-between">
              <div class="flex flex-col">
                <router-link
                  :to="{
                    name: 'space-apps-detail',
                    params: { app_id: app.id },
                  }"
                  class="text-base text-gray-900 font-bold line-clamp-1 break-all"
                >
                  {{ app.name }}
                </router-link>
                <div class="text-xs text-gray-500 line-clamp-1">
                  {{ app.model_config.provider }} · {{ app.model_config.model }}
                </div>
              </div>
              <!-- 操作按钮 -->
              <a-dropdown position="br">
                <a-button type="text" size="small" class="rounded-lg !text-gray-700">
                  <template #icon>
                    <icon-more />
                  </template>
                </a-button>
                <template #content>
                  <router-link :to="{ name: 'space-apps-analysis', params: { app_id: app.id } }">
                    <a-doption>Analyze </a-doption>
                  </router-link>
                  <a-doption
                    @click="
                      () => {
                        updateAppId = app.id
                        createOrUpdateAppModalVisible = true
                      }
                    "
                  >
                    Edit Agent
                  </a-doption>
                  <a-doption @click="async () => await handleCopyApp(app.id)">Crate a copy</a-doption>
                  <a-doption
                    @click="
                      async () => await handleDeleteApp(app.id, async () => await loadApps(true))
                    "
                  >
                    Delete
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </div>
          <!-- App的描述信息 -->
          <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2 break-all">
            {{ app.description.trim() === '' ? app.preset_prompt : app.description }}
          </div>
          <!-- 应用的归属者信息 -->
          <div class="flex items-center gap-1.5">
            <a-avatar :size="18" class="bg-blue-700">
              <icon-user />
            </a-avatar>
            <div class="text-xs text-gray-400">
              {{ accountStore.account.name }} · Recent edits
              {{ moment(app.created_at * 1000).format('MM-DD HH:mm') }}
            </div>
          </div>
        </a-card>
      </a-col>
      <!-- 没数据的UI状态 -->
      <a-col v-if="apps.length === 0" :span="24">
        <a-empty
          description="There is no any available agent"
          class="h-[400px] flex flex-col items-center justify-center"
        />
      </a-col>
    </a-row>
    <!-- 加载器 -->
    <a-row v-if="paginator.total_page >= 2">
      <!-- 加载数据中 -->
      <a-col v-if="paginator.current_page <= paginator.total_page" :span="24" align="center">
        <a-space class="my-4">
          <a-spin />
          <div class="text-gray-400">Loading</div>
        </a-space>
      </a-col>
      <!-- 数据加载完成 -->
      <a-col v-else :span="24" align="center">
        <div class="text-gray-400 my-4">Data loading completed</div>
      </a-col>
    </a-row>
    <!-- 新建/修改模态窗 -->
    <create-or-update-app-modal
      v-model:visible="createOrUpdateAppModalVisible"
      v-model:app_id="updateAppId"
      :callback="async () => await loadApps(true)"
    />
  </a-spin>
</template>

<style scoped></style>
