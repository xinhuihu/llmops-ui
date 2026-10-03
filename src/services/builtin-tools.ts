import {get} from '@/utils/request'
import type {
  GetBuiltinToolsResponse,
  GetCategoriesResponse,
  GetBuiltinToolResponse
} from '@/models/builtin-tool'

//Get categories of builtin-tool

export  const getCategories =() =>{
  return get <GetCategoriesResponse>('/builtin-tools/categories')
}

//Get all the tools of built-in provider
export const getBuiltinTools =() =>{
  return get <GetBuiltinToolsResponse>('/builtin-tools')
}

//Api interface to get the detail of specific tools
export const getBuiltinTool = (provider_name: string, tool_name: string) => {
  return get<GetBuiltinToolResponse>(`/builtin-tools/${provider_name}/tools/${tool_name}`)
}

