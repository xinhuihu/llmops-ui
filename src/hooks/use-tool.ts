import { reactive, ref } from 'vue'
import { getApiTool, getApiToolProvidersWithPage } from '@/services/api-tool'
import type { GetApiToolProvidersWithPageResponse } from '@/models/api-tools'

export const useGetApiTool = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const api_tool = reactive<Record<string, any>>({})

  // Define the loading function
  const loadApiTool = async (provider_id: string, tool_name: string) => {
    try {
      loading.value = true
      const resp = await getApiTool(provider_id, tool_name)
      const data = resp.data

      Object.assign(api_tool, data)
    } finally {
      loading.value = false
    }
  }

  return { loading, api_tool, loadApiTool }
}

export const useGetApiToolProvidersWithPage = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const api_tool_providers = reactive<GetApiToolProvidersWithPageResponse['data']['list']>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = reactive({ ...defaultPaginator })

  // Define the data loading function
  const loadApiToolProviders = async (init: boolean = false) => {
    // Determine whether it is an initialization. If so, initialize the paginator first.
    if (init) {
      Object.assign(paginator, { ...defaultPaginator })
    } else if (paginator.current_page > paginator.total_page) {
      return
    }

    // Load more data and update the data status
    try {
      // Call the interface to obtain response data
      loading.value = true
      const resp = await getApiToolProvidersWithPage(
        paginator.current_page,
        paginator.page_size,
        '',
      )
      const data = resp.data

      //Update the paginator
      updatePaginator(data)

      // Determine whether more data exists
      if (paginator.current_page <= paginator.total_page) {
        paginator.current_page += 1
      }

      //Append or overwrite data
      if (init) {
        api_tool_providers.splice(0, api_tool_providers.length, ...data.list)
      } else {
        api_tool_providers.push(...data.list)
      }
    } finally {
      loading.value = false
    }
  }

  //Define the function for updating the paginator
  const updatePaginator = (data: any) => {
    paginator.current_page = data.paginator.current_page
    paginator.page_size = data.paginator.page_size
    paginator.total_page = data.paginator.total_page
    paginator.total_record = data.paginator.total_record
  }

  return { loading, api_tool_providers, paginator, loadApiToolProviders }
}
