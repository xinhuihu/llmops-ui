<script setup lang="ts">
import bannerImage from '@/assets/images/login-banner.png'

// 轮播图列表
const carousels = [
  {
    slogan: 'High-quality AI orchestration Platform',
    subSlogan: 'Rich application components covering most typical business scenarios',
    image: bannerImage,
  },
  {
    slogan: 'Create native AI agent in 5 minutes',
    subSlogan: 'Efficiently develop your AI-native applications',
    image: bannerImage,
  },
]
</script>

<template>
  <div
    class="w-[550px] flex items-center justify-center bg-gradient-to-tr from-[#1d2129] to-[#00308f]"
  >
    <div class="flex-1 h-full">
      <a-carousel animation-name="fade" class="h-full">
        <a-carousel-item v-for="carousel in carousels" :key="carousel.slogan">
          <div class="flex flex-col items-center justify-center h-full">
            <div class="text-2xl leading-7 font-bold text-gray-100">{{ carousel.slogan }}</div>
            <div class="mt-2 text-gray-400 leading-[22px]">{{ carousel.subSlogan }}</div>
            <img :src="carousel.image" alt="WenQu ai platform" class="w-[320px] mt-[30px]" />
          </div>
        </a-carousel-item>
      </a-carousel>
    </div>
  </div>
</template>

<style scoped></style>
