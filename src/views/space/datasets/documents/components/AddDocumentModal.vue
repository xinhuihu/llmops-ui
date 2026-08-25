<script setup lang="ts">
import { onUnmounted, reactive, ref, watch } from 'vue'
import { uploadFile } from '@/services/upload-file'
import { createDocuments, getDocumentsStatus } from '@/services/datasets'
import type { CreateDocumentsRequest } from '@/models/datasets'
import { type Form, Message } from '@arco-design/web-vue'
import { unescapeString } from '@/utils/helper'

// 1.定义组件接收的数据与事件
const props = defineProps({
  visible: { type: Boolean, required: true },
  dataset_id: { type: String, required: true },
  onAfterSubmit: {
    type: Function,
    required: false,
    default: () => {},
  },
})
const emits = defineEmits(['update:visible'])

// 2.定义向导相关数据：定时器、批处理标识、当前步骤、表单、接口加载状态
let timer: ReturnType<typeof setInterval> | null = null // 定时器，默认为空
let batch = '' // 批处理标识
let fetchCount = 0
const currentStep = ref(1)
const createDocumentsForm = reactive({
  file_list: [] as any[], // 上传文件列表
  process_type: 'automatic', // 处理类型
  rule: {
    separators: ['\\n'],
    chunk_size: 500,
    chunk_overlap: 50,
    pre_process_rules: [] as string[],
  },
})
const customRuleFormRef = ref<InstanceType<typeof Form>>()
const createDocumentsLoading = ref(false)
const submitted = ref(false)
const documents = reactive<Array<any>>([])

// 3.关闭弹窗
const hideModal = () => emits('update:visible', false)

// 4.定义下一步处理函数
const nextStep = async () => {
  // 4.1 判断当前所处的步骤并执行不同的检查
  if (currentStep.value === 1) {
    // 4.2 检查是否已经上传了文件，如果没上传则不允许点击下一步并提示
    if (createDocumentsForm.file_list.length === 0) {
      Message.error('Please upload the files to be processed.')
      return
    }
    // 4.3 检查文件是否上传完毕
    const isUploaded = createDocumentsForm.file_list.every(
      (fileItem) => fileItem.response?.data?.id,
    )
    if (!isUploaded) {
      Message.warning('The file is being uploaded. Please wait a moment.')
      return
    }

    // 4.4 进入下一步
    currentStep.value++
  } else {
    // 4.5 当前处于第2页，判断对应的表单逻辑是否正确
    if (createDocumentsForm.process_type === 'custom') {
      // 4.6 校验表单数据监测是否出错，如果出错则停止程序
      const errors = await customRuleFormRef.value?.validate()
      if (errors) return
    }

    // 4.7 校验通过，进入第3步（提交动作由「确定」按钮触发）
    currentStep.value++
  }
}

// 5.定义获取文档状态函数
const fetDocumentsStatus = async () => {
  // 5.1 调用接口获取文档状态数据
  fetchCount++
  const resp = await getDocumentsStatus(props.dataset_id, batch)
  const data = resp.data

  // 5.2 同步文档状态信息
  documents.splice(0, documents.length, ...data)

  // 5.3 如果请求次数超过限制则停止
  if (fetchCount >= 30) stopTimer()

  // 5.4 如果文档都处理完毕（处理完成或者出错）则停止
  const isCompleted = data.every(
    (document) => document.status === 'completed' || document.status === 'error',
  )
  if (isCompleted) stopTimer()
}

// 6.定义开始/停止定时器函数
const startTimer = () => (timer = setInterval(fetDocumentsStatus, 5000))
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 7.定义提交处理函数：调用接口提交并进入处理中状态
const submitDocuments = async () => {
  try {
    createDocumentsLoading.value = true
    const req: CreateDocumentsRequest = {
      upload_file_ids: createDocumentsForm.file_list.map((fileItem) => fileItem.response.data.id),
      process_type: createDocumentsForm.process_type,
    }

    // 如果处理类型为自定义，则添加上处理规则
    if (createDocumentsForm.process_type === 'custom') {
      // 处理转义的分隔符为非转义数据
      req.rule = {
        pre_process_rules: [
          {
            id: 'remove_extra_space',
            enabled: createDocumentsForm.rule.pre_process_rules.includes('remove_extra_space'),
          },
          {
            id: 'remove_url_and_email',
            enabled: createDocumentsForm.rule.pre_process_rules.includes('remove_url_and_email'),
          },
        ],
        segment: {
          separators: createDocumentsForm.rule.separators.map((separator) =>
            unescapeString(separator),
          ),
          chunk_size: createDocumentsForm.rule.chunk_size,
          chunk_overlap: createDocumentsForm.rule.chunk_overlap,
        },
      }
    }

    // 发起请求并获取预处理批次，随后进入处理中状态并轮询进度
    const resp = await createDocuments(props.dataset_id, req)
    batch = resp.data.batch
    submitted.value = true
    await fetDocumentsStatus()
    startTimer()
  } finally {
    createDocumentsLoading.value = false
  }
}

// 7.1 完成处理函数：关闭弹窗并触发完成回调（刷新列表）
const handleFinish = () => {
  hideModal()
  props.onAfterSubmit()
}

// 7.2 上一步处理函数：停止轮询并回退一步
const handlePrevStep = () => {
  if (currentStep.value > 1) {
    stopTimer()
    currentStep.value--
  }
}

// 8.重置向导状态
const resetState = () => {
  stopTimer()
  currentStep.value = 1
  createDocumentsForm.file_list.splice(0, createDocumentsForm.file_list.length)
  createDocumentsForm.process_type = 'automatic'
  createDocumentsForm.rule.separators.splice(
    0,
    createDocumentsForm.rule.separators.length,
    '\\n',
  )
  createDocumentsForm.rule.chunk_size = 500
  createDocumentsForm.rule.chunk_overlap = 50
  createDocumentsForm.rule.pre_process_rules.splice(
    0,
    createDocumentsForm.rule.pre_process_rules.length,
  )
  batch = ''
  fetchCount = 0
  documents.splice(0, documents.length)
  submitted.value = false
  createDocumentsLoading.value = false
}

// 9.监听 visible，打开或关闭时都重置向导状态
watch(
  () => props.visible,
  () => {
    resetState()
  },
)

// 10.组件卸载时清理定时器
onUnmounted(() => stopTimer())

// 11.处理上传文件的自定义请求
const handleCustomRequest: any = async (option: any) => {
  const { fileItem, onSuccess } = option
  const resp = await uploadFile(fileItem.file)
  onSuccess(resp)
}
</script>

<template>
  <a-modal
    :width="1000"
    :visible="visible"
    hide-title
    :footer="false"
    modal-class="rounded-xl"
    @cancel="hideModal"
  >
    <!-- 顶部标题 -->
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-gray-700">Add file</div>
      <a-button type="text" class="!text-gray-700" size="small" @click="hideModal">
        <template #icon>
          <icon-close />
        </template>
      </a-button>
    </div>
    <!-- 步骤条 -->
    <div class="pt-6">
      <a-steps :current="currentStep" class="mb-6">
        <a-step>Upload</a-step>
        <a-step>Segment settings</a-step>
        <a-step>Data processing</a-step>
      </a-steps>
      <!-- 上传页面 -->
      <div v-if="currentStep === 1" class="">
        <a-upload
          v-model:file-list="createDocumentsForm.file_list"
          draggable
          accept=".doc,.docx,.pdf,.txt,.md,.markdown"
          :limit="10"
          multiple
          tip="Supports PDF, TXT, DOC, DOCX and MD. A maximum of 10 files can be uploaded, and each file shall not exceed 10MB in size."
          :custom-request="handleCustomRequest"
        />
      </div>
      <!-- 分段设置页面 -->
      <div v-else-if="currentStep === 2" class="">
        <!-- 自动分段与清洗 -->
        <div
          :class="`px-5 py-4 bg-white rounded-lg border cursor-pointer mb-4 hover:border-blue-700 ${createDocumentsForm.process_type === 'automatic' ? 'border-blue-700' : ''}`"
          @click="createDocumentsForm.process_type = 'automatic'"
        >
          <div class="font-bold text-gray-700 mb-2">Automatic Segmentation and Cleaning</div>
          <div class="text-gray-500">Automatic Segmentation and Preprocessing Rules</div>
        </div>
        <!-- 自定义 -->
        <div
          :class="`px-5 py-4 bg-white rounded-lg border cursor-pointer hover:border-blue-700 ${createDocumentsForm.process_type === 'custom' ? 'border-blue-700' : ''}`"
          @click="createDocumentsForm.process_type = 'custom'"
        >
          <div class="font-bold text-gray-700 mb-2">Custom</div>
          <div class="text-gray-500">Custom segmentation rules, segment lengths and preprocessing rules</div>
          <!-- 自定义表单 -->
          <div v-if="createDocumentsForm.process_type === 'custom'" class="">
            <a-divider />
            <a-form :model="createDocumentsForm.rule" ref="customRuleFormRef" layout="vertical">
              <a-form-item
                field="separators"
                label="Segmentation identifier"
                asterisk-position="end"
                :rules="[{ required: true, message: 'The segment identifier cannot be empty' }]"
              >
                <a-input-tag
                  v-model:model-value="createDocumentsForm.rule.separators"
                  placeholder="Please enter the segment identifier and press Enter to finish"
                />
              </a-form-item>
              <a-form-item
                field="chunk_size"
                label="Maximum segment length"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: 'The maximum segment length cannot be empty' }]"
              >
                <a-input-number
                  v-model:model-value="createDocumentsForm.rule.chunk_size"
                  :min="100"
                  :max="1000"
                  :step="1"
                  :default-value="500"
                  placeholder="Please enter a number between 100 and 1000"
                />
              </a-form-item>
              <a-form-item
                field="chunk_overlap"
                label="chunk overlap count"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: 'The number of chunk overlaps cannot be empty' }]"
              >
                <a-input-number
                  v-model:model-value="createDocumentsForm.rule.chunk_overlap"
                  :min="0"
                  :max="500"
                  :step="1"
                  :default-value="50"
                  placeholder="Please enter a number from 0 to 500"
                />
              </a-form-item>
              <a-form-item field="pre_process_rules" label="Text Preprocessing Rules">
                <a-checkbox-group
                  v-model:model-value="createDocumentsForm.rule.pre_process_rules"
                  direction="vertical"
                >
                  <a-checkbox value="remove_extra_space">
                    Replace consecutive spaces, newline characters and tab characters
                  </a-checkbox>
                  <a-checkbox value="remove_url_and_email">Delete all URLs and email addresses</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
      <!-- 数据处理页面 -->
      <div v-else class="">
        <!-- 未提交：确认信息 -->
        <div v-if="!submitted" class="py-8 text-center">
          <div class="text-gray-700 mb-2">Total {{ createDocumentsForm.file_list.length }} files to be processed</div>
          <div class="text-gray-500 mb-4">
            {{ createDocumentsForm.process_type === 'automatic' ? 'Automatic Segmenting and Cleaning' : 'Custom Segmentation and Cleaning' }}
          </div>
          <div class="text-gray-400 text-sm">Click "Confirm" below to start processing</div>
        </div>
        <!-- 已提交：处理进度 -->
        <div v-else class="">
          <div class="text-gray-900 mb-4 text-base">The server is processing.</div>
          <div class="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
            <div
              v-for="document in documents"
              :key="document.id"
              class="flex items-center justify-between px-4 py-3 bg-white rounded-lg border"
            >
              <!-- 左侧文件信息 -->
              <div class="flex items-center gap-2.5">
                <a-avatar shape="square" class="bg-blue-700" :size="32">
                  <icon-file />
                </a-avatar>
                <div class="">
                  <div class="text-gray-700">{{ document.name }}</div>
                  <div class="text-gray-500">{{ (document.size / 1024).toFixed(2) }}kb</div>
                </div>
              </div>
              <!-- 处理的百分比 -->
              <div v-if="document.status === 'completed'" class="text-gray-500">Processing completed</div>
              <div v-else-if="document.status === 'error'" class="text-red-700">Processing error</div>
              <div v-else-if="document.segment_count === 0" class="text-gray-500">0%</div>
              <div v-else class="text-gray-500">
                {{ ((document.completed_segment_count / document.segment_count) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 按钮：涵盖上一步和下一步 -->
      <div class="flex items-center justify-end mt-6">
        <div class="flex items-center gap-2">
          <a-button v-if="currentStep === 1" type="outline" class="rounded-lg" @click="hideModal">
            Cancel
          </a-button>
          <a-button
            v-if="currentStep >= 2 && !submitted"
            type="outline"
            class="rounded-lg"
            @click="handlePrevStep"
          >
            Previous
          </a-button>
          <a-button v-if="currentStep <= 2" type="primary" class="rounded-lg" @click="nextStep">
            Next
          </a-button>
          <a-button
            v-if="currentStep === 3 && !submitted"
            :loading="createDocumentsLoading"
            type="primary"
            class="rounded-lg"
            @click="submitDocuments"
          >
            Confirm
          </a-button>
          <a-button v-if="currentStep === 3 && submitted" type="primary" class="rounded-lg" @click="handleFinish">
            Completed
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped></style>
