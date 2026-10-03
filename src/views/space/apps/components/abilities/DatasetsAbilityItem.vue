<script setup lang="ts">
import { nextTick, type PropType, ref, watch } from 'vue'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'
import { useGetDatasetsWithPage } from '@/hooks/use-dataset'
import { Message } from '@arco-design/web-vue'
import { cloneDeep, isEqual } from 'lodash'
// Define the data required for custom components
const props = defineProps({
  app_id: { type: String, default: '', required: true },
  retrieval_config: { type: Object, default: {}, required: true },
  datasets: {
    type: Array as PropType<
      {
        id: string
        name: string
        icon: string
        description: string
      }[]
    >,
    default: [],
    required: true,
  },
})
const emits = defineEmits(['update:datasets', 'update:retrieval_config'])
const retrievalConfigModalVisible = ref(false)
const datasetsModalVisible = ref(false)
const isDatasetsInit = ref(false)
const activateDatasets = ref<Record<string, any>[]>([])
const originDatasets = ref<Record<string, any>[]>([])
const retrievalConfigForm = ref<Record<string, any>>({})
const originRetrievalConfigForm = ref<Record<string, any>>({})
const isRetrievalConfigInit = ref(false)

const { loading: updateDraftAppConfigLoading, handleUpdateDraftAppConfig } =
  useUpdateDraftAppConfig()
const { loading, paginator, datasets: apiDatasets, loadDatasets } = useGetDatasetsWithPage()
// Define the scroll data paging processor
const handleScroll = async (event: UIEvent) => {
  // Get the scroll distance, maximum scrollable distance, and the height of the client/browser window
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

  // Determine whether it has scrolled to the bottom
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (loading.value) return
    await loadDatasets()
  }
}

// Function to determine whether the data in the definition judgment knowledge base has changed
const isDatasetsModified = () => {
  return isEqual(activateDatasets.value, originDatasets.value)
}

// Function for determining whether the retrieval settings have changed
const isRetrievalConfigFormModified = () => {
  return isEqual(retrievalConfigForm.value, originRetrievalConfigForm.value)
}

// Define the cancel modal window handler
const handleCancelDatasetsModal = () => {

  datasetsModalVisible.value = false
  activateDatasets.value = originDatasets.value
  isDatasetsInit.value = false
}

// Cancel the retrieval config modal window
const handleCancelRetrievalConfigModal = () => {

  retrievalConfigModalVisible.value = false
  retrievalConfigForm.value = originRetrievalConfigForm.value
  isRetrievalConfigInit.value = false
}

// Open the retrieval config modal and prefill the form from the current config.
// Prefilling is required: the bound form starts empty, and Arco's `default-value`
// only sets a control's initial display state without writing back to the model,
// so submitting without this would send an empty/incomplete retrieval_config and
// fail backend validation (exact-keys check).
const handleOpenRetrievalConfigModal = () => {
  const current = props.retrieval_config as Record<string, any>
  retrievalConfigForm.value = {
    retrieval_strategy: current?.retrieval_strategy ?? 'semantic',
    k: current?.k ?? 10,
    score: current?.score ?? 0.5,
  }
  originRetrievalConfigForm.value = { ...retrievalConfigForm.value }
  isRetrievalConfigInit.value = true
  retrievalConfigModalVisible.value = true
}

// Knowledge Base Selection handler
const handleSelectDataset = (idx: number) => {
  // Extract the corresponding knowledge base ID
  const dataset = apiDatasets[idx]

  // Check whether the id is selected; if it is selected, delete it.
  if (activateDatasets.value.some((activateDataset) => activateDataset.id === dataset.id)) {
    activateDatasets.value = activateDatasets.value.filter(
      (activateDataset) => activateDataset.id !== dataset.id,
    )
  } else {
    // Detect the number of associated knowledge bases
    if (activateDatasets.value.length >= 5) {
      Message.warning('The number of associated knowledge bases has exceeded 5, ' +
        'and no more can be associated.')
      return
    }
    // Add data to the activated knowledge base list
    activateDatasets.value.push({
      id: dataset.id,
      name: dataset.name,
      icon: dataset.icon,
      description: dataset.description,
    })
  }
}

// knowledge base is selected
const handleSubmitDatasets = async () => {
  try {
    // Process the data and complete the API interface submission
    await handleUpdateDraftAppConfig(props.app_id, {
      datasets: activateDatasets.value.map((activateDataset) => activateDataset.id),
    })

    // Interface updated successfully, synchronize form information
    originDatasets.value = activateDatasets.value
    await nextTick()

    // Two-way synchronized update of data in props
    emits('update:datasets', activateDatasets.value)

    // Hide modal window
    handleCancelDatasetsModal()
  } catch (e) {}
}

// Submit updated retrieval configuration
const handleSubmitRetrievalConfig = async () => {
  try {
    // Normalize the form into the exact backend contract:
    // { retrieval_strategy, k (int), score (number) }
    const payload: { retrieval_strategy: string; k: number; score: number } = {
      retrieval_strategy: retrievalConfigForm.value.retrieval_strategy,
      k: Math.round(Number(retrievalConfigForm.value.k)),
      score: Number(retrievalConfigForm.value.score),
    }

    // Process the data and complete the API interface submission
    await handleUpdateDraftAppConfig(props.app_id, {
      retrieval_config: payload,
    })

    // Interface updated successfully, synchronizing form information
    originRetrievalConfigForm.value = { ...payload }

    // Two-way synchronized update of data in props
    emits('update:retrieval_config', payload)

    // Hide a modal window
    handleCancelRetrievalConfigModal()
  } catch (e) {}
}

// Monitor the knowledge base list associated with draft configurations
watch(
  () => props.datasets,
  (newValue) => {
    if (!isDatasetsInit.value || !isDatasetsModified()) {
      if (newValue && newValue.length > 0) {
        const initData = props.datasets.map((dataset) => {
          return {
            id: dataset.id,
            name: dataset.name,
            icon: dataset.icon,
            description: dataset.description,
          }
        })
        activateDatasets.value = cloneDeep(initData)
        originDatasets.value = cloneDeep(initData)

        isDatasetsInit.value = true
      }
    }
  },
  { immediate: true, deep: true },
)

// Monitoring and Retrieval Configuration
watch(
  () => props.retrieval_config,
  (newValue) => {
    // Detect whether it is updated and uninitialized
    if (!isRetrievalConfigInit.value || !isRetrievalConfigFormModified()) {
      if (newValue && Object.keys(newValue).length > 0) {
        retrievalConfigForm.value = { ...newValue }
        originRetrievalConfigForm.value = { ...newValue }
        isRetrievalConfigInit.value = true
      }
    }
  },
  { immediate: true, deep: true },
)

// Monitor the display or hiding of the knowledge base modal window
watch(
  () => datasetsModalVisible.value,
  async (newValue) => {
    if (newValue) {
      await loadDatasets(true)
    } else {
      apiDatasets.splice(0, apiDatasets.length)
    }
  },
)
</script>

<template>
  <div class="">
    <a-collapse-item key="datasets" class="app-ability-item">
      <template #header>
        <div class="text-gray-700 font-bold">Knowledge Base</div>
      </template>
      <template #extra>
        <a-space>
          <a-button
            size="mini"
            class="rounded-lg px-2"
            @click.stop="handleOpenRetrievalConfigModal"
          >
            <template #icon>
              <icon-language />
            </template>
            <div v-if="retrieval_config?.retrieval_strategy === 'semantic'" class="">
              Similarity Retrieval
            </div>
            <div v-else-if="retrieval_config?.retrieval_strategy === 'full_text'" class="">
              Full-text search
            </div>
            <div v-else class="">Hybrid Retrieval</div>
          </a-button>
          <a-button
            size="mini"
            type="text"
            class="!text-gray-700"
            @click.stop="datasetsModalVisible = true"
          >
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
        </a-space>
      </template>
      <div v-if="props.datasets?.length > 0" class="flex flex-col gap-1">
        <div
          v-for="(dataset, idx) in props.datasets"
          :key="dataset.id"
          class="flex items-center justify-between bg-white p-3 rounded-lg cursor-pointer hover:shadow-sm group"
        >
          <!-- 左侧知识库信息 -->
          <div class="flex items-center gap-2">
            <!-- 图标 -->
            <a-avatar
              :size="36"
              shape="square"
              class="rounded flex-shrink-0"
              :image-url="dataset.icon"
            />
            <!-- 名称与描述信息 -->
            <div class="flex flex-col flex-1 gap-1 h-9">
              <div class="text-gray-700 font-bold leading-[18px] line-clamp-1 break-all">
                {{ dataset.name }}
              </div>
              <div class="text-gray-500 text-xs line-clamp-1 break-all">
                {{ dataset.description }}
              </div>
            </div>
          </div>
          <!-- 右侧删除按钮 -->
          <a-button
            size="mini"
            type="text"
            class="hidden group-hover:block flex-shrink-0 ml-2 !text-red-700 rounded"
            @click="
              async () => {
                // Clear the specified data in props
                const newDatasets = [...props.datasets]
                newDatasets.splice(idx, 1)

                // Submit draft configuration to the interface
                await handleUpdateDraftAppConfig(props.app_id, {
                  datasets: newDatasets.map((item) => item.id),
                })
                // Update the data and ensure that the data update is completed.
                isDatasetsInit = false
                emits('update:datasets', newDatasets)
              }
            "
          >
            <template #icon>
              <icon-delete />
            </template>
          </a-button>
        </div>
      </div>
      <div v-else class="text-xs text-gray-500 leading-[22px]">
        Data of quoted text type is used to implement knowledge Q&A, and the application can be associated with up to 5 knowledge bases.
      </div>
    </a-collapse-item>
    <!-- 知识库模态窗 -->
    <a-modal
      :visible="datasetsModalVisible"
      hide-title
      :footer="false"
      :width="400"
      class="datasets-modal"
      modal-class="h-[calc(100vh-32px)] right-4"
      @cancel="handleCancelDatasetsModal"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between mb-6">
        <div class="text-base font-bold text-gray-700">Select the knowledge-bases</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="handleCancelDatasetsModal"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 中间知识库容器 -->
      <div class="h-[calc(100vh-180px)] mb-4 overflow-scroll scrollbar-w-none">
        <a-spin
          :loading="loading"
          class="block h-full w-full scrollbar-w-none overflow-scroll"
          @scroll="handleScroll"
        >
          <!-- 知识库列表 -->
          <div class="flex flex-col gap-2">
            <!-- 有数据UI状态 -->
            <div
              v-for="(dataset, idx) in apiDatasets"
              :key="dataset.id"
              :class="`flex items-center gap-2 border px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-700 ${activateDatasets.some((activateDataset) => activateDataset.id === dataset.id) ? 'bg-blue-50 border-blue-700' : ''}`"
              @click="() => handleSelectDataset(idx)"
            >
              <a-avatar
                :size="24"
                shape="square"
                class="flex-shrink-0 rounded"
                :image-url="dataset.icon"
              />
              <div class="line-clamp-1 text-gray-500 flex-1">{{ dataset.name }}</div>
            </div>
            <!-- 无数据UI状态 -->
            <a-empty
              v-if="apiDatasets.length === 0"
              description="No available knowledge base"
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
              <div class="text-gray-400 my-4">Data has been loaded completely</div>
            </a-col>
          </a-row>
        </a-spin>
      </div>
      <!-- 底部选中知识库及按钮 -->
      <div class="flex items-center justify-between">
        <!-- 左侧提示文字 -->
        <div class="">{{ activateDatasets.length }} knowledge base are selected</div>
        <!-- 按钮组 -->
        <a-space :size="12">
          <a-button class="rounded-lg" @click="handleCancelDatasetsModal">Cancel</a-button>
          <a-button
            :loading="updateDraftAppConfigLoading"
            type="primary"
            class="rounded-lg"
            @click="handleSubmitDatasets"
          >
            Add
          </a-button>
        </a-space>
      </div>

    </a-modal>
    <!-- 检索设置模态窗 -->
    <a-modal
      :visible="retrievalConfigModalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl w-[min(90vw,700px)]"
      @cancel="handleCancelRetrievalConfigModal"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">Retrieval Settings</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="handleCancelRetrievalConfigModal"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 中间表单内容 -->
      <a-form :model="retrievalConfigForm" @submit="handleSubmitRetrievalConfig" class="pt-6">
        <a-form-item field="retrieval_strategy" label="Retrieval Strategy" label-align="left">
          <a-radio-group
            v-model:model-value="retrievalConfigForm.retrieval_strategy"
            default-value="semantic"
            :options="[
                { label: 'Hybrid Retrieval', value: 'hybrid' },
                { label: 'Full-text Retrieval', value: 'full_text' },
                { label: 'Similarity Retrieval', value: 'semantic' },
              ]"
          />
        </a-form-item>
        <a-form-item field="k" label="Maximum recall count">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider v-model:model-value="retrievalConfigForm.k" :step="1" :min="1" :max="10" />
            <a-input-number
              v-model:model-value="retrievalConfigForm.k"
              class="w-[80px]"
              :default-value="4"
            />
          </div>
        </a-form-item>
        <a-form-item field="score" label="Minimum matching score">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider
              v-model:model-value="retrievalConfigForm.score"
              :step="0.01"
              :min="0"
              :max="0.99"
            />
            <a-input-number
              v-model:model-value="retrievalConfigForm.score"
              class="w-[80px]"
              :min="0"
              :max="0.99"
              :step="0.01"
              :precision="2"
              :default-value="0.5"
            />
          </div>
        </a-form-item>
        <!-- 底部按钮 -->
        <div class="flex items-center justify-between">
          <div class=""></div>
          <a-space :size="16">
            <a-button class="rounded-lg" @click="handleCancelRetrievalConfigModal">Cancel</a-button>
            <a-button
              :loading="updateDraftAppConfigLoading"
              type="primary"
              html-type="submit"
              class="rounded-lg"
            >
              Save
            </a-button>
          </a-space>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<style >
.datasets-modal {
  .arco-modal-wrapper {
    text-align: right;
  }
}
</style>