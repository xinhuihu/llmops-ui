import { h, ref } from 'vue'
import { useRoute } from 'vue-router'
import  type {
  GetApiKeysWithPageResponse,
  UpdateApiKeyRequest,
  CreateApiKeyRequest
} from '@/models/api-key'

import {
  getApiKeysWithPage,
  deleteApiKey,
  updateApiKey,
  updateApiKeyIsActive,
  createApiKey
} from '@/services/api-key'
import { Message, Modal } from '@arco-design/web-vue'

export const useGetApiKeysWithPage = () => {
  //Define the data required for hooks
  const route = useRoute()
  const loading = ref(false)
  const api_keys = ref<GetApiKeysWithPageResponse['data']['list']>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = ref({ ...defaultPaginator })

  // data loading function
  const loadApiKeys = async (init: boolean = false) => {
    if (!init && paginator.value.current_page > paginator.value.total_page) {
      return
    }

    //Load more data
    try {
      loading.value = true
      const resp = await getApiKeysWithPage({
        current_page: (route.query?.current_page || 1) as number,
        page_size: (route.query?.page_size || 20) as number,
      })
      const data = resp.data

      // update paginator
      paginator.value = data.paginator

      // For pagination implemented with a table plus pager, you can directly fill in data for replacement.
      api_keys.value = data.list
    } finally {
      loading.value = false
    }
  }

  return { loading, api_keys, paginator, loadApiKeys }
}

export const useDeleteApiKey = () => {
  const handleDeleteApiKey = (api_key_id: string, callback?: () => void) => {
    Modal.warning({
      title: 'Do you want to delete this API secret key?',
      content:
        'Once deleted, the key cannot be restored and will lose access to all Agents in your personal workspace. ' +
        'Use disable for temporary suspension.',
      hideCancel: false,
      onOk: async () => {
        try {
          // Send a request to the API interface after clicking OK
          const resp = await deleteApiKey(api_key_id)
          Message.success(resp.message)
        } finally {
          //  Perform the callback function
          callback && callback()
        }
      },
    })
  }

  return { handleDeleteApiKey }
}

export const useUpdateApiKey = () => {
  // Define the variables for the hooks
  const loading = ref(false)

  // handler for updating the api key
  const handleUpdateApiKey = async (api_key_id: string, req: UpdateApiKeyRequest) => {
    try {
      loading.value = true
      const resp = await updateApiKey(api_key_id, req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateApiKey }
}

export const useUpdateApiKeyIsActive = () => {
  //Define the variables for the hooks
  const loading = ref(false)

  // handler for activating the api key
  const handleUpdateApiKeyIsActive = async (
    api_key_id: string,
    is_active: boolean,
    callback?: () => void,
  ) => {
    try {
      loading.value = true
      const resp = await updateApiKeyIsActive(api_key_id, is_active)
      Message.success(resp.message)
    } finally {
      loading.value = false
      callback && callback()
    }
  }

  return { loading, handleUpdateApiKeyIsActive }
}

export const useCreateApiKey = () => {
  // Define the variables for the hooks
  const loading = ref(false)

  // Copy the key to the clipboard.
  const copyKey = async (api_key: string) => {
    try {
      await navigator.clipboard.writeText(api_key)
      Message.success('Copy succeeded')
    } catch (err) {
      Message.error(String(err))
    }
  }

  // handler for crating the api key
  const handleCreateApiKey = async (req: CreateApiKeyRequest) => {
    try {
      loading.value = true
      const resp = await createApiKey(req)
      const api_key = resp.data?.api_key

      // The secret is only returned once, so surface it in a prompt with a
      // copy action instead of a plain toast.
      if (api_key) {
        Modal.success({
          title: 'API Key created',
          content: () =>
            h('div', { class: 'flex flex-col gap-3' }, [
              h(
                'div',
                { class: 'text-sm text-gray-500' },
                'Please copy and keep the key now. It is shown only once.',
              ),
              h('div', { class: 'flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2' }, [
                h('span', { class: 'flex-1 break-all font-mono text-sm text-gray-700' }, api_key),
                h(
                  'button',
                  { class: 'shrink-0 text-sm text-blue-500 hover:text-blue-700', onClick: () => copyKey(api_key) },
                  'Copy',
                ),
              ]),
            ]),
        })
      } else {
        Message.success(resp.message)
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, handleCreateApiKey }
}
