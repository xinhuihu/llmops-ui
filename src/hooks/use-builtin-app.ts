import {ref } from 'vue'
import type {
  GetBuiltinAppCategoriesResponse,
  GetBuiltinAppsResponse
} from '@/models/builtin-app'
import {
  addBuiltinAppToSpace,
  getBuiltinAppCategories,
  getBuiltinApps,
} from '@/services/builtin-app'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'

export const useGetBuiltinAppCategories = () => {
  // 1.Define the required data for hook
  const loading = ref(false)
  const categories = ref<GetBuiltinAppCategoriesResponse['data']>([])

  // 2.Define loading agent categories function
  const loadBuiltinAppCategories = async () => {
    try {
      loading.value = true
      const resp = await getBuiltinAppCategories()
      categories.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, categories, loadBuiltinAppCategories }
}

export const useGetBuiltinApps = () => {
  // 1.Define the required data for hook
  const loading = ref(false)
  const apps = ref<GetBuiltinAppsResponse['data']>([])

  // 2.Define loading agent function
  const loadBuiltinApps = async () => {
    try {
      loading.value = true
      const resp = await getBuiltinApps()
      apps.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, apps, loadBuiltinApps }
}

export const useAddBuiltinAppToSpace = () => {
  // 1.Define the required data for hook
  const router = useRouter()
  const loading = ref(false)

  // 2. Define the function to add the built-in agent to the personal
  const handleAddBuiltinAppToSpace = async (builtin_app_id: string) => {
    try {
      loading.value = true
      const resp = await addBuiltinAppToSpace(builtin_app_id)
      Message.success('The built-in agent has been successfully added to the personal workspace')
      await router.push({
        name: 'space-apps-detail',
        params: { app_id: resp.data.id },
      })
    } finally {
      loading.value = false
    }
  }
  return { loading, handleAddBuiltinAppToSpace }
}