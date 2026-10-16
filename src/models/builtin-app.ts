import type { BaseResponse } from '@/models/base'

// Response struct for getting builtin agent categories
export type GetBuiltinAppCategoriesResponse = BaseResponse<
  {
    category: string
    name: string
  }[]
>

// This is the response structure for retrieving built-in agents
export type GetBuiltinAppsResponse = BaseResponse<
  {
    id: string
    category: string
    name: string
    icon: string
    description: string
    model_config: {
      provider: string
      model: string
    }
    created_at: number
  }[]
>
