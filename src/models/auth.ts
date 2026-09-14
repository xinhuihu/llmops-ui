import { type BaseResponse } from '@/models/base'

// Account and password login response structure
export type PasswordLoginResponse = BaseResponse<{
  access_token: string
  expire_at: number
}>
