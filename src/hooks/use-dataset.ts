import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createDataset,
  deleteDataset,
  deleteDocument,
  getDataset,
  getDatasetsWithPage,
  getDocumentsWithPage,
  getDocument,
  updateDataset,
  updateDocumentEnabled,
  getSegmentsWithPage,
  updateSegmentEnabled,
  deleteSegment,
  createSegment,
  updateSegment,
  getSegment,
} from '@/services/datasets'
import type {
  CreateDocumentsRequest,
  CreateSegmentRequest,
  GetDocumentsWithPageRequest,
  HitRequest,
  UpdateSegmentRequest,
} from '@/models/datasets'
import { getTaskStatus } from '@/services/task'
import type { TaskProgressItem } from '@/models/task'
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

// Number of logical steps the backend reports while deleting a dataset
export const DELETE_DATASET_STEP_TOTAL = 8

// In-flight deletion state for a single dataset card
export type DeletingTask = {
  task_id: string
  status: string
  progress: Array<TaskProgressItem>
  error: string
}

export const useDeleteDataset = () => {
  const deletingTasks = reactive<Record<string, DeletingTask>>({})
  const timers: Array<ReturnType<typeof setInterval>> = []

  // Poll the async task status, updating the card state in real time until a terminal state
  const pollAndUpdate = (dataset_id: string, task_id: string) => {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 100 // 100 * 3s = 300s timeout
      const timer = setInterval(async () => {
        attempts++
        try {
          const resp = await getTaskStatus(task_id)
          const data = resp.data
          if (deletingTasks[dataset_id]) {
            deletingTasks[dataset_id].status = data.status
            deletingTasks[dataset_id].progress = data.progress ?? []
            deletingTasks[dataset_id].error = data.error ?? ''
          }
          if (data.status === 'success') {
            clearInterval(timer)
            resolve()
          } else if (data.status === 'failed') {
            clearInterval(timer)
            reject(new Error(data.error || 'Delete task failed'))
          } else if (attempts >= maxAttempts) {
            clearInterval(timer)
            reject(new Error('Delete task timed out, please refresh later'))
          }
        } catch (e) {
          clearInterval(timer)
          reject(e)
        }
      }, 3000)
      timers.push(timer)
    })
  }

  // Start (or restart) the delete flow for one dataset, tracking it in `deletingTasks`
  const runDelete = async (dataset_id: string, callback?: () => void) => {
    try {
      // Send a request to the API interface, getting back a task_id to poll
      const resp = await deleteDataset(dataset_id)
      deletingTasks[dataset_id] = {
        task_id: resp.data.task_id,
        status: 'pending',
        progress: [],
        error: '',
      }
      Message.success(String(resp.data.message))
      await pollAndUpdate(dataset_id, resp.data.task_id)
      Message.success('Dataset deleted successfully')
      delete deletingTasks[dataset_id]
      callback && callback()
    } catch (e) {
      const message = (e as Error)?.message || 'Delete failed'
      if (deletingTasks[dataset_id]) {
        deletingTasks[dataset_id].status = 'failed'
        deletingTasks[dataset_id].error = message
      }
      Message.error(message)
    }
  }

  const handleDelete = (dataset_id: string, callback?: () => void) => {
    const isEn = true // You can replace this with your own logic to determine the language
    Modal.warning({
      title: 'Do you want to delete the knowledge base?',
      content:
        'Deletion will disable use by associated apps and permanently delete all documents and prompt configurations.',
      hideCancel: false,
      okText: isEn ? 'Confirm' : '确定',
      cancelText: isEn ? 'Cancel' : '取消',
      onOk: () => {
        // Close the dialog immediately; progress is shown on the card overlay
        runDelete(dataset_id, callback)
      },
    })
  }

  // Re-submit the delete without showing the confirmation dialog again
  const retryDelete = (dataset_id: string, callback?: () => void) => {
    runDelete(dataset_id, callback)
  }

  // Clear all pending poll timers when the owning component unmounts
  onUnmounted(() => {
    timers.forEach((timer) => clearInterval(timer))
    timers.splice(0, timers.length)
  })

  return { handleDelete, retryDelete, deletingTasks }
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

export const useGetDocument = () => {
  // 1.Define the basic data required for hooks
  const loading = ref(false)
  const document = ref<Record<string, any>>({})

  // 2.Define the document‑loading function
  const loadDocument = async (dataset_id: string, document_id: string) => {
    try {
      loading.value = true
      const resp = await getDocument(dataset_id, document_id)
      document.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, document, loadDocument }
}

export const useGetSegmentsWithPage = () => {
  // 1.Define the data required for hooks
  const loading = ref(false)
  const segments = ref<Record<string, any>>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = ref(defaultPaginator)

  // 2.Define the data‑loading function
  const loadSegments = async (
    dataset_id: string,
    document_id: string,
    init: boolean = false,
    search_word: string = '',
  ) => {
    // 2.1 Determine whether it is an initialization. If so, initialize the pager first.
    if (init) {
      paginator.value = defaultPaginator
    } else if (paginator.value.current_page > paginator.value.total_page) {
      return
    }

    // 2.2 Load data and update
    try {
      // 2.3 Call the interface to obtain response data
      loading.value = true
      const resp = await getSegmentsWithPage(dataset_id, document_id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        search_word: search_word,
      })
      const data = resp.data

      // 2.4 Update the pager
      paginator.value = data.paginator

      // 2.5 Determine whether more data exists
      if (paginator.value.current_page <= paginator.value.total_page) {
        paginator.value.current_page += 1
      }

      // 2.6 Append or overwrite data
      if (init) {
        segments.value = data.list
      } else {
        segments.value.push(...data.list)
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, segments, paginator, loadSegments }
}

export const useUpdateSegmentEnabled = () => {
  const handleUpdate = async (
    dataset_id: string,
    document_id: string,
    segment_id: string,
    enabled: boolean,
    callback?: () => void,
  ) => {
    try {
      const resp = await updateSegmentEnabled(dataset_id, document_id, segment_id, enabled)
      Message.success(resp.message)
    } finally {
      // 2.Execute the specified callback function
      callback && callback()
    }
  }

  return { handleUpdate }
}

export const useDeleteSegment=()=>{
  const handleDelete = async (
    dataset_id: string,
    document_id: string,
    segment_id: string,
    callback?: () => void,
  ) => {
    Modal.warning({
      title: 'Are you sure to delete this document segment?',
      content:
        'After deletion, the document cannot be retrieved from the knowledge base/vector database. ' +
        'Use the disable function to temporarily turn off retrieval.',
      hideCancel: false,
      onOk: async () => {
        try {
          // 1.Send a request to the API interface after clicking OK
          const resp = await deleteSegment(dataset_id, document_id, segment_id)
          Message.success(resp.message)
        } finally {
          // 2 Execute the specified callback function
          callback && callback()
        }
      },
    })
  }

  return { handleDelete }
}

export const useCreateSegment = () => {
  // 1.定义hooks所需数据
  const loading = ref(false)

  // 2.定义新增片段处理器
  const handleCreateSegment = async (
    dataset_id: string,
    document_id: string,
    req: CreateSegmentRequest,
  ) => {
    try {
      loading.value = true
      const resp = await createSegment(dataset_id, document_id, req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleCreateSegment }
}

export const useUpdateSegment = () => {
  // 1.Define the data required for hooks
  const loading = ref(false)

  // 2.Define the update fragment processor
  const handleUpdateSegment = async (
    dataset_id: string,
    document_id: string,
    segment_id: string,
    req: UpdateSegmentRequest,
  ) => {
    try {
      loading.value = true
      const resp = await updateSegment(dataset_id, document_id, segment_id, req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateSegment }
}

export const useGetSegment = ()=>{
  // 1.Define the data required for hooks
  const loading = ref(false)
  const segment = ref<Record<string, any>>({})

  // 2.Define the data loader processor
  const loadSegment = async (dataset_id: string, document_id: string, segment_id: string) => {
    try {
      loading.value = true
      const resp = await getSegment(dataset_id, document_id, segment_id)
      segment.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, segment, loadSegment }
}


