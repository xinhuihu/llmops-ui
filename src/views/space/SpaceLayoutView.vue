<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const createType = ref<string>('')
const searchWord = ref(route.query?.search_word || '')

// Bind event of search input box
const search = (value: string) => {
  router.push({
    path: route.path,
    query: {
      search_word: value,
    },
  })
}

// Update createType value
const updateCreateType = (value: string) => {
  createType.value = value
}

// monitor changes of search_word
watch(
  () => route.query?.search_word,
  () => {
    searchWord.value = route.query?.search_word || ''
  },
)
</script>

<template>
  <!-- Adjust margins + Hide -->
  <div class="px-6 flex flex-col overflow-hidden h-full">
    <div class="pt-6 sticky top-0 z-20 bg-gray-50">
      <!-- Top-level Title + Create Button -->
      <div class="flex items-center justify-between mb-6">
        <!-- Left Title -->
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700">
            <icon-user :size="18" />
          </a-avatar>
          <div class="text-lg font-medium text-gray-900">My Space</div>
        </div>
        <!-- create button -->
        <a-button
          v-if="route.path.startsWith('/space/apps')"
          type="primary"
          class="rounded-lg"
        >
          Create AI APP
        </a-button>
        <a-button
          v-if="route.path.startsWith('/space/tools')"
          type="primary"
          class="rounded-lg"
          @click="createType = 'tool'"
        >
          Create Plugin
        </a-button>
        <a-button
          v-if="route.path.startsWith('/space/workflows')"
          type="primary"
          class="rounded-lg"
        >
          Create Workflows
        </a-button>
        <a-button
          v-if="route.path.startsWith('/space/datasets')"
          type="primary"
          class="rounded-lg"
        >
          Create dataset
        </a-button>
      </div>
      <!-- 导航按钮+搜索框 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 左侧导航 -->
        <div class="flex items-center gap-2">
          <router-link
            to="/space/apps"
            class="rounded-lg text-gray-700 px-3 h-8 leading-8 hover:bg-gray-200 transition-all"
            active-class="bg-gray-100"
          >
            AI Apps
          </router-link>
          <router-link
            to="/space/tools"
            class="rounded-lg text-gray-700 px-3 h-8 leading-8 hover:bg-gray-200 transition-all"
            active-class="bg-gray-100"
          >
            Plugins
          </router-link>
          <router-link
            to="/space/workflows"
            class="rounded-lg text-gray-700 px-3 h-8 leading-8 hover:bg-gray-200 transition-all"
            active-class="bg-gray-100"
          >
            workflows
          </router-link>
          <router-link
            to="/space/datasets"
            class="rounded-lg text-gray-700 px-3 h-8 leading-8 hover:bg-gray-200 transition-all"
            active-class="bg-gray-100"
          >
            datasets
          </router-link>
        </div>
        <!-- 右侧搜索 -->
        <a-input-search
          v-model="searchWord"
          placeholder="please input the key word"
          class="w-[240px] bg-white rounded-lg border-gray-300"
          @search="search"
        />
      </div>
    </div>
    <!-- 中间内容 -->
    <router-view
      class="flex-1 min-h-0 overflow-hidden"
      :create-type="createType"
      @update-create-type="updateCreateType"
    />
  </div>
</template>

<style scoped></style>
