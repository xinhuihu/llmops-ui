import { type BaseResponse } from '@/models/base'

// Obtain the redirect response structure of the specified third‑party authorization service
export type ProviderResponse = BaseResponse<{
  redirect_url: string
}>

// Specify the response structure for third‑party authorization and authentication login
export type AuthorizeResponse = BaseResponse<{
  access_token: string
  expire_at: number
}>
