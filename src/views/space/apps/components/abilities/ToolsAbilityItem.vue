<script setup lang="ts">
import { computed, type PropType, ref } from 'vue'
import { apiPrefix, typeMap } from '@/config'
import { type GetDraftAppConfigResponse } from '@/models/app'
import { useGetApiTool, useGetApiToolProvidersWithPage } from '@/hooks/use-tool'
import { useGetBuiltinTool, useGetBuiltinTools, useGetCategories } from '@/hooks/use-builtin-tool'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'
import { Message } from '@arco-design/web-vue'
// Define the data required for custom components
const props = defineProps({
  app_id: { type: String, default: '', required: true },
  tools: {
    type: Array as PropType<GetDraftAppConfigResponse['data']['tools']>,
    default: () => [],
    required: true,
  },
})
const emits = defineEmits(['update:tools'])

type ToolItem = GetDraftAppConfigResponse['data']['tools'][number]
const toolInfoModalVisible = ref(false)
const toolsModalVisible = ref(false)
const toolInfoIdx = ref(-1)
const toolInfo = ref<Record<string, any>>({})
const toolInfoSettingForm = ref<Record<string, any>>({})
const toolInfoNavType = ref('info')
const toolsActivateType = ref('api_tool')
const toolsActivateCategory = ref('all')
const computedBuiltinTools = computed(() => {
  if (toolsActivateCategory.value === 'all') return builtin_tools
  return builtin_tools.filter((item) => item.category === toolsActivateCategory.value)
})

const {
  loading: getApiToolProvidersLoading,
  paginator,
  api_tool_providers,
  loadApiToolProviders,
} = useGetApiToolProvidersWithPage()
const { builtin_tools, loadBuiltinTools } = useGetBuiltinTools()
const { loading: getApiToolLoading, api_tool, loadApiTool } = useGetApiTool()
const { loading: getBuiltinToolLoading, builtin_tool, loadBuiltinTool } = useGetBuiltinTool()
const { loading: updateDraftAppConfigLoading, handleUpdateDraftAppConfig } =
  useUpdateDraftAppConfig()
const { categories } = useGetCategories()


// Define the modal window for displaying the tool list
const handleShowToolsModal = async () => {
  // Show the modal window
  toolsModalVisible.value = true

  // Call the API interface to get the response
  await loadApiToolProviders(true)
  await loadBuiltinTools()
}

const handleCancleToolsModal = async () => {
  toolsModalVisible.value = false
}

// Define the modal window for closing tool settings
const handleCancelToolInfoModal = () => {
  toolInfoIdx.value = -1
  toolInfoModalVisible.value = false
  toolInfoNavType.value = 'info'
}

const handleShowToolInfoModal = async (idx: number) => {
  // Get the currently selected tool
  if (idx === -1) return
  toolInfoIdx.value = idx
  const tool = props.tools[idx]

  // Detect different tool types and call corresponding API interfaces
  if (tool.type === 'builtin_tool') {
    await loadBuiltinTool(tool.provider.name, tool.tool.name)
    toolInfo.value = {
      type: 'builtin_tool',
      provider: {
        id: builtin_tool.provider.name,
        icon: `${apiPrefix}/builtin-tools/${builtin_tool.provider.name}/icon`,
        name: builtin_tool.provider.name,
        label: builtin_tool.provider.label,
        description: builtin_tool.provider.description,
      },
      tool: {
        id: builtin_tool.name,
        name: builtin_tool.name,
        label: builtin_tool.label,
        description: builtin_tool.description,
        inputs: builtin_tool.inputs,
        params: builtin_tool.params,
      },
    }
  } else {
    await loadApiTool(tool.provider.id, tool.tool.name)
    toolInfo.value = {
      type: 'api_tool',
      provider: {
        id: api_tool.provider.id,
        icon: api_tool.provider.icon,
        name: api_tool.provider.name,
        label: api_tool.provider.name,
        description: api_tool.provider.description,
      },
      tool: {
        id: api_tool.name,
        name: api_tool.name,
        label: api_tool.name,
        description: api_tool.description,
        inputs: builtin_tool.inputs,
        params: [],
      },
    }
  }

  // Update the tool settings form, retrieve configurations from the draft, and set default values if none exist.
  const params = tool.tool.params
  toolInfo.value.tool.params.forEach((param: any) => {
    toolInfoSettingForm.value[param.name] = params[param.name] ?? param.default
  })

  // Show the modal window
  toolInfoModalVisible.value = true
}

//Delete tool processor
const handleDeleteTool = async (idx: number) => {
  // Extract data from props
  const newTools = [...props.tools]

  // Remove data
  newTools.splice(idx, 1)

  // Update the submission form
  await handleUpdateDraftAppConfig(props.app_id, {
    tools: newTools.map((item) => {
      return {
        type: item.type,
        params: item['tool']['params'],
        provider_id: item['provider']['id'],
        tool_id: item['tool']['name'],
      }
    }),
  })
  //Trigger time to update props
  emits('update:tools', newTools)
}

//update the tool information by submitting the form data
const handleSubmitToolInfo = async () => {
  // Get the current tool information
  const tool = props.tools[toolInfoIdx.value]
  if (tool.type === 'api_tool') {
    //Close the modal window directly
    handleCancelToolInfoModal()
    return
  }

  // update the draft configuration
  const newTools = [...props.tools]
  newTools[toolInfoIdx.value]['tool']['params'] = toolInfoSettingForm.value
  await handleUpdateDraftAppConfig(props.app_id, {
    tools: newTools.map((item) => {
      return {
        type: item.type,
        params: item['tool']['params'],
        provider_id: item['provider']['id'],
        tool_id: item['tool']['name'],
      }
    }),
  })

  //Tigger the update event after update successfully
  emits('update:tools', newTools)

  // close the model window
  handleCancelToolInfoModal()
}

// Scroll to load API tool list
const handleScroll = async (event: UIEvent) => {
  // Get the scroll distance, the maximum scrollable distance, and the height of the client/browser window
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

  // Determine whether scrolling has reached the bottom
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (getApiToolProvidersLoading.value) {
      return
    }
    await loadApiToolProviders()
  }
}

// Define adding association extension processor
const handleSelectTool = async (provider_idx: number, tool_idx: number) => {
  // Obtain specific tool information according to different types
  let selectTool: ToolItem
  if (toolsActivateType.value === 'api_tool') {
    const apiToolProvider = api_tool_providers[provider_idx]
    const apiTool = apiToolProvider['tools'][tool_idx]
    selectTool = {
      type: 'api_tool',
      provider: {
        id: apiToolProvider.id,
        name: apiToolProvider.name,
        label: apiToolProvider.name,
        icon: apiToolProvider.icon,
        description: apiToolProvider.description,
      },
      tool: {
        id: apiTool.name,
        name: apiTool.name,
        label: apiTool.name,
        description: apiTool.description,
        params: {},
      },
    }
  } else {
    const builtinToolProvider = computedBuiltinTools.value[provider_idx]
    const builtinTool = builtinToolProvider['tools'][tool_idx]
    const params = builtinTool['params']
    selectTool = {
      type: 'builtin_tool',
      provider: {
        id: builtinToolProvider.name,
        name: builtinToolProvider.name,
        label: builtinToolProvider.label,
        icon: `${apiPrefix}/builtin-tools/${builtinToolProvider.name}/icon`,
        description: builtinToolProvider.description,
      },
      tool: {
        id: builtinTool.name,
        name: builtinTool.name,
        label: builtinTool.label,
        description: builtinTool.description,
        params: params.reduce((newObj: any, item: any) => {
          newObj[item.name] = item.default
          return newObj
        }, {}),
      },
    }
  }

  // Detect whether it is a deletion or an addition
  if (
    props.tools.some((item) => {
      return item.provider.id === selectTool.provider.id && item.tool.name === selectTool.tool.name
    })
  ) {
    // Delete associated tools and update after filtering data
    const newTools = [...props.tools].filter((item) => {
      return item.provider.id !== selectTool.provider.id && item.tool.name !== selectTool.tool.name
    })
    await handleUpdateDraftAppConfig(props.app_id, {
      tools: newTools.map((item) => {
        return {
          type: item.type,
          params: item.tool.params,
          provider_id: item.provider.id,
          tool_id: item.tool.name,
        }
      }),
    })

    // Update data bidirectionally without closing the modal window
    emits('update:tools', newTools)
    return
  } else {
    // Add new data and check whether the number of associated plugins detected is greater than or equal to 5
    if (props.tools.length >= 5) {
      Message.warning('An Agent application can be associated with up to 5 extension plugins.')
      return
    }

    // Synchronize draft configuration after adding data
    const newTools = [...props.tools]
    newTools.push(selectTool)
    await handleUpdateDraftAppConfig(props.app_id, {
      tools: newTools.map((item) => {
        return {
          type: item.type,
          params: item.tool.params,
          provider_id: item.provider.id,
          tool_id: item.tool.name,
        }
      }),
    })

    // Update data bidirectionally without closing the modal window
    emits('update:tools', newTools)
  }
}


// Define the function for judging whether tools are associated
const isToolSelected = (provider: Record<string, any>, tool: Record<string, any>) => {
  return props.tools.some(
    (item) => item.provider.name === provider.name && item.tool.name === tool.name,
  )
}
</script>

<template>
  <div class="">
    <!-- 折叠面板 -->
    <a-collapse-item key="tools" class="app-ability-item">
      <template #header>
        <div class="text-gray-700 font-bold">Tools</div>
      </template>
      <template #extra>
        <a-button size="mini" type="text" class="!text-gray-700" @click.stop="handleShowToolsModal">
          <template #icon>
            <icon-plus />
          </template>
        </a-button>
      </template>
      <div v-if="props.tools.length > 0" class="flex flex-col gap-1">
        <div
          v-for="(tool, idx) in props.tools"
          :key="idx"
          class="flex items-center justify-between bg-white p-3 rounded-lg cursor-pointer hover:shadow-sm group"
        >
          <!-- 左侧工具信息 -->
          <div class="flex items-center gap-2">
            <!-- 图标 -->
            <a-avatar
              :size="36"
              shape="square"
              class="rounded flex-shrink-0"
              :image-url="tool.provider.icon"
            />
            <!-- 名称与描述信息 -->
            <div class="flex flex-col gap-1 h-9">
              <div class="text-gray-700 font-bold leading-[18px] line-clamp-1 break-all">
                {{ tool.provider.label }} / {{ tool.tool.label }}
              </div>
              <div class="text-gray-500 text-xs line-clamp-1 break-all">
                {{ tool.tool.description }}
              </div>
            </div>
          </div>
          <!-- 右侧按钮 -->
          <div class="hidden group-hover:flex items-center gap-1 flex-shrink-0 ml-2">
            <a-button
              :loading="getApiToolLoading || getBuiltinToolLoading"
              size="mini"
              type="text"
              class="!text-gray-700 rounded"
              @click="async () => await handleShowToolInfoModal(idx)"
            >
              <template #icon>
                <icon-settings />
              </template>
            </a-button>
            <a-button
              :loading="updateDraftAppConfigLoading"
              size="mini"
              type="text"
              class="!text-red-700 rounded"
              @click="async () => await handleDeleteTool(idx)"
            >
              <template #icon>
                <icon-delete />
              </template>
            </a-button>
          </div>
        </div>
      </div>
    </a-collapse-item>
    <!-- 工具设置模态窗 -->
    <a-modal
      :visible="toolInfoModalVisible"
      hide-title
      :footer="false"
      class="tool-setting-modal"
      modal-class="h-[calc(100vh-32px)] right-4"
      @cancel="handleCancelToolInfoModal"
    >
      <!-- 顶部标题&关闭按钮 -->
      <div class="flex items-center justify-between mb-6">
        <!-- 左侧标题&导航 -->
        <div class="flex items-center">
          <!-- 工具信息 -->
          <div class="flex items-center gap-2">
            <a-avatar :size="24" shape="circle" :image-url="toolInfo?.provider?.icon" />
            <div class="text-gray-700 font-bold max-w-[200px] line-clamp-1 break-all">
              {{ toolInfo?.tool?.label }}
            </div>
          </div>
          <!-- 分隔符 -->
          <div class="mx-4 text-gray-400">
            <icon-oblique-line :size="12" />
          </div>
          <!-- 导航菜单 -->
          <div class="flex items-center gap-6">
            <div
              :class="`text-gray-700 pt-1 cursor-pointer border-blue-700 hover:border-b-4 hover:font-bold transition-all ${toolInfoNavType === 'info' ? 'font-bold border-b-4' : ''}`"
              @click="toolInfoNavType = 'info'"
            >
              Information
            </div>
            <div
              v-if="toolInfo.type === 'builtin_tool' && toolInfo?.tool?.params?.length > 0"
              :class="`text-gray-700 pt-1 cursor-pointer border-blue-700 hover:border-b-4 hover:font-bold transition-all ${toolInfoNavType === 'setting' ? 'font-bold border-b-4' : ''}`"
              @click="toolInfoNavType = 'setting'"
            >
              Settings
            </div>
          </div>
        </div>
        <!-- 右侧关闭按钮 -->
        <a-button size="mini" type="text" class="!text-gray-700" @click="handleCancelToolInfoModal">
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 信息容器 -->
      <div
        v-if="toolInfoNavType === 'info'"
        class="h-[calc(100vh-170px)] pb-4 overflow-scroll scrollbar-w-none"
      >
        <!-- 工具描述 -->
        <div class="text-gray-70 font-bold mb-1">Tool Description</div>
        <div class="text-gray-500 text-xs">{{ toolInfo?.tool?.description }}</div>
        <!-- 工具参数 -->
        <div v-if="toolInfo?.tool?.inputs?.length > 0" class="">
          <!-- 分隔符 -->
          <div class="flex items-center gap-2 my-4">
            <div class="text-xs font-bold text-gray-500">Parameters</div>
            <hr class="flex-1" />
          </div>
          <!-- 参数列表 -->
          <div class="flex flex-col gap-4">
            <div
              v-for="input in toolInfo?.tool?.inputs"
              :key="input.name"
              class="flex flex-col gap-2"
            >
              <!-- 上半部分 -->
              <div class="flex items-center gap-2 text-xs">
                <div class="text-gray-900 font-bold">{{ input.name }}</div>
                <div class="text-gray-500">{{ typeMap[input.type] }}</div>
                <div v-if="input.required" class="text-red-700">Required</div>
              </div>
              <!-- 参数描述信息 -->
              <div class="text-xs text-gray-500">{{ input.description }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- 设置容器 -->
      <div
        v-if="toolInfoNavType === 'setting'"
        class="h-[calc(100vh-170px)] pb-4 overflow-scroll scrollbar-w-none"
      >
        <a-form v-model:model="toolInfoSettingForm" layout="vertical" class="">
          <a-form-item
            v-for="param in toolInfo?.tool?.params"
            :key="param.name"
            :field="param.name"
          >
            <template #label>
              <div class="flex items-center gap-1">
                <div class="text-gray-700">{{ param.label }}</div>
                <div v-if="param.required" class="text-red-700">*</div>
                <a-tooltip :content="param.label">
                  <icon-info-circle />
                </a-tooltip>
              </div>
            </template>
            <a-select
              v-if="param.type === 'select'"
              :default-value="param.default"
              v-model:model-value="toolInfoSettingForm[param.name]"
              placeholder="Please enter the parameter value"
              :options="param.options"
            />
            <a-input
              v-if="param.type === 'string'"
              placeholder="Please enter the parameter value"
              v-model:model-value="toolInfoSettingForm[param.name]"
              :default-value="param.default"
            />
            <a-input-number
              v-if="param.type === 'number'"
              placeholder="Please enter the parameter value"
              v-model:model-value="toolInfoSettingForm[param.name]"
              :default-value="param.default"
              :min="param.min"
              :max="param.max"
            />
            <a-radio-group
              v-if="param.type === 'boolean'"
              v-model:model-value="toolInfoSettingForm[param.name]"
              :default-value="param.default"
            >
              <a-radio :value="true">Enable</a-radio>
              <a-radio :value="false">Disable</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </div>
      <!-- 底部按钮 -->
      <div class="flex items-center justify-between">
        <div class=""></div>
        <a-space :size="12">
          <a-button class="rounded-lg" @click="handleCancelToolInfoModal">Cancel</a-button>
          <a-button
            :loading="updateDraftAppConfigLoading"
            type="primary"
            class="rounded-lg"
            @click="handleSubmitToolInfo"
          >
            Save
          </a-button>
        </a-space>
      </div>
    </a-modal>
    <!-- 选择工具模态窗 -->
    <a-modal
      v-model:visible="toolsModalVisible"
      hide-title
      :footer="false"
      class="tools-modal"
      modal-class="right-4 h-[calc(100vh-32px)]"
    >
      <div class="flex w-full h-full">
        <!-- 左侧导航菜单 -->
        <div
          class="flex flex-col flex-shrink-0 bg-gray-50 w-[200px] h-full px-3 py-4 overflow-scroll scrollbar-w-none"
        >
          <!-- 标题 -->
          <div class="text-gray-900 font-bold text-base mb-4">Add plugin</div>
          <!-- 添加插件按钮 -->
          <router-link :to="{ name: 'space-tools-list' }">
            <a-button long type="primary" class="rounded-lg mb-5">
              <template #icon>
                <icon-plus />
              </template>
              Create API plugins
            </a-button>
          </router-link>
          <!-- 工具类别导航 -->
          <div class="flex flex-col gap-1 mb-4">
            <div
              :class="`rounded-lg h-8 leading-8 px-3 flex items-center gap-2 cursor-pointer hover:bg-white hover:text-blue-700 ${toolsActivateType === 'api_tool' ? 'text-blue-700 bg-white' : 'text-gray-700'}`"
              @click="toolsActivateType = 'api_tool'"
            >
              <icon-file />
              API Plugins
            </div>
            <div
              :class="`rounded-lg h-8 leading-8 px-3 flex items-center gap-2 cursor-pointer hover:bg-white hover:text-blue-700 ${toolsActivateType === 'builtin_tool' ? 'text-blue-700 bg-white' : 'text-gray-700'}`"
              @click="toolsActivateType = 'builtin_tool'"
            >
              <icon-loop />
              Built-in Plugins
            </div>
          </div>
          <!-- 内置工具分类 -->
          <div v-if="toolsActivateType === 'builtin_tool'" class="">
            <!-- 分类标题 -->
            <div class="text-xs text-gray-500 mb-3">Category</div>
            <!-- 分类列表 -->
            <div class="flex flex-col gap-1">
              <!-- 所有类别 -->
              <div
                :class="`rounded-lg h-8 leading-8 px-3 flex items-center gap-2 cursor-pointer hover:bg-white hover:text-blue-700 ${toolsActivateCategory === 'all' ? 'text-blue-700 bg-white' : 'text-gray-700'}`"
                @click="toolsActivateCategory = 'all'"
              >
                <icon-apps />
                All
              </div>
              <div
                v-for="category in categories"
                :key="category.name"
                :class="`rounded-lg h-8 leading-8 px-3 flex items-center gap-2 cursor-pointer hover:bg-white hover:text-blue-700 ${toolsActivateCategory === category.category ? 'text-blue-700 bg-white' : ' text-gray-700'}`"
                @click="toolsActivateCategory = category.category"
              >
                <span v-html="category.icon"></span>
                {{ category.name }}
              </div>
            </div>
          </div>
        </div>
        <!-- 右侧工具列表 -->
        <div class="flex-1 p-4">
          <!-- 标题与关闭按钮 -->
          <div class="w-full flex items-center justify-between gap-2 mb-7">
            <div class="text-base font-bold text-gray-700">
              {{ toolsActivateType === 'api_tool' ? 'Api Plugins' : 'Built-in Plugins' }}
            </div>
            <a-button size="mini" type="text" class="!text-gray-700 ml-6" @click="handleCancleToolsModal" >
              <template #icon>
                <icon-close />
              </template>
            </a-button>
          </div>
          <!-- 内置工具列表 -->
          <div
            v-if="toolsActivateType === 'builtin_tool'"
            class="h-[calc(100vh-130px)] overflow-scroll scrollbar-w-none"
          >
            <div
              v-for="(builtin_tool, builtin_tool_idx) in computedBuiltinTools"
              :key="builtin_tool.name"
              class="flex flex-col gap-3 mb-3"
            >
              <!-- 提供者信息 -->
              <div class="text-gray-900">{{ builtin_tool.label }}</div>
              <!-- 工具列表 -->
              <div class="flex flex-col gap-1">
                <div
                  v-for="(tool, tool_idx) in builtin_tool.tools"
                  :key="tool.name"
                  :class="`flex items-center justify-between px-2 h-8 rounded-lg cursor-pointer hover:bg-gray-50 group ${isToolSelected(builtin_tool, tool) ? 'bg-blue-50 border border-blue-700' : ''}`"
                >
                  <!-- 工具信息 -->
                  <div class="flex items-center gap-2">
                    <a-avatar
                      :size="20"
                      shape="circle"
                      :image-url="`${apiPrefix}/builtin-tools/${builtin_tool.name}/icon`"
                    />
                    <div class="text-gray-900">{{ tool.label }}</div>
                  </div>
                  <!-- 添加按钮 -->
                  <a-button
                    size="mini"
                    class="hidden group-hover:block rounded px-1.5 flex-shrink-0"
                    @click="async () => await handleSelectTool(builtin_tool_idx, Number(tool_idx))"
                  >
                    <template #icon>
                      <icon-plus />
                    </template>
                    {{ isToolSelected(builtin_tool, tool) ? 'Delete' : 'Add' }}
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="computedBuiltinTools.length === 0" class="">
              <a-empty
                description="No available built-in plugins"
                class="h-[400px] flex flex-col items-center justify-center"
              />
            </div>
          </div>
          <!-- 自定义插件列表 -->
          <div v-if="toolsActivateType === 'api_tool'">
            <a-spin
              :loading="getApiToolProvidersLoading"
              class="block h-[calc(100vh-130px)] overflow-scroll scrollbar-w-none"
              @scroll="handleScroll"
            >
              <div
                v-for="(api_tool_provider, api_tool_provider_idx) in api_tool_providers"
                :key="api_tool_provider.id"
                class="flex flex-col gap-3 mb-3"
              >
                <!-- 提供者信息 -->
                <div class="text-gray-900">{{ api_tool_provider.name }}</div>
                <!-- 工具列表 -->
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(tool, tool_idx) in api_tool_provider.tools"
                    :key="tool.name"
                    :class="`flex items-center justify-between px-2 h-8 rounded-lg cursor-pointer hover:bg-gray-50 group ${isToolSelected(api_tool_provider, tool) ? 'bg-blue-50 border border-blue-700' : ''}`"
                  >
                    <!-- 工具信息 -->
                    <div class="flex items-center gap-2">
                      <a-avatar :size="20" shape="circle" :image-url="api_tool_provider.icon" />
                      <div class="text-gray-900">{{ tool.name }}</div>
                    </div>
                    <!-- 添加按钮 -->
                    <a-button
                      size="mini"
                      class="hidden group-hover:block rounded px-1.5 flex-shrink-0"
                      @click="async () => await handleSelectTool(api_tool_provider_idx, tool_idx)"
                    >
                      <template #icon>
                        <icon-plus />
                      </template>
                      {{ isToolSelected(api_tool_provider, tool) ? 'Delete' : 'Add' }}
                    </a-button>
                  </div>
                </div>
              </div>
              <div v-if="api_tool_providers.length === 0" class="">
                <a-empty
                  description="No available API plugins"
                  class="h-[400px] flex flex-col items-center justify-center"
                />
              </div>
              <!-- 加载器 -->
              <a-row v-if="paginator.total_page >= 2">
                <!-- 加载数据中 -->
                <a-col
                  v-if="paginator.current_page <= paginator.total_page"
                  :span="24"
                  class="!text-center"
                >
                  <a-space class="my-4">
                    <a-spin />
                    <div class="text-gray-400">Loading</div>
                  </a-space>
                </a-col>
                <!-- 数据加载完成 -->
                <a-col v-else :span="24" class="!text-center">
                  <div class="text-gray-400 my-4">Data loading completed</div>
                </a-col>
              </a-row>
            </a-spin>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style >
.tool-setting-modal {
  .arco-modal-wrapper {
    text-align: right;
  }
}

.tools-modal {
  .arco-modal-wrapper {
    text-align: right;
  }

  .arco-modal-body {
    padding: 0;
    height: 100%;
    width: 100%;
    border-radius: 8px;
  }
}
</style>