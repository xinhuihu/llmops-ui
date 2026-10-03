<script setup lang="ts">
import { type PropType } from 'vue'
import { useUpdateDraftAppConfig } from '@/hooks/use-app'

// Define the data required for custom components
const props = defineProps({
  app_id: { type: String, default: '', required: true },
  long_term_memory: {
    type: Object as PropType<{ enable: boolean }>,
    default: { enable: false },
    required: true,
  },
})
const emits = defineEmits(['update:long_term_memory'])
const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()
</script>

<template>
  <div class="">
    <a-collapse-item  key="long_term_memory" class="app-ability-item">
      <template #header>
        <div class="text-gray-700 font-bold">long-term memory</div>
      </template>
      <template #extra>
        <a-dropdown
          @select="
            async (value) => {
              if (Boolean(value) !== props.long_term_memory?.enable) {
                emits('update:long_term_memory', { enable: Boolean(value) })
                await handleUpdateDraftAppConfig(props.app_id, {
                  long_term_memory: { enable: Boolean(value) },
                })
              }
            }
          "
        >
          <a-button size="mini" class="rounded-lg flex items-center gap-1 px-1" @click.stop>
            {{ props.long_term_memory.enable ? 'Enable' : 'Disable' }}
            <icon-down />
          </a-button>
          <template #content>
            <a-doption :value="1" class="text-xs py-1.5 text-gray-700">Enable</a-doption>
            <a-doption :value="0" class="text-xs py-1.5 text-red-700">Disable</a-doption>
          </template>
        </a-dropdown>
      </template>
    </a-collapse-item>
  </div>

</template>

<style scoped>

</style>