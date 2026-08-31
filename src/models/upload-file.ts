import { type BaseResponse } from '@/models/base'

//Response structure for upload image
export type UploadImageResponse = BaseResponse<{
  image_url: string
}>

//Response structure for upload file
export type UploadFileResponse = BaseResponse<{
  id: string
  account_id: string
  name: string
  key: string
  size: number
  extension: string
  mime_type: string
  created_at: number
}>
