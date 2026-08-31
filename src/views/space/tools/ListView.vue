<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  createApiToolProvider,
  deleteApiToolProvider,
  getApiToolProvider,
  getApiToolProvidersWithPage,
  updateApiToolProvider,
  validateOpenAPISchema,
} from '@/services/api-tool'
import { uploadImage } from '@/services/upload-file'
import {
 type CreateApiToolProviderRequest,
} from '@/models/api-tools'
import { typeMap } from '@/config'
import { useRoute } from 'vue-router'
import moment from 'moment/moment'
import { Message, Modal, Form, type ValidatedError } from '@arco-design/web-vue'
import {formatJsonString} from '@/utils/jsonFormat'

const providers = reactive<Array<any>>([])
const route = useRoute()
const props = defineProps({
  createType: {
    type: String,
    required: true,
  },
})


const emits = defineEmits(['update-create-type'])


const scrollWrap = ref<HTMLDivElement>()
const paginator = reactive(
  {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
)
// const form = reactive({
//   icon: 'https://picsum.photos/400',
//   name: '',
//   description: '',
//   openapi_schema: '',
//   headers: [] as {key: string; value: string}[],
// })

const form = reactive({
  fileList: [] as any[],
  icon: '',
  name: '',
  description: '',
  openapi_schema: '',
  headers: [] as {key: string; value: string}[],
})
const formRef = ref<InstanceType<typeof Form>>()

const loading = ref<boolean>(false)
const showIdx = ref<number>(-1)
const showUpdateModalLoading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const showUpdateModal = ref<boolean>(false)

const tools = computed(() => {
  try {
    // 1.Parse openapi_schema data
    const available_tools = []
    const openapi_schema = JSON.parse(form.openapi_schema)

    // 2.Check whether the paths exist
    if ('paths' in openapi_schema) {
      // 3.Loop through all paths and extract tools
      for (const path in openapi_schema['paths']) {
        // 4.Traverse the GET and POST methods under the corresponding path
        for (const method in openapi_schema['paths'][path]) {
          if (['get', 'post'].includes(method)) {
            // 5.Extract tool information and verify whether the two fields, name and description, exist
            const tool = openapi_schema['paths'][path][method]
            if ('operationId' in tool && 'description' in tool) {
              available_tools.push({
                name: tool?.operationId,
                description: tool?.description,
                method: method,
                path: path,
              })
            }
          }
        }
      }
    }
    return available_tools
  } catch (e) {
    console.log('Failed to parse openapi_schema')
  }
  return []
})

// Custom request for processing uploaded files
const handleCustomRequest: any = async (option: any) => {
  const { fileItem, onSuccess } = option
  const resp = await uploadImage(fileItem.file)
  form.icon = resp.data.image_url
  onSuccess(resp)
}

// hook before file removal
const handleBeforeRemove: any = () => {
  form.icon = ''
  return true
}


// deal with pagination data when scroll the windows
const handleScroll = (event: Event) => {
  // 1. Get the scrollTop, scrollHeight, clientHeight value with UIEvent
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

  // 2. judge if a window scrolls at the bottom of the screen
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (loading.value) {
      return
    }
    loadMoreData()
  }
}

// cancel the Modal window
const handleCancel = () => {
  // 1.Reset the form data
  formRef.value?.resetFields()

  // 2. hide the Modal window
  emits('update-create-type', '')
  showUpdateModal.value = false
}

// Submit Modal Window Processor
const handleSubmit = async ({ values, errors }:{
  values: Record<string, any>
  errors: Record<string, ValidatedError> | undefined
}) => {
  // 1.Terminate immediately if any errors exist
  if (errors) return

  try {
    // 2.Set the modal window button to loading state to prevent repeated clicks
    submitLoading.value = true

    // 3.Initiate different requests according to different types
    if (props.createType === 'tool') {
      // 4.Call the interface to initiate a creation request
      const resp = await createApiToolProvider(values as CreateApiToolProviderRequest)
      Message.success(resp.message)
    } else if (showUpdateModal.value) {
      // 5.Call the interface to initiate an update API tool request
      const resp = await updateApiToolProvider(providers[showIdx.value]['id'], values as CreateApiToolProviderRequest)
      Message.success(resp.message)
    }

    // 6.Perform subsequent operations, including hiding modal windows and drawers
    handleCancel()
    showIdx.value = -1
  } finally {
    submitLoading.value = false
  }

  // 7.Reload data
  await initData()
}

// Open the update modal window
const handleUpdate = async () => {
  try {
    // 1.Get the currently displayed provider_id
    showUpdateModalLoading.value = true
    const provider_id = providers[showIdx.value]['id']

    // 2.Obtain the detailed information of the tool provider based on the obtained ID
    const resp = await getApiToolProvider(provider_id)
    const data = resp.data

    // 3.Update form data
    formRef.value?.resetFields()
    form.fileList = [{ uid: '1', name: 'Knowledge Base Icon', url: data.icon }]
    form.description = data.description
    form.icon = data.icon
    form.name = data.name
    form.openapi_schema = formatJsonString(data.openapi_schema)
    form.headers = data.headers
  } finally {
    showUpdateModalLoading.value = false
  }

  showUpdateModal.value = true
}

// Delete tool provider processor
const handleDelete = () => {
  const isEn = true
  Modal.warning({
    title: 'Delete this tool?',
    content: 'The deletion tool is irreversible. AI applications will no longer be able to access your tools',
    hideCancel: false,
    okText: isEn ? 'Confirm' : '确定',
    cancelText: isEn ? 'Cancel' : '取消',
    onOk: async () => {
      try {
        // 1.Send a request to the API interface after clicking Confirm
        const provider_id = providers[showIdx.value]['id']
        const resp = await deleteApiToolProvider(provider_id)
        Message.success(resp.message)
      } finally {
        // 2.Close modal window + drawer
        handleCancel()
        showIdx.value = -1

        // 3.Reload data
        await initData()
      }
    },
  })
}

const loadMoreData =async (init: boolean=false)=>{
  //1. check whether needed to load the data
  if (!init && paginator.current_page>paginator.total_page)
    return
  //2.load more data and update the paginator with it
  try {
    loading.value=true
    //3. get the data
    const resp = await getApiToolProvidersWithPage(
      paginator.current_page,
      paginator.page_size,
      String(route.query?.search_word ?? ''),)
    const data = resp.data
    //4. update the paginator
    paginator.current_page = data.paginator.current_page
    paginator.page_size = data.paginator.page_size
    paginator.total_page = data.paginator.total_page
    paginator.total_record = data.paginator.total_record
    //5. set the current_page if there is more data
    if(paginator.current_page <= paginator.total_page){
      paginator.current_page += 1
    }
    // 6. judge override or append data
    if(init)
    {
      providers.splice(0,providers.length,...data.list)
    }else {
      providers.push(...data.list)
    }
  } finally {
    loading.value=false
  }
}

const initData = () => {
  // 1.Initialize the paginator
  paginator.current_page = 1
  paginator.page_size = 20
  paginator.total_page = 0
  paginator.total_record = 0

  // 2.Call data loading completed initialization
  loadMoreData(true)
}

onMounted(async() =>{
  await loadMoreData(true)
})

// Listen to route query changes
watch(
  () => route.query?.search_word,
  async () => {
    await initData()
  },
)
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <a-spin
      :loading="loading"
      class="flex-1 flex flex-col min-h-0"
    >
      <div class="flex-1 overflow-y-auto pr-2 scrollbar-w-none min-h-0"
           @scroll="handleScroll"
           ref="scrollWrap"
      >
        <!--  Plugin list at bottom    -->
        <a-row :gutter="[20, 20]" class="flex-1">
          <!--   with data  -->
          <a-col v-for="(provider,idx) in providers" :key="provider.name" :span="6">
            <a-card hoverable class="cursor-pointer rounded-lg p-3" @click="showIdx=idx">
              <!-- Provider Name at top -->
              <div class="flex items-center gap-3 mb-3">
                <!--    Left Icon          -->
                <a-avatar
                  :size="40"
                  shape="square"
                  :image-url ="provider.icon"
                />
                <!-- Right text info -->
                <div class="flex-1 min-w-0">
                  <div class="text-base font-bold text-gray-900">{{ provider.name }}</div>
                  <div class="text-xs text-gray-500 line-clamp-1">
                    Provider {{ provider.name }}·{{ provider.tools.length }} plugin
                  </div>
                </div>
              </div>
              <!-- Provider Description-->
              <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
                {{ provider.description }}
              </div>
              <!-- Provider publish information -->
              <div class="flex items-center gap-1.5">
                <a-avatar :size="18" class="bg-blue-700">
                  <icon-user />
                </a-avatar>
                <div class="text-xs text-gray-400">
                  Mina·Edit-time:{{ moment(provider.created_at).format('MM-DD HH:mm') }}
                </div>
              </div>
            </a-card>
          </a-col>
          <!--   without data      -->
          <a-col v-if="providers.length == 0" :span="24">
            <a-empty
              description="There is no any API plugin"
              class="h-[400px] flex flex-col items-center justify-center"
            />
          </a-col>
        </a-row>
        <!--  loader  -->
        <a-row v-if="paginator.total_page >= 2">
          <!-- loading -->
          <a-col v-if="paginator.current_page<=paginator.total_page" :span="24"  class="text-center" >
            <a-space class="my-4 items-center">
              <a-spin :spinning="true">
                <template #indicator><a-icon type="loading" spin /></template>
              </a-spin>
              <span class="text-gray-400">Loading</span>
            </a-space>
          </a-col>
          <!-- data loading complete     -->
          <a-col v-else :span="24" class="text-center">
            <div class="text-gray my-4">Data has been loaded</div>
          </a-col>
        </a-row>
      </div>
      <!-- Card Drawer  -->
      <a-drawer
        :visible="showIdx !=-1"
        :width="350"
        :footer="false"
        title="Tool Details"
        :drawer-style="{background: '#F9FAFB'}"
        @cancel="showIdx = -1"
      >
        <!-- Check if showIdx is -1, and hide it if so. -->
        <div v-if="showIdx != -1" class="">
          <!-- Top Provider Name -->
          <div class="flex items-center gap-3 mb-3">
            <!-- Icon on the left -->
            <a-avatar
              :size="40"
              shape="square"
              :image-url="providers[showIdx].icon"
            />
            <!-- Right Side Tool Info -->
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">
                {{ providers[showIdx].name }}
              </div>
              <div class="text-xs text-gray-500 line-clamp-1">
                provider {{ providers[showIdx].name }} ·
                {{ providers[showIdx].tools.length }} plugin
              </div>
            </div>
          </div>
          <!-- Description of provider -->
          <div class="leading-[18px] text-gray-500 mb-2">
            {{ providers[showIdx].description }}
          </div>
          <!-- Edit Button -->
          <a-button
            :loading="showUpdateModalLoading"
            type="dashed"
            long
            class="mb-2 rounded-lg"
            @click="handleUpdate"
          >
            <template #icon>
              <icon-settings />
            </template>
            Editor
          </a-button>
          <!-- Separator -->
          <hr class="my-4" />
          <!-- Tool of provider -->
          <div class="flex flex-col gap-2">
            <div class="text-xs text-gray-500">
              Include {{ providers[showIdx].tools.length }} tools
            </div>
            <!-- Tool list -->
            <a-card
              v-for="tool in providers[showIdx].tools"
              :key="tool.name"
              class="cursor-pointer flex flex-col rounded-xl"
            >
              <!-- Tool name -->
              <div class="font-bold text-gray-900 mb-2">{{ tool.name }}</div>
              <!-- Tool description -->
              <div class="text-gray-500 text-xs">{{ tool.description }}</div>
              <!-- Tool parameters -->
              <div v-if="tool.inputs.length > 0" class="">
                <!-- Separator -->
                <div class="flex items-center gap-2 my-4">
                  <div class="text-xs font-bold text-gray-500">Parameters</div>
                  <hr class="flex-1" />
                </div>
                <!-- List of parameters -->
                <div class="flex flex-col gap-4">
                  <div v-for="input in tool.inputs" :key="input.name" class="flex flex-col gap-2">
                    <!-- Top section -->
                    <div class="flex items-center gap-2 text-xs">
                      <div class="text-gray-900 font-bold">{{ input.name }}</div>
                      <div class="text-gray-500">{{ typeMap[input.type] }}</div>
                      <div v-if="input.required" class="text-red-700">Required</div>
                    </div>
                    <!-- Parameters information -->
                    <div class="text-xs text-gray-500">{{ input.description }}</div>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </a-drawer>
      <!-- New/edit window     -->
      <a-modal
        :width="630"
        :visible="props.createType === 'tool' || showUpdateModal"
        hide-title
        :footer="false"
        modal-class="rounded-xl"
        @cancel="handleCancel"
      >
        <!-- Top Title -->
        <div class="flex items-center justify-between">
          <div class="text-lg font-bold text-gray-700">
            {{ props.createType === 'tool' ? 'New' : 'Update' }} plugin
          </div>
          <a-button type="text" class="!text-gray-700" size="small" @click="handleCancel">
            <template #icon>
              <icon-close />
            </template>
          </a-button>
        </div>
        <!-- middle form -->
        <div class="pt-6">
          <a-form ref="formRef" :model="form" @submit="handleSubmit" layout="vertical">
            <a-form-item
              field="icon"
              hide-label
              :rules="[{ required: true, message: 'Icon can not be empty' }]"
            >
              <a-upload
                v-model="form.icon"
                :limit="1"
                list-type="picture-card"
                accept="image/png, image/jpeg"
                class="!w-auto mx-auto"
                v-model:file-list="form.fileList"
                image-preview
                :custom-request="handleCustomRequest"
                :on-before-remove="handleBeforeRemove"
              />
            </a-form-item>
            <a-form-item
              field="name"
              label="Plugin Name"
              asterisk-position="end"
              :rules="[{ required: true, message: 'The Plugin name can not be empty' }]"
            >
              <a-input
                v-model="form.name"
                placeholder="Please input your plugin name to make sure meaningfully"
                show-word-limit
                :max-length="60"
              />
            </a-form-item>
            <a-form-item
              field="description"
              label="Plugin description"
            >
              <a-textarea
                v-model="form.description"
                :auto-size="{ minRows: 4, maxRows: 6 }"
                placeholder="Please input plugin description here"
              />
            </a-form-item>
            <a-form-item
              field="openapi_schema"
              label="OpenAPI Schema"
              asterisk-position="end"
              :rules="[{ required: true, message: 'OpenAPI Schema cannot be empty' }]"
            >
              <a-textarea
                v-model="form.openapi_schema"
                :auto-size="{ minRows: 4, maxRows: 6 }"
                placeholder="Please input your OpenAPI Schema here"
                @blur="
                async () => {
                  const raw = form.openapi_schema.trim()
                  if (!raw) return
                  // 1. Format JSON
                  const prettyJson = formatJsonString(form.openapi_schema)
                  // 2. Fill back the formatted content
                  form.openapi_schema = prettyJson
                  // 3. Perform verification after formatting succeeds
                  await validateOpenAPISchema(prettyJson)
                }
              "
              />
            </a-form-item>
            <a-form-item label="Available Tools ">
              <!-- Table of Available Tools -->
              <div class="rounded-lg border border-gray-200 w-full overflow-x-auto">
                <table class="w-full leading-[18px] text-xs text-gray-700 font-normal">
                  <thead class="text-gray-500">
                  <tr class="border-b border-gray-200">
                    <th class="p-2 pl-3 font-medium">Name</th>
                    <th class="p-2 pl-3 font-medium w-[236px]">Description</th>
                    <th class="p-2 pl-3 font-medium">Method</th>
                    <th class="p-2 pl-3 font-medium">Path</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                    v-for="(tool, idx) in tools"
                    :key="idx"
                    class="border-b last:border-0 border-gray-200 text-gray-700"
                  >
                    <td class="p-2 pl-3">{{ tool.name }}</td>
                    <td class="p-2 pl-3 w-[236px]">{{ tool.description }}</td>
                    <td class="p-2 pl-3">{{ tool.method }}</td>
                    <td class="p-2 pl-3 w-[62px]">{{ tool.path }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </a-form-item>
            <a-form-item label="Headers">
              <!-- Request Header Form -->
              <div class="rounded-lg border border-gray-200 w-full overflow-x-auto">
                <table class="w-full leading-[18px] text-xs text-gray-700 font-normal mb-3">
                  <thead class="text-gray-500">
                  <tr class="border-b border-gray-200">
                    <th class="p-2 pl-3 font-medium">Key</th>
                    <th class="p-2 pl-3 font-medium">Value</th>
                    <th class="p-2 pl-3 font-medium w-[50px]">Operation</th>
                  </tr>
                  </thead>
                  <tbody v-if="form.headers.length > 0" class="border-b border-gray-200">
                  <tr
                    v-for="(header, idx) in form.headers"
                    :key="idx"
                    class="border-b last:border-0 border-gray-200"
                  >
                    <td class="p-2 pl-3">
                      <a-form-item :field="`headers[${idx}].key`" hide-label class="m-0">
                        <a-input v-model="header.key" placeholder="Please input the key name of header" />
                      </a-form-item>
                    </td>
                    <td class="p-2 pl-3">
                      <a-form-item :field="`headers[${idx}].value`" hide-label class="m-0">
                        <a-input v-model="header.value" placeholder="Please input the value name of header" />
                      </a-form-item>
                    </td>
                    <td class="p-2 pl-3">
                      <a-button
                        size="mini"
                        type="text"
                        class="!text-gray-700"
                        @click="form.headers.splice(idx, 1)"
                      >
                        <template #icon>
                          <icon-delete />
                        </template>
                      </a-button>
                    </td>
                  </tr>
                  </tbody>
                </table>
                <a-button
                  size="mini"
                  class="rounded ml-3 mb-3 !text-gray-700"
                  @click="form.headers.push({ key: '', value: '' })"
                >
                  <template #icon>
                    <icon-plus />
                  </template>
                  Append parameter
                </a-button>
              </div>
            </a-form-item>
            <!-- Bottom button -->
            <div class="flex items-center justify-between">
              <div class="">
                <a-button
                  v-if="showUpdateModal"
                  class="rounded-lg !text-red-700"
                  @click="handleDelete"
                >
                  Delete
                </a-button>
              </div>
              <a-space :size="16">
                <a-button class="rounded-lg" @click="handleCancel">Cancel</a-button>
                <a-button
                  :loading="submitLoading"
                  type="primary"
                  html-type="submit"
                  class="rounded-lg"
                >
                  Save
                </a-button>
              </a-space>
            </div>
          </a-form>
        </div>
      </a-modal>
    </a-spin>
  </div>
</template>

<style scoped>

</style>