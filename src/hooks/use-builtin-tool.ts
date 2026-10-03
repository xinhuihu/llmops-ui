import { onMounted, reactive, ref } from 'vue'
import { getBuiltinTool, getBuiltinTools, getCategories } from '@/services/builtin-tools'

export const useGetCategories = () => {
  // Define the required data for hooks
  const loading = ref(false)
  const categories = reactive<Record<string, any>[]>([])

  // Define the data loading function
  const loadCategories = async () => {
    try {
      loading.value = true
      const resp = await getCategories()
      const data = resp.data

      categories.splice(0, categories.length, ...data)
    } finally {
      loading.value = false
    }
  }

  // Execute after the page DOM is fully loaded
  onMounted(async () => await loadCategories())

  return { loading, categories, loadCategories }
}

export const useGetBuiltinTool = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const builtin_tool = reactive<Record<string, any>>({})

  // Define the loading function
  const loadBuiltinTool = async (provider_name: string, tool_name: string) => {
    try {
      loading.value = true
      const resp = await getBuiltinTool(provider_name, tool_name)
      const data = resp.data

      Object.assign(builtin_tool, data)
    } finally {
      loading.value = false
    }
  }

  return { loading, builtin_tool, loadBuiltinTool }
}

export const useGetBuiltinTools = () => {
  // Define the data required for custom hooks
  const loading = ref(false)
  const builtin_tools = reactive<Record<string, any>[]>([])

  // Define the data loading function
  const loadBuiltinTools = async () => {
    try {
      loading.value = true
      const resp = await getBuiltinTools()
      const data = resp.data

      builtin_tools.splice(0, builtin_tools.length, ...data)
    } finally {
      loading.value = false
    }
  }

  return { loading, builtin_tools, loadBuiltinTools }
}
