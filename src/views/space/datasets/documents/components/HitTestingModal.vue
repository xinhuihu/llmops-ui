<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import moment from 'moment'
import { getDatasetQueries, hit } from '@/services/datasets'
import { Message } from '@arco-design/web-vue'

// 1.Define the data reception and events of the component
const props = defineProps({
  visible: { type: Boolean, required: true },
  dataset_id: { type: String, required: true },
})
const emits = defineEmits(['update:visible'])

// 2.Recently queried relevant content
const queriesLoading = ref(false)
const queries = reactive<Array<any>>([])
const loadQueries = async () => {
  try {
    queriesLoading.value = true
    const resp = await getDatasetQueries(props.dataset_id)
    const data = resp.data

    queries.splice(0, queries.length, ...data)
  } finally {
    queriesLoading.value = false
  }
}

// 3.Related to knowledge base retrieval settings
const retrievalSettingModalVisible = ref(false)
const defaultRetrievalSetting = {
  retrieval_strategy: 'semantic',
  k: 5,
  score: 0.5,
}
const retrievalSettingForm = reactive({ ...defaultRetrievalSetting })
const hideRetrievalSettingModal = () => {
  // Restore retrieval strategy
  Object.assign(retrievalSettingForm, { ...hitTestingForm })

  // Hide a modal window
  retrievalSettingModalVisible.value = false
}
const saveRetrievalSetting = () => {
  // Reset the list of retrieved query fragments
  hitTestingSegments.splice(0, hitTestingSegments.length)

  // Update the retrieval strategy
  Object.assign(hitTestingForm, { query: hitTestingForm.query, ...retrievalSettingForm })

  // Hide a modal window
  retrievalSettingModalVisible.value = false
}

// 4.Recall‑setting related
const hitTestingLoading = ref(false)
const hitTestingSegments = reactive<Array<any>>([])
const hitTestingForm = reactive({
  query: '',
  ...defaultRetrievalSetting,
})
const hideHitTestingModal = () => emits('update:visible', false)
const handleHitTesting = async () => {
  // Is the retrieved source text empty?
  if (hitTestingForm.query.trim() === '') {
    Message.error('The source text cannot be empty')
    return
  }

  try {
    hitTestingLoading.value = true
    const resp = await hit(props.dataset_id, hitTestingForm)
    const data = resp.data

    hitTestingSegments.splice(0, hitTestingSegments.length, ...data)

    await loadQueries()
  } finally {
    hitTestingLoading.value = false
  }
}

// 5.Monitor data changes
watch(
  () => props.visible,
  async (newValue) => {
    if (newValue) {
      // Modal window opens, loading recent queries
      await loadQueries()
    } else {
      // Modal window closed, clear recent queries and recall records, and initialize retrieval configuration
      queries.splice(0, queries.length)
      hitTestingSegments.splice(0, hitTestingSegments.length)

      Object.assign(hitTestingForm, { query: '', ...defaultRetrievalSetting })
      Object.assign(retrievalSettingForm, { ...defaultRetrievalSetting })
    }
  },
)
</script>

<template>
  <div class="">
    <!-- Recall test modal window -->
    <a-modal
      :width="1000"
      :visible="props.visible"
      hide-title
      :footer="false"
      modal-class="rounded-xl h-3/4 overflow-auto scrollbar-w-none"
      @cancel="hideHitTestingModal"
    >
      <!-- Top Title -->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">Retrieval Testing</div>
        <a-button type="text" class="!text-gray-700" size="small" @click="hideHitTestingModal">
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 副标题 -->
      <div class="text-gray-500">Test the retrieval effect of the knowledge base based on the given query text</div>
      <!-- 中间内容区 -->
      <div class="pt-6">
        <div class="w-full flex justify-between gap-2">
          <!-- 左侧输入框以及最近查询 -->
          <div class="flex flex-col w-1/2">
            <!-- 顶部输入框 -->
            <div class="border border-blue-700 bg-blue-100 rounded-lg flex flex-col mb-6">
              <!-- 输入框标题 -->
              <div class="flex items-center justify-between px-4 py-1.5">
                <div class="font-bold text-gray-900">Source Text</div>
                <a-button
                  size="small"
                  class="rounded-lg px-2"
                  @click="retrievalSettingModalVisible = true"
                >
                  <template #icon>
                    <icon-language />
                  </template>
                  <div v-if="hitTestingForm.retrieval_strategy === 'semantic'" class="">
                    Semantic Search
                  </div>
                  <div v-else-if="hitTestingForm.retrieval_strategy === 'full_text'" class="">
                    Full-text Search
                  </div>
                  <div v-else class="">Hybrid Search</div>
                </a-button>
              </div>
              <!-- 输入框容器 -->
              <div class="bg-white rounded-lg p-2">
                <!-- 输入框 -->
                <a-textarea
                  v-model:model-value="hitTestingForm.query"
                  placeholder="Please enter the text. A short declarative sentence is recommended."
                  :max-length="200"
                  :auto-size="{ minRows: 6, maxRows: 6 }"
                  class="!bg-white !border-0 mb-1"
                />
                <!-- 字符限制以及召回按钮 -->
                <div class="flex items-center justify-between">
                  <a-tag size="small" class="rounded text-gray-700">
                    {{ hitTestingForm.query.length }}/200
                  </a-tag>
                  <a-button
                    :loading="hitTestingLoading"
                    type="primary"
                    size="small"
                    class="rounded-lg"
                    @click="handleHitTesting"
                  >
                    Retrieval
                  </a-button>
                </div>
              </div>
            </div>
            <!-- 底部最近查询 -->
            <div class="">
              <div class="text-gray-700 font-bold mb-4">Recent Queries</div>
              <a-table
                :loading="queriesLoading"
                :pagination="false"
                size="small"
                :bordered="{ wrapper: false }"
                :data="queries"
                @row-click="(record) => (hitTestingForm.query = record.query)"
              >
                <template #columns>
                  <a-table-column
                    title="Source"
                    data-index="source"
                    header-cell-class="text-gray-500 bg-transparent border-b font-bold"
                    cell-class="text-gray-500"
                    :width="110"
                  />
                  <a-table-column
                    title="Text"
                    data-index="query"
                    header-cell-class="text-gray-500 bg-transparent border-b font-bold"
                    cell-class="text-gray-500"
                  >
                    <template #cell="{ record }">
                      <div class="line-clamp-1">{{ record.query }}</div>
                    </template>
                  </a-table-column>
                  <a-table-column
                    title="Time"
                    data-index="created_at"
                    header-cell-class="text-gray-500 bg-transparent border-b font-bold"
                    cell-class="text-gray-500"
                    :width="160"
                  >
                    <template #cell="{ record }">
                      <div class="">
                        {{ moment(record.created_at * 1000).format('YYYY-MM-DD HH:mm') }}
                      </div>
                    </template>
                  </a-table-column>
                </template>
              </a-table>
            </div>
          </div>
          <a-divider direction="vertical" />
          <!-- 右侧召回列表 -->
          <div class="w-1/2">
            <a-spin :loading="hitTestingLoading" class="w-full">
              <!-- 有数据的状态 -->
              <a-row v-if="hitTestingSegments.length > 0" :gutter="[16, 16]">
                <a-col v-for="segment in hitTestingSegments" :key="segment.id" :span="12">
                  <div class="p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <!-- 顶部得分部分 -->
                    <div
                      v-if="hitTestingForm.retrieval_strategy === 'semantic'"
                      class="flex items-center gap-2 mb-1.5"
                    >
                      <icon-pushpin />
                      <a-progress :stroke-width="6" :show-text="false" :percent="segment.score" />
                      <div class="text-gray-700 text-xs">{{ segment.score.toFixed(2) }}</div>
                    </div>
                    <!-- 中间内容部分 -->
                    <div class="text-gray-500 line-clamp-4 h-[88px] break-all">
                      {{ segment.content }}
                    </div>
                    <!-- 文档归属信息 -->
                    <a-divider class="my-2" />
                    <div class="flex items-center gap-2 text-gray-500 text-xs">
                      <icon-file class="flex-shrink-0" />
                      <div class="line-clamp-1">{{ segment.document.name }}</div>
                    </div>
                  </div>
                </a-col>
              </a-row>
              <!-- 无数据的状态 -->
              <a-empty v-else />
            </a-spin>
          </div>
        </div>
      </div>
    </a-modal>
    <!-- 检索设置模态窗 -->
    <a-modal
      :visible="retrievalSettingModalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">Retrieval Settings</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="hideRetrievalSettingModal"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 中间表单内容 -->
      <a-form :model="retrievalSettingForm" @submit="saveRetrievalSetting" class="pt-6">
        <a-form-item field="retrieval_strategy" label="Retrieval Strategy" label-align="left">
          <a-radio-group
            v-model:model-value="retrievalSettingForm.retrieval_strategy"
            default-value="semantic"
            :options="[
              { label: 'Hybrid', value: 'hybrid' },
              { label: 'Full-text', value: 'full_text' },
              { label: 'Semantic', value: 'semantic' },
            ]"
          />
        </a-form-item>
        <a-form-item field="k" label="Maximum recall count">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider v-model:model-value="retrievalSettingForm.k" :step="1" :min="1" :max="10" />
            <a-input-number
              v-model:model-value="retrievalSettingForm.k"
              class="w-[80px]"
              :default-value="4"
            />
          </div>
        </a-form-item>
        <a-form-item field="score" label="Minimum match score">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider
              v-model:model-value="retrievalSettingForm.score"
              :step="0.01"
              :min="0"
              :max="0.99"
            />
            <a-input-number
              v-model:model-value="retrievalSettingForm.score"
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
            <a-button class="rounded-lg" @click="hideRetrievalSettingModal">Cancel</a-button>
            <a-button type="primary" html-type="submit" class="rounded-lg">Save</a-button>
          </a-space>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped></style>
