import { onMounted, reactive, ref } from 'vue'
import {
  debugChat,
  getApp,
  publish,
  cancelPublish,
  getPublishHistoriesWithPage,
  getDebugConversationMessagesWithPage,
  fallbackHistoryToDraft,
  getDraftAppConfig,
  updateDraftAppConfig,
  getDebugConversationSummary,
  updateDebugConversationSummary,
  deleteDebugConversation,
  stopDebugChat,
} from '@/services/app'
import type {
  UpdateDraftAppConfigRequest,
  GetDebugConversationMessagesWithPageResponse,
} from '@/models/app'
import { Message, Modal } from '@arco-design/web-vue'

//Get the agent configuration information
export const useGetApp = (app_id: string) => {
  // 1.Define the basic data required for hooks
  const loading = ref(false)
  const app = reactive<Record<string, any>>({})

  // 2.Define the functions required to load data
  const loadApp = async (app_id: string) => {
    try {
      loading.value = true
      const resp = await getApp(app_id)
      const data = resp.data

      Object.assign(app, { ...data })
    } finally {
      loading.value = false
    }
  }

  // 3.Load data once when the page DOM finishes loading
  onMounted(async () => await loadApp(app_id))

  return { loading, app, loadApp }
}
//Publish the agent after debugging succesfully
export const usePublish = () => {
  // 1.Define the data required for hooks
  const loading = ref(false)

  // 2.Definition Update Publisher
  const handlePublish = async (app_id: string) => {
    try {
      loading.value = true
      const resp = await publish(app_id)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handlePublish }
}

export const useCancelPublish = () => {
  // Define the data required for hooks
  const loading = ref(false)

  // Define the unpublished processor
  const handleCancelPublish = async (app_id: string, callback?: () => void) => {
    // Open pop-up prompt
    Modal.warning({
      title: 'Do you want to unpublish this Agent?',
      content:
        'After unpublishing, this Agent will be unavailable via the WebApp and all published social platforms.',
      hideCancel: false,
      onOk: async () => {
        try {
          // Send a request to the API interface after clicking OK
          loading.value = true
          const resp = await cancelPublish(app_id)
          Message.success(resp.message)
        } finally {
          // Call the callback function to specify the callback function
          loading.value = false
          callback && callback()
        }
      },
    })
  }

  return { loading, handleCancelPublish }
}

export const useGetPublishHistoriesWithPage = () => {
  // 1.Define the data required for hooks
  const loading = ref(false)
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const publishHistories = reactive<Array<Record<string, any>>>([])
  const paginator = reactive({ ...defaultPaginator })

  // 2.Define the data loading function
  const loadPublishHistories = async (app_id: string, init: boolean = false) => {
    try {
      // 2.1 Determine whether initialization is required; if so, initialize the pager first.
      if (init) {
        Object.assign(paginator, { ...defaultPaginator })
      } else if (paginator.current_page > paginator.total_page) {
        return
      }

      // 2.2 Call the API interface to obtain data
      loading.value = true
      const resp = await getPublishHistoriesWithPage(app_id, {
        current_page: paginator.current_page,
        page_size: paginator.page_size,
      })
      const data = resp.data

      // 2.3 Update pager data
      paginator.current_page = data.paginator.current_page
      paginator.page_size = data.paginator.page_size
      paginator.total_page = data.paginator.total_page
      paginator.total_record = data.paginator.total_record

      // 2.4 Are there more data available
      if (paginator.current_page <= paginator.total_page) {
        paginator.current_page += 1
      }

      // 2.5 Detect whether to append data or overwrite data
      if (init) {
        publishHistories.splice(0, publishHistories.length, ...data.list)
      } else {
        publishHistories.push(...data.list)
      }
    } finally {
      loading.value = false
    }
  }
  return { loading, publishHistories, paginator, loadPublishHistories }
}

export const useFallbackHistoryToDraft=() =>{
  const loading = ref(false)
  const  handleFallBackHistoryToDraft = async (
    app_id: string,
    app_config_version_id: string,
    callback?: () => void,
  )=>{
    try{
      loading.value = true
      const resp = await fallbackHistoryToDraft(app_id,app_config_version_id)
      Message.success(resp.message)
    } finally {
      loading.value= false
      callback && callback()
    }
  }
  return { loading, handleFallBackHistoryToDraft }
}

export const useGetDraftAppConfig = (app_id: string) => {
  // Define the data required for hooks
  const loading = ref(false)
  const draftAppConfigForm = reactive<Record<string, any>>({})

  // Define the function to load data
  const loadDraftAppConfig = async (app_id: string) => {
    try {
      // Modify the loading state and fetch data
      loading.value = true
      const resp = await getDraftAppConfig(app_id)
      const data = resp.data

      // Synchronize the data to the form
      Object.assign(draftAppConfigForm, {
        preset_prompt: data.preset_prompt,
        long_term_memory: data.long_term_memory,
        opening_statement: data.opening_statement,
        opening_questions: data.opening_questions,
        suggested_after_answer: data.suggested_after_answer,
        review_config: data.review_config,
        datasets: data.datasets,
        retrieval_config: data.retrieval_config,
        tools: data.tools,
      })
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => await loadDraftAppConfig(app_id))

  return { loading, draftAppConfigForm, loadDraftAppConfig }
}

export const useUpdateDraftAppConfig = () => {

  const loading = ref(false)

  // Define the draft configuration handler
  const handleUpdateDraftAppConfig = async (
    app_id: string,
    draft_app_config: UpdateDraftAppConfigRequest,
  ) => {
    try {
      loading.value = true
      const resp = await updateDraftAppConfig(app_id, draft_app_config)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateDraftAppConfig }
}

export  const useGetDebugConversationSummary=()=> {
  const loading = ref(false)
  const debug_conversation_summary = ref('')
  const loadDebugConversationSummary=async (app_id:string) =>{
    try {
      loading.value =true
      const resp = await getDebugConversationSummary(app_id)
      const data = resp.data
      debug_conversation_summary.value = data.summary
    }finally {
      loading.value =false
    }
  }
  return {debug_conversation_summary,loadDebugConversationSummary}
}

export const useUpdateDebugConversationSummary=()=>{
  const loading = ref(false)

  const handleUpdateDebugConversationSummary = async (app_id: string, summary: string) => {
    try {
      loading.value = true
      const resp = await updateDebugConversationSummary(app_id, summary)
      Message.success(resp.message)
    }finally {
      loading.value = false
    }
  }
  return {loading,handleUpdateDebugConversationSummary}
}

export const useDeleteDebugConversation = () => {
  // Define the data required for hooks
  const loading = ref(false)

  // Handler to delete the debug Conversation
  const handleDeleteDebugConversation = async (app_id: string) => {
    try {
      loading.value = true
      const resp = await deleteDebugConversation(app_id)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleDeleteDebugConversation }
}

export const useGetDebugConversationMessagesWithPage = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const messages = ref<GetDebugConversationMessagesWithPageResponse['data']['list']>([])
  const created_at = ref(0)
  const defaultPaginator = {
    current_page: 1,
    page_size: 5,
    total_page: 0,
    total_record: 0,
  }
  const paginator = ref({ ...defaultPaginator })

  // Define the function for loading data
  const loadDebugConversationMessages = async (app_id: string, init: boolean = false) => {
    // Determine whether initialization is required; if so, initialize the paginator first.
    if (init) {
      paginator.value = { ...defaultPaginator }
      created_at.value = 0
    } else if (paginator.value.current_page > paginator.value.total_page) {
      return
    }

    // Load more data
    try {
      loading.value = true
      const resp = await getDebugConversationMessagesWithPage(app_id, {
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        created_at: created_at.value,
      })
      const data = resp.data

      // Update the pager
      paginator.value = data.paginator

      //Determine whether more data exists
      if (paginator.value.current_page <= paginator.value.total_page) {
        paginator.value.current_page += 1
      }

      //Append or overwrite data
      if (init) {
        messages.value = data.list
      } else {
        messages.value.push(...data.list)
        created_at.value = data.list[0]?.created_at ?? 0
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, messages, paginator, loadDebugConversationMessages }
}

export const useDebugChat = () => {
  // Define the data required for hooks
  const loading = ref(false)

  // Debug Session Handler
  const handleDebugChat = async (
    app_id: string,
    query: string,
    onData: (event_response: Record<string, any>) => void,
  ) => {
    try {
      loading.value = true
      await debugChat(app_id, query, onData)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleDebugChat }
}

export const useStopDebugChat = () => {
  // define the required data for hooks
  const loading = ref(false)

  // handler for stopping the debug chat
  const handleStopDebugChat = async (app_id: string, task_id: string) => {
    try {
      loading.value = true
      await stopDebugChat(app_id, task_id)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleStopDebugChat }
}
