import {
  type BaseResponse,
  type BasePaginatorResponse,
  type BasePaginatorRequest
} from '@/models/base'

//Interface of getting agent information response
export type GetAppResponse  = BaseResponse<{
  id: string
  debug_conversation_id: string
  name: string
  icon: string
  description: string
  status: string
  draft_updated_at: number
  updated_at: number
  created_at: number
}>
//Request structure for adding a new agent
export type CreateAppRequest ={
  name: string
  icon: string
  description: string
}

//Response structure for getting specific app draft configuration
export type GetDraftAppConfigResponse = BaseResponse<{
  id: string
  model_config: { provider: string; model: string; parameters: Record<string, any> }
  dialog_round: number
  preset_prompt: string
  tools: {
    type: string
    provider: { id: string; name: string; label: string; icon: string; description: string }
    tool: {
      id: string
      name: string
      label: string
      description: string
      params: Record<string, any>
    }
  }[]
  workflows: { id: string; name: string; icon: string; description: string }[]
  datasets: { id: string; name: string; icon: string; description: string }[]
  retrieval_config: { retrieval_strategy: string; k: number; score: number }
  long_term_memory: { enable: boolean }
  opening_statement: string
  opening_questions: string[]
  speech_to_text: { enable: boolean }
  text_to_speech: { enable: boolean; voice: string; auto_play: boolean }
  suggested_after_answer: { enable: boolean }
  review_config: {
    enable: boolean
    keywords: string[]
    inputs_config: { enable: boolean; preset_response: string }
    outputs_config: { enable: boolean }
  }
  updated_at: number
  created_at: number
}>

// Request structure for updating the draft configuration for a specific app
export type UpdateDraftAppConfigRequest = {
  model?: { provider: string; model: string; parameters: Record<string, any> }
  dialog_round?: number
  preset_prompt?: string
  tools?: { type: string; provider_id: string; tool_id: string; params: Record<string, any> }[]
  workflows?: string[]
  datasets?: string[]
  retrieval_config?: { retrieval_strategy: string; k: number; score: number }
  long_term_memory?: { enable: boolean }
  opening_statement?: string
  opening_questions?: string[]
  speech_to_text?: { enable: boolean }
  text_to_speech?: { enable: boolean; voice: string; auto_play: boolean }
  suggested_after_answer?: { enable: boolean }
  review_config?: {
    enable: boolean
    keywords: string[]
    inputs_config: { enable: boolean; preset_response: string }
    outputs_config: { enable: boolean }
  }
}

// Response structure for getting app debug conversation messages
export type GetDebugConversationMessagesWithPageResponse = BasePaginatorResponse<{
  id: string
  conversation_id: string
  query: string
  answer: string
  total_token_count: number
  latency: number
  agent_thoughts: {
    id: string
    position: number
    event: string
    thought: string
    observation: string
    tool: string
    tool_input: Record<string, any>
    retrieval_documents: Record<string, any>[]
    latency: number
    created_at: number
  }[]
  suggested_questions: string[]
  created_at: number
}>

//Response structure for getting the paginated list of release history configurations for the app
export type GetPublishHistoriesWithPageResponse = BasePaginatorResponse<{
  id: string
  version: number
  created_at: number
}>

//Request structure for getting the list of debug session messages for the application
export type GetDebugConversationMessagesWithPageRequest = BasePaginatorRequest & {
  created_at?: number
}
