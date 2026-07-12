import {get} from '@/utils/request'
import {type GetBuiltinToolsResponse,type GetCategoriesResponse} from '@/models/builtin-tool'

//Get categories of builtin-tool

export  const getCategories =() =>{
  return get <GetCategoriesResponse>('/builtin-tools/categories')
}

//Get all the tools of built-in provider
export const getBuiltinTools =() =>{
  return get <GetBuiltinToolsResponse>('/builtin-tools')
}