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

//Response structure for getting the specific plugin detail
export type GetBuiltinToolResponse = BaseResponse<{
  name: string
  label: string
  description: string
  provider: {
    name: string
    label: string
    category: string
    background: string
    description: string
  }
  params: {
    name: string
    label: string
    type: string
    required: boolean
    default: any
    min: number
    max: number
    options: { value: string; label: string }[]
  }[]
  inputs: {
    type: string
    name: string
    required: boolean
    description: string
  }[]
  created_at: number
}>
