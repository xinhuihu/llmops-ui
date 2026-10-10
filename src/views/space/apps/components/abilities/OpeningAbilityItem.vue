<script setup lang="ts">
import { computed, nextTick, type PropType } from 'vue'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'

// Define the data required for custom components
const props = defineProps({
  app_id: { type: String, default: '', required: true },
  opening_statement: { type: String, default: '', required: true },
  opening_questions: { type: Array as PropType<string[]>, default: [], required: true },
  // True while the draft config is still being fetched. Guarded so an early
  // blur can't persist the (empty) default and wipe the saved value.
  config_loading: { type: Boolean, default: false },
})
const emits = defineEmits(['update:opening_statement', 'update:opening_questions'])
const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()
const computed_opening_questions = computed({
  get(): string[] {
    // Check whether the length of the passed opening_questions is equal to 3. If it is less than 3 and the last element is not empty data, add a new one.
    const newValue = [...props.opening_questions]
    if (newValue.length < 3 && newValue[newValue.length - 1] !== '') {
      newValue.push('')
    }

    return newValue
  },
  set(newValue: string[]) {
    emits('update:opening_questions', newValue)
  },
})

// Define the processor for the list of suggested opening questions for definition submission
const handleUpdateOpeningQuestions = async () => {
  if (props.config_loading) return
  await handleUpdateDraftAppConfig(props.app_id, {
    opening_questions: computed_opening_questions.value.filter((item) => item.trim() !== ''),
  })
}

// Persist the opening statement on blur, but only once the draft config has
// been loaded. Without this guard, an early blur saves the empty default.
const handleBlur = async () => {
  if (props.config_loading) return
  await handleUpdateDraftAppConfig(props.app_id, {
    opening_statement: props.opening_statement,
  })
}
</script>

<template>
  <div class="">
    <a-collapse-item key="opening" class="app-ability-item">
      <template #header>
        <div class="text-gray-700 font-bold">Conversation opening messages </div>
      </template>
      <div class="text-xs text-gray-500">
        <!-- 开场白文案 -->
        <div class="flex flex-col gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="text-gray-700">Opening message copy</div>
            <a-tooltip content="The opening message is the conversation that the Agent displays by default when interacting with the Agent application.">
              <icon-exclamation-circle />
            </a-tooltip>
          </div>
          <a-textarea
            :model-value="props.opening_statement"
            @update:model-value="(value) => emits('update:opening_statement', value)"
            placeholder="Fill in the opening messages of the AI application here"
            class="bg-white text-gray-700 rounded-lg border border-gray-200"
            :auto-size="{ minRows: 4, maxRows: 4 }"
            @blur="handleBlur"
          />
        </div>
        <!-- 开场白建议问题 -->
        <div class="flex flex-col gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="text-gray-700">Preset opening questions</div>
            <a-tooltip content="The preset opening questions are suggested questions provided during initialization when conversing with the Agent, with a maximum of 3.">
              <icon-exclamation-circle />
            </a-tooltip>
          </div>
          <!-- 预设问题列表 -->
          <div class="flex flex-col gap-2">
            <!-- 建议问题选项 -->
            <div
              v-for="(opening_question, idx) in computed_opening_questions"
              :key="idx"
              class="flex items-center gap-2"
            >
              <a-input
                :model-value="opening_question"
                @update:model-value="
                  (value) => {
                    const newQuestions = [...computed_opening_questions]
                    newQuestions[idx] = value
                    computed_opening_questions = newQuestions
                  }
                "
                class="rounded-lg bg-white"
                placeholder="Input opening message to guide questions"
                @blur="async () => await handleUpdateOpeningQuestions()"
              />
              <a-button
                class="rounded-lg"
                @click="
                  async () => {
                    // 1.创建数组副本并清除指定项
                    const newQuestions = [...computed_opening_questions]
                    newQuestions.splice(idx, 1)
                    emits('update:opening_questions', newQuestions)

                    // 2.使用nextTick()方法确保数据更新
                    await nextTick()

                    // 3.提交草稿配置更新
                    await handleUpdateOpeningQuestions()
                  }
                "
              >
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-collapse-item>
  </div>
</template>

<style scoped></style>
