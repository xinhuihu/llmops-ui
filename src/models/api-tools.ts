import { type BasePaginatorResponse,type BaseResponse } from '@/models/base'
//Get self-defined api plugin response
export  type GetApiToolProvidersWithPageResponse = BasePaginatorResponse<{
  id:string
  name: string
  icon: string
  description: string
  headers: Array<any>
  tools: Array<any>
  create_at: number
}>

// Create self-defined api plugin request
export type CreateApiToolProviderRequest = {
  name: string
  icon: string
  description: string
  openapi_schema: string
  headers: Array<any>
}

// Update self-defined api plugin response
export type UpdateApiToolProviderRequest = {
  name: string
  icon: string
  description: string
  openapi_schema: string
  headers: Array<any>
}

// Get self-defined api provider Response
export type GetApiToolProviderResponse = BaseResponse<{
  id: string
  name: string
  icon: string
  description: string
  openapi_schema: string
  headers: Array<any>
  created_at: number
}
>

// Get details of custom API tools
export type GetApiToolResponse = BaseResponse<{
  id: string
  name: string
  description: string
  provider: {
    id: string
    name: string
    icon: string
    headers: { key: string; value: string }[]
    description: string
  }
  inputs: {
    type: string
    name: string
    required: boolean
    description: string
  }[]
}>