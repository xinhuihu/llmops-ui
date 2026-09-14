import { type BaseResponse } from '@/models/base'

// Response Structure for Getting the Currently Logged‑in Account
export type GetCurrentUserResponse = BaseResponse<{
  id: string
  name: string
  email: string
  avatar: string
  last_login_ip: string
  last_login_at: number
  created_at: number
}>
