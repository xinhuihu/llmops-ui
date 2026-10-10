<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const create_api_key = ref(false)
</script>

<template>
  <!--调整边距+隐藏-->
  <div class="px-6 flex flex-col overflow-hidden h-full">
    <div class="pt-6 sticky top-0 z-20 bg-gray-50">
      <!-- 顶层标题+创建按钮 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 左侧标题 -->
        <div class="flex items-center gap-2">
          <a-avatar :size="32" class="bg-blue-700">
            <icon-user :size="18" />
          </a-avatar>
          <div class="flex items-center gap-2 text-lg font-medium text-gray-900">
            Api Keys
            <div class="text-xs text-gray-500">Quickly integrate with existing enterprise businesses using OpenAPI</div>
          </div>
        </div>
      </div>
      <!-- 导航按钮 -->
      <div class="flex items-center justify-between mb-2">
        <!-- 左侧导航 -->
        <nav class="flex items-center gap-6">
          <router-link
            to="/openapi"
            class="nav-tab"
            exact-active-class="nav-tab--active"
          >
            Quick Start
          </router-link>
          <router-link
            to="/openapi/api-keys"
            class="nav-tab"
            exact-active-class="nav-tab--active"
          >
            Api Key
          </router-link>
        </nav>
        <!-- 右侧按钮 -->
        <a-button
          v-if="route.path.startsWith('/openapi/api-keys')"
          type="primary"
          class="rounded-lg"
          @click="create_api_key = true"
        >
          Add Api key
        </a-button>
      </div>

    </div>
    <!-- 中间内容 -->
    <router-view v-model:create_api_key="create_api_key" />
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