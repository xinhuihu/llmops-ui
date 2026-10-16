<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const createType = ref<string>(String(route.query?.create_type ?? ''))
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
  // Remove the one-shot ?create_type= query param once consumed, so clicking the
  // sidebar "Create Agent" again re-triggers instead of being a same-URL no-op.
  if (value === '' && route.query?.create_type) {
    router.replace({ query: { ...route.query, create_type: undefined } })
  }
}

// monitor changes of search_word
watch(
  () => route.query?.search_word,
  () => {
    searchWord.value = route.query?.search_word || ''
  },
)

// monitor changes of create_type (set by the sidebar "Create Agent" button)
watch(
  () => route.query?.create_type,
  (value) => {
    createType.value = String(value ?? '')
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
          @click="createType = 'app'"
        >
          Create Agent
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
          @click="createType = 'dataset'"
        >
          Create dataset
        </a-button>
      </div>
      <!-- Navigation Buttons + Search Box -->
      <div class="flex items-center justify-between mb-6">
        <!-- Left‑side navigation -->
        <nav class="flex items-center gap-6">
          <router-link
            to="/space/apps"
            class="nav-tab"
            active-class="nav-tab--active"
          >
            Agent
          </router-link>
          <router-link
            to="/space/tools"
            class="nav-tab"
            active-class="nav-tab--active"
          >
            Tool
          </router-link>
          <router-link
            to="/space/workflows"
            class="nav-tab"
            active-class="nav-tab--active"
          >
            Workflow
          </router-link>
          <router-link
            to="/space/datasets"
            class="nav-tab"
            active-class="nav-tab--active"
          >
            Knowledge Base
          </router-link>
        </nav>
        <!-- Search on the right -->
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

<style scoped>
.nav-tab {
  position: relative;
  padding: 8px 12px;
  color: #5f6368;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}
.nav-tab:hover {
  color: #3370ff;
}
.nav-tab::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}
.nav-tab--active {
  color: #3370ff;
  font-weight: 600;
}
.nav-tab--active::after {
  background-color: #3370ff;
}
</style>
