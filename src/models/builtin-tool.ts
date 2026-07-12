import {type BaseResponse} from '@/models/base'
//Get builtin-plugin category response interface
export type GetCategoriesResponse = BaseResponse<
  Array<{
    category : string
    icon: string
    name: string
  }>
>

//Get tool list data from builtin provider

export  type GetBuiltinToolsResponse = BaseResponse<
  Array<
    {
      background: string
      category: string
      create_at: number
      description: string
      label: string
      name: string
      tools: Array<any>
    }>
>
