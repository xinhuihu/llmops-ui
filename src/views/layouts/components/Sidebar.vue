<script setup lang="ts">
import { useRoute } from 'vue-router'
import IconHomeFull from '@/components/icons/IconHomeFull.vue'
import IconAppFull from '@/components/icons/IconAppFull.vue'
import IconOpenApi from '@/components/icons/IconOpenApi.vue'
import IconHome from '@/components/icons/IconHome.vue'
import IconSpaceFull from '@/components/icons/IconSpaceFull.vue'
import IconSpace from '@/components/icons/IconSpace.vue'
import IconToolFull from '@/components/icons/IconToolFull.vue'
import IconTool from '@/components/icons/IconTool.vue'
import IconApp from '@/components/icons/IconApp.vue'
import IconOpenApiFull from '@/components/icons/IconOpenApiFull.vue'

// 1.定义自定义组件所需数据
const route = useRoute()
</script>

<template>
  <div class="flex flex-col gap-2">
    <router-link
      to="/home"
      class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
      active-class="bg-gray-100"
    >
      <icon-home-full v-if="route.path.startsWith('/home')" />
      <icon-home v-else />
      Home
    </router-link>
    <router-link
      to="/space"
      :class="`flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 ${route.path.startsWith('/space')? 'bg-gray-100':''}`"
      active-class="bg-gray-100"
    >
      <icon-space-full v-if="route.path.startsWith('/space')" />
      <icon-space v-else />
      My Space
    </router-link>
    <div class="text-gray-500 text-sm px-2">Explore</div>
    <router-link
      to="/store/apps"
      class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
      active-class="bg-gray-100"
    >
      <icon-app-full v-if="route.path.startsWith('/store/apps')" />
      <icon-app v-else />
      Agent
    </router-link>
    <router-link
      to="/store/tools"
      class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
      active-class="bg-gray-100"
    >
      <icon-tool-full v-if="route.path.startsWith('/store/tools')" />
      <icon-tool v-else />
      Tools
    </router-link>
    <router-link
      to="/openapi"
      class="flex items-center gap-2 h-8 leading-8 rounded-lg transition-all px-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200"
      active-class="bg-gray-100"
    >
      <icon-open-api-full v-if="route.path.startsWith('/openapi')" />
      <icon-open-api v-else />
      Api Keys
    </router-link>
  </div>
</template>

<style scoped></style>
