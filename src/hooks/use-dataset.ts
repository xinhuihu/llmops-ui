import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createDataset,
  deleteDataset,
  deleteDocument,
  getDataset,
  getDatasetsWithPage,
  getDocumentsWithPage,
  updateDataset,
  updateDocumentEnabled,
} from '@/services/datasets'
import { getTaskStatus } from '@/services/task'
import { Form, Message, Modal } from '@arco-design/web-vue'

export const useGetDatasetsWithPage = () => {
  // Define the data, covering data loading status, knowledge base list and paginator.
  const route = useRoute()
  const loading = ref(false)
  const datasets = reactive<Array<any>>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = reactive({ ...defaultPaginator })

  // Define the function for loading data
  const loadDatasets = async (init: boolean = false) => {
    // Determine whether initialization is required; if so, initialize the paginator first.
    if (init) {
      initPaginator()
    } else if (paginator.current_page > paginator.total_page) {
      return
    }

    // Load more data and update the data status
    try {
      // Call the interface to obtain response data
      loading.value = true
      const resp = await getDatasetsWithPage(
        paginator.current_page,
        paginator.page_size,
        String(route.query?.search_word ?? ''),
      )
      const data = resp.data

      // Update the paginator
      updatePaginator(data)

      // Determine whether more data exists
      if (paginator.current_page <= paginator.total_page) {
        paginator.current_page += 1
      }

      // Append or overwrite data
      if (init) {
        datasets.splice(0, datasets.length, ...data.list)
      } else {
        datasets.push(...data.list)
      }
    } finally {
      loading.value = false
    }
  }

  // Define the function to initialize the paginator
  const initPaginator = () => {
    Object.assign(paginator, { ...defaultPaginator })
  }

  // Define the updated paginator function
  const updatePaginator = (data: any) => {
    paginator.current_page = data.paginator.current_page
    paginator.page_size = data.paginator.page_size
    paginator.total_page = data.paginator.total_page
    paginator.total_record = data.paginator.total_record
  }

  // Initialize data when the page DOM is fully loaded
  onMounted(async () => {
    await loadDatasets(true)
  })

  //Listen for changes in route query parameters
  watch(
    () => route.query?.search_word,
    async () => {
      await loadDatasets(true)
    },
  )

  return { loading, datasets, paginator, loadDatasets }
}

// Poll the async task status until it reaches a terminal state
const pollTask = (task_id: string) => {
  return new Promise<void>((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 100 // 100 * 3s = 300s timeout
    const timer = setInterval(async () => {
      attempts++
      try {
        const resp = await getTaskStatus(task_id)
        const status = resp.data.status
        if (status === 'success') {
          clearInterval(timer)
          resolve()
        } else if (status === 'failed') {
          clearInterval(timer)
          reject(new Error(resp.data.error || 'Delete task failed'))
        } else if (attempts >= maxAttempts) {
          clearInterval(timer)
          reject(new Error('Delete task timed out, please refresh later'))
        }
      } catch (e) {
        clearInterval(timer)
        reject(e)
      }
    }, 3000)
  })
}

export const useDeleteDataset = () => {
  const handleDelete = (dataset_id: string, callback?: () => void) => {
    const isEn = true // You can replace this with your own logic to determine the language
    Modal.warning({
      title: 'Do you want to delete the knowledge base?',
      content:
        'Deletion will disable use by associated apps and permanently delete all documents and prompt configurations.',
      hideCancel: false,
      okText: isEn ? 'Confirm' : '确定',
      cancelText: isEn ? 'Cancel' : '取消',
      onOk: async () => {
        try {
          // Send a request to the API interface after clicking OK
          const resp = await deleteDataset(dataset_id)
          // Poll the async task status until it reaches a terminal state
          Message.success(String(resp.data.message))
          await pollTask(resp.data.task_id)
          Message.success('Dataset deleted successfully')
        } catch (e) {
          Message.error((e as Error)?.message || 'Delete failed')
        } finally {
          // Invoke the callback function to specify the callback functionality
          callback && callback()
        }
      },
    })
  }

  return { handleDelete }
}

export const useCreateOrUpdateDataset = () => {
  // 1.Define the data required for addition and update
  const loading = ref(false)
  const defaultForm = {
    fileList: [] as any[],
    icon: '',
    name: '',
    description: '',
  }
  const form = reactive({ ...defaultForm })
  const formRef = ref<InstanceType<typeof Form>>()
  const showUpdateModal = ref(false)

  // 2.Define and update the showUpdateModal function
  const updateShowUpdateModal = (new_value: boolean, callback?: () => void) => {
    showUpdateModal.value = new_value
    callback && callback()
  }

  // 3.Define the form‑submission function
  const saveDataset = async (dataset_id?: string) => {
    try {
      loading.value = true
      if (dataset_id !== undefined && dataset_id !== '') {
        const resp = await updateDataset(dataset_id, {
          icon: form.icon,
          name: form.name,
          description: form.description,
        })
        Message.success(resp.message)
      } else {
        const resp = await createDataset({
          icon: form.icon,
          name: form.name,
          description: form.description,
        })
        Message.success(resp.message)
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, form, formRef, saveDataset, showUpdateModal, updateShowUpdateModal }
}

export const useGetDataset = (dataset_id: string) => {
  // Define the data for obtaining knowledge base details
  const loading = ref(false)
  const dataset = reactive<any>({})

  // Define the data‑loading function
  const loadDataset = async (dataset_id: string) => {
    try {
      loading.value = true
      const resp = await getDataset(dataset_id)
      const data = resp.data
      Object.assign(dataset, { ...data })
    } finally {
      loading.value = false
    }
  }

  // Load data once when the page finishes mounting
  onMounted(() => loadDataset(dataset_id))

  return { loading, dataset, loadDataset }
}

export const useGetDocumentsWithPage = (dataset_id: string) => {
  // Define the data structure for obtaining the document listDefine the data structure for obtaining the document list
  const route = useRoute()
  const loading = ref(false)
  const documents = reactive<Array<any>>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = reactive({ ...defaultPaginator })

  // Load document list data
  const loadDocuments = async (init: boolean = false) => {
    // Determine whether it is the logic for initialization and the pager
    if (!init && paginator.current_page > paginator.total_page) return

    try {
      // Call the interface to get the response data
      loading.value = true
      const resp = await getDocumentsWithPage(dataset_id, {
        current_page: (route.query?.current_page || 1) as number,
        page_size: (route.query?.page_size || 20) as number,
        search_word: (route.query?.search_word || '') as string,
      })
      const data = resp.data

      // Update the pager
      updatePaginator(data)

      // For pagination implemented by a table plus a pager, you can directly fill in data for replacement.
      documents.splice(0, documents.length, ...data.list)
    } finally {
      loading.value = false
    }
  }
  // Define the pager initialization function
  const initPaginator = () => {
    Object.assign(paginator, { ...defaultPaginator })
  }

  // Define the updated paginator function
  const updatePaginator = (data: any) => {
    paginator.current_page = data.paginator.current_page
    paginator.page_size = data.paginator.page_size
    paginator.total_page = data.paginator.total_page
    paginator.total_record = data.paginator.total_record
  }

  // Initialize data when the page DOM is loaded
  onMounted(async () => {
    await loadDocuments(true)
  })

  // Listen for changes to route query parameters
  watch(
    () => route.query,
    async (newQuery, oldQuery) => {
      if (newQuery.search_word !== oldQuery.search_word) {
        initPaginator()
        await loadDocuments(true)
      } else if (newQuery.current_page != oldQuery.current_page) {
        await loadDocuments()
      }
    },
  )

  return { loading, documents, paginator, loadDocuments }
}

export const useDeleteDocument = () => {
  const handleDelete = (dataset_id: string, document_id: string, callback?: () => void) => {
    Modal.warning({
      title: 'Do you want to delete this document?',
      content:
        'After deleting the document, it will no longer be retrievable in the knowledge base/vector database. ' +
        'If you need to temporarily disable retrieval for this document, you may use the disable function.',
      hideCancel: false,
      onOk: async () => {
        try {
          // Send a request to the API interface after clicking OK
          const resp = await deleteDocument(dataset_id, document_id)
          Message.success(resp.message)
        } finally {
          // Invoke the callback function to specify the callback functionality
          callback && callback()
        }
      },
    })
  }

  return { handleDelete }
}

export const useUpdateDocumentEnabled = () => {
  const handleUpdate = async (
    dataset_id: string,
    document_id: string,
    enabled: boolean,
    callback?: () => void,
  ) => {
    try {
      const resp = await updateDocumentEnabled(dataset_id, document_id, enabled)
      Message.success(resp.message)
    } finally {
      // Call the callback function to specify the callback functionality
      callback && callback()
    }
  }

  return { handleUpdate }
}
