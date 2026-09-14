<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authorize } from '@/services/oauth'
import { Message } from '@arco-design/web-vue'
import { useCredentialStore } from '@/stores/credential'

// 1.Define the data required for the page
const route = useRoute()
const router = useRouter()
const credentialStore = useCredentialStore()

onMounted(async () => {
  try {
    // 1.Call the authorized interface to login
    const resp = await authorize(route.params?.provider_name as string, route.query?.code as string)
    Message.success('Login successful, redirecting')

    // 2.Update user authorization data and redirect to the home page
    credentialStore.update(resp.data)
    await router.replace({ path: '/home' })
  } catch (error) {
    // 3.Redirect to the login page if an error occurs
    await router.replace({ path: '/auth/login' })
  }
})
</script>

<template>
  <div class="w-full min-h-screen flex items-center justify-center bg-white">
    <a-spin tip="Third‑party authorization login in progress..."></a-spin>
  </div>
</template>

<style scoped></style>
