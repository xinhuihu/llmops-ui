import { get, post } from '@/utils/request'

import { type BasePaginatorRequest, type BaseResponse } from '@/models/base'
import {
  type ApiKey,
  type CreateApiKeyRequest,
  type GetApiKeysWithPageResponse,
  type UpdateApiKeyRequest,
} from '@/models/api-key'

// call the backend api interface to create an api key
export const createApiKey = (req: CreateApiKeyRequest) => {
  return post<BaseResponse<ApiKey>>(`/openapi/api-keys`, { body: req })
}
// call the backend api interface to delete an api key
export const deleteApiKey = (api_key_id: string) => {
  return post<BaseResponse<any>>(`/openapi/api-keys/${api_key_id}/delete`)
}

// call the backend api interface to update an api key
export const updateApiKey = (api_key_id: string, req: UpdateApiKeyRequest) => {
  return post<BaseResponse<any>>(`/openapi/api-keys/${api_key_id}`, { body: req })
}

// call the backend api interface to activate an api key
export const updateApiKeyIsActive = (api_key_id: string, is_active: boolean) => {
  return post<BaseResponse<any>>(`/openapi/api-keys/${api_key_id}/is-active`, {
    body: { is_active },
  })
}

// call the backend api interface to get a data list of api key
export const getApiKeysWithPage = (req: BasePaginatorRequest) => {
  return get<GetApiKeysWithPageResponse>(`/openapi/api-keys`, { params: req })
}
