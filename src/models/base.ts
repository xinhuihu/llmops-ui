// Basic response data format
export type BaseResponse<T> = {
  code: string
  message: string
  data: T
}

// Basic paginated response data format
export type BasePaginatorResponse<T> = BaseResponse<{
  list: Array<T>
  paginator: {
    total_page: number
    total_record: number
    current_page: number
    page_size: number
  }
}>
