<script setup lang="ts">
import { type PropType } from 'vue'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'
const props = defineProps({
  app_id: { type: String, default: '', required: true },
  suggested_after_answer: {
    type: Object as PropType<{ enable: boolean }>,
    default: { enable: false },
    required: true,
  },
})
const emits = defineEmits(['update:suggested_after_answer'])
const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()
</script>

<template>
<div class="">
  <a-collapse-item key="suggested_after_answer" class="app-ability-item">
    <template #header>
      <div class="text-gray-700 font-bold">Suggestion Questions</div>
    </template>
    <template #extra>
      <a-dropdown
        @select="
            async (value) => {
              if (Boolean(value) !== props.suggested_after_answer?.enable) {
                emits('update:suggested_after_answer', { enable: Boolean(value) })
                await handleUpdateDraftAppConfig(props.app_id, {
                  suggested_after_answer: { enable: Boolean(value) },
                })
              }
            }
          "
      >
        <a-button size="mini" class="rounded-lg flex items-center gap-1 px-1" @click.stop>
          {{ props.suggested_after_answer.enable ? 'Enable' : 'Disable' }}
          <icon-down />
        </a-button>
        <template #content>
          <a-doption :value="1" class="text-xs py-1.5 text-gray-700">Enable</a-doption>
          <a-doption :value="0" class="text-xs py-1.5 text-red-700">Disable</a-doption>
        </template>
      </a-dropdown>
    </template>
    <div class="text-xs text-gray-500 leading-[22px]">
      After the agent responds, automatically provide 3 suggested questions based on the conversation content.
    </div>
  </a-collapse-item>
</div>
</template>

<style scoped>

</style>