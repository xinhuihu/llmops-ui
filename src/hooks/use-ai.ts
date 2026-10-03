import { ref } from 'vue'
import { generateSuggestedQuestions, optimizePrompt } from '@/services/ai'

export const useGenerateSuggestedQuestions = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const suggested_questions = ref<string[]>([])

  // Define the data loading function
  const handleGenerateSuggestedQuestions = async (message_id: string) => {
    try {
      loading.value = true
      const resp = await generateSuggestedQuestions(message_id)
      suggested_questions.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, suggested_questions, handleGenerateSuggestedQuestions }
}

export const useOptimizePrompt = () => {
  // Define the data required for hooks
  const loading = ref(false)
  const optimize_prompt = ref('')

  // Define the prompt optimized handler
  const handleOptimizePrompt = async (prompt: string) => {
    try {
      // Initiate the prompt optimization request and set optimize_prompt to empty first.
      loading.value = true
      optimize_prompt.value = ''
      await optimizePrompt(prompt, (event_response) => {
        // Extract data and update optimize_prompt
        const data = event_response.data
        optimize_prompt.value += data?.optimize_prompt
      })
    } finally {
      loading.value = false
    }
  }

  return { loading, optimize_prompt, handleOptimizePrompt }
}
