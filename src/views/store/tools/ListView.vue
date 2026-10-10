<script setup lang="ts">
import { getCategories, getBuiltinTools } from '@/services/builtin-tools'
import { apiPrefix,typeMap } from '@/config'
import { computed, onMounted, reactive, ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import moment from 'moment'
//declare variables
const categories = reactive<Array<any>>([])
const providers = reactive<Array<any>>([])
const loading = ref<boolean>(false)
const category = ref<string>('all')
const search_word = ref<string>('')
const showIdx = ref<number>(-1)
const filterProviders = computed(() => {
  return providers.filter((item) => {
    // Search for category info and keywords separately, and only return data when both match.
    const matchCategory = category.value === 'all' || item.category === category.value
    const matchSearchWord =
      search_word.value === '' || item.label.toLowerCase().includes(search_word.value)

    return matchCategory && matchSearchWord
  })
})
onMounted(async () => {
  const resp = await getCategories()
  categories.push(...resp.data)
})

onMounted(async () => {
  try {
    loading.value = true
    const resp = await getBuiltinTools()
    providers.push(...resp.data)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <a-spin :loading="loading" class="block h-full w-full">
    <div class="p-6 flex flex-col">
      <!--Top title + create button -->
      <div class="flex items-center justify-between mb-6">
        <!--Left title -->
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700">
            <icon-common :size="18" />
          </a-avatar>
          <div class="text-lg font-medium text-gray-900">Tools</div>
        </div>
        <!-- Create button -->
        <a-button type="primary" class="rounded-lg">
          <template #icon>
            <PlusOutlined />
          </template>
          Create Plugin
        </a-button>
      </div>
      <!-- Plugin categories+ search Box -->
      <div class="flex items-center justify-between mb-6">
        <!-- Left categories -->
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
        <!--   Right search   -->
        <a-input-search
          v-model="search_word"
          placeholder="Please input the name of plugin"
          class="w-[280px] bg-white rounded-lg border-gray-300"
        />
      </div>
      <!--  Plugin list at bottom    -->
      <a-row :gutter="[20, 20]" class="flex-1">
        <!--   with data  -->
        <a-col v-for="(provider,idx) in filterProviders" :key="provider.name" :span="6">
          <a-card hoverable class="cursor-pointer rounded-lg p-3" @click="showIdx=idx">
            <!-- Provider Name at top -->
            <div class="flex items-center gap-3 mb-3">
              <!--    Left Icon          -->
              <a-avatar :size="40" shape="square" :style="{ backgroundColor: provider.background }">
                <img
                  :src="`${apiPrefix}/builtin-tools/${provider.name}/icon`"
                  :alt="provider.name"
                />
              </a-avatar>
              <!-- Right text info -->
              <div class="flex-1 min-w-0">
                <div class="text-base font-bold text-gray-900">{{ provider.label }}</div>
                <div class="text-xs text-gray-500 line-clamp-1">
                  Provider {{ provider.name }}·{{ provider.tools.length }} plugin
                </div>
              </div>
            </div>
            <!-- Provider Description-->
            <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
              {{ provider.description }}
            </div>
            <!-- Provider publish information -->
            <div class="flex items-center gap-1.5">
              <a-avatar :size="18" class="bg-blue-700">
                <icon-user />
              </a-avatar>
              <div class="text-xs text-gray-400">
                Kevin·Publish-time:{{ moment(provider.created_at).format('MM-DD HH:mm') }}
              </div>
            </div>
          </a-card>
        </a-col>
        <!--   without data      -->
        <a-col v-if="filterProviders.length == 0" :span="24">
          <a-empty
            description="There is no any built-in plugin"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
      <!-- Card Drawer  -->
      <a-drawer
        :visible="showIdx !=-1"
        :width="350"
        :footer="false"
        title="Tool Details"
        :drawer-style="{background: '#F9FAFB'}"
        @cancel="showIdx = -1"
      >
        <!-- Check if showIdx is -1, and hide it if so. -->
        <div v-if="showIdx != -1" class="">
          <!-- Top Provider Name -->
          <div class="flex items-center gap-3 mb-3">
            <!-- Icon on the left -->
            <a-avatar
              :size="40"
              shape="square"
              :style="{ backgroundColor: filterProviders[showIdx].background }"
            >
              <img
                :src="`${apiPrefix}/builtin-tools/${filterProviders[showIdx].name}/icon`"
                :alt="filterProviders[showIdx].name"
              />
            </a-avatar>
            <!-- Right Side Tool Info -->
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">
                {{ filterProviders[showIdx].label }}
              </div>
              <div class="text-xs text-gray-500 line-clamp-1">
                provider {{ filterProviders[showIdx].name }} ·
                {{ filterProviders[showIdx].tools.length }} plugin
              </div>
            </div>
          </div>
          <!-- Description of provider -->
          <div class="leading-[18px] text-gray-500 mb-2">
            {{ filterProviders[showIdx].description }}
          </div>
          <!-- Separator -->
          <hr class="my-4" />
          <!-- Tool of provider -->
          <div class="flex flex-col gap-2">
            <div class="text-xs text-gray-500">
              Include {{ filterProviders[showIdx].tools.length }} tools
            </div>
            <!-- Tool list -->
            <a-card
              v-for="tool in filterProviders[showIdx].tools"
              :key="tool.name"
              class="cursor-pointer flex flex-col rounded-xl"
            >
              <!-- Tool name -->
              <div class="font-bold text-gray-900 mb-2">{{ tool.label }}</div>
              <!-- Tool description -->
              <div class="text-gray-500 text-xs">{{ tool.description }}</div>
              <!-- Tool parameters -->
              <div v-if="tool.inputs.length > 0" class="">
                <!-- Separator -->
                <div class="flex items-center gap-2 my-4">
                  <div class="text-xs font-bold text-gray-500">Parameters</div>
                  <hr class="flex-1" />
                </div>
                <!-- List of parameters -->
                <div class="flex flex-col gap-4">
                  <div v-for="input in tool.inputs" :key="input.name" class="flex flex-col gap-2">
                    <!-- Top section -->
                    <div class="flex items-center gap-2 text-xs">
                      <div class="text-gray-900 font-bold">{{ input.name }}</div>
                      <div class="text-gray-500">{{ typeMap[input.type] }}</div>
                      <div v-if="input.required" class="text-red-700">Required</div>
                    </div>
                    <!-- Parameters information -->
                    <div class="text-xs text-gray-500">{{ input.description }}</div>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </a-drawer>
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
