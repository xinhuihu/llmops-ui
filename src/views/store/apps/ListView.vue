<script setup lang="ts">
import {
  useAddBuiltinAppToSpace,
  useGetBuiltinAppCategories,
  useGetBuiltinApps,
} from '@/hooks/use-builtin-app'
import { computed, onMounted, ref } from 'vue'
import moment from 'moment/moment'
//1. define the required variables for this page
const category = ref('all')
const search_word = ref('')
const { loading: getBuiltinAppsLoading, apps, loadBuiltinApps } = useGetBuiltinApps()
const { categories, loadBuiltinAppCategories } = useGetBuiltinAppCategories()
const { handleAddBuiltinAppToSpace } = useAddBuiltinAppToSpace()

const filterApps = computed(() => {
  const keyword = search_word.value.trim().toLowerCase()
  return apps.value.filter((item) => {
    // Retrieve classification information plus search terms; data is returned only when both conditions are met.
    const matchCategory = category.value === 'all' || item.category === category.value
    const matchSearchWord =
      keyword === '' || item.name.toLowerCase().includes(keyword)

    return matchCategory && matchSearchWord
  })
})

onMounted(() => {
  loadBuiltinAppCategories()
  loadBuiltinApps()
})
</script>

<template>
  <a-spin :loading="getBuiltinAppsLoading" class="block h-full w-full">
    <div class="p-6 flex flex-col">
      <!-- 顶层标题 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 左侧标题 -->
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700">
            <icon-common :size="18" />
          </a-avatar>
          <div class="text-lg font-medium text-gray-900">Agents</div>
        </div>
      </div>
      <!-- 应用分类+搜索框 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 左侧分类 -->
        <div class="flex items-center gap-6 tab-wrap">
          <a-button
            type="text"
            class="tab-item"
            :class="{ 'tab-item--active': category === 'all' }"
            @click="category = 'all'"
          >All
          </a-button>
          <a-button
            v-for="item in categories"
            :key="item.category"
            type="text"
            class="tab-item"
            :class="{ 'tab-item--active': category === item.category }"
            @click="category = item.category"
          >
            {{ item.name }}
          </a-button>
        </div>
        <!-- 右侧搜索 -->
        <a-input-search
          v-model="search_word"
          placeholder="Please input the agent name"
          class="w-[240px] bg-white rounded-lg border-gray-300"
        />
      </div>
      <!-- 底部应用列表 -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <!-- 有数据的UI状态 -->
        <a-col v-for="(app, idx) in filterApps" :key="app.id" :span="6">
          <a-card hoverable class="h-full cursor-pointer rounded-lg">
            <!-- 顶部应用名称 -->
            <div class="flex items-center gap-3 mb-3">
              <!-- 左侧图标 -->
              <a-avatar :size="40" shape="square" :image-url="app.icon"/>
              <!-- 右侧App信息 -->
              <div class="flex flex-1 justify-between">
                <div class="flex flex-col">
                  <div class="text-base text-gray-900 font-bold line-clamp-1 break-all">{{ app.name }}</div>
                  <div class="text-xs text-gray-500 line-clamp-1">
                    {{ app.model_config.provider }} · {{ app.model_config.model }}
                  </div>
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
                  <a-doption @click="async () => await handleAddBuiltinAppToSpace(app.id)">
                    Add to workspace
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
            <!-- App的描述信息 -->
            <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2 break-all">
              {{ app.description }}
            </div>
            <!-- 应用的归属者信息 -->
            <div class="flex items-center gap-1.5">
              <a-avatar :size="18" class="bg-blue-700">
                <icon-user />
              </a-avatar>
              <div class="text-xs text-gray-400">
                WenQu · Publish Time
                {{ moment(app.created_at * 1000).format('MM-DD HH:mm') }}
              </div>
            </div>
          </a-card>
        </a-col>
        <!-- 没数据的UI状态 -->
        <a-col v-if="filterApps.length === 0" :span="24">
          <a-empty
            description="There is no any built-in agent"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>


    </div>
  </a-spin>
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