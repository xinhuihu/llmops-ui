import { type BasePaginatorResponse } from '@/models/base'

// Struct for creating a new api key
export type CreateApiKeyRequest = {
  is_active?: boolean
  remark?: string
}

// Struct for updating a specific api key
export type UpdateApiKeyRequest = {
  is_active?: boolean
  remark?: string
}

// A single API key record
export type ApiKey = {
  id: string
  api_key: string
  is_active: boolean
  remark: string
  updated_at: number
  created_at: number
}

// Struct for getting a list of api key
export type GetApiKeysWithPageResponse = BasePaginatorResponse<ApiKey>