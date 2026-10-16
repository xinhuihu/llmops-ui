import { get, post } from '@/utils/request'
import type { GetBuiltinAppCategoriesResponse, GetBuiltinAppsResponse } from '@/models/builtin-app'
import type { BaseResponse } from '@/models/base'

// Api interface to get the built-in agent categories
export const getBuiltinAppCategories = () => {
  return get<GetBuiltinAppCategoriesResponse>(`/builtin-apps/categories`)
}

// Api interface to get the built-in agent list
export const getBuiltinApps = () => {
  return get<GetBuiltinAppsResponse>(`/builtin-apps`)
}

// Add the specific agent template to the personal workspace
export const addBuiltinAppToSpace = (builtin_app_id: string) => {
  return post<BaseResponse<{ id: string }>>(`/builtin-apps/add-builtin-app-to-space`, {
    body: { builtin_app_id },
  })
}
