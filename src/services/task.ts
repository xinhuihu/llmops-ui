import { get } from '@/utils/request'
import type { Task } from '@/models/task'
import type { BaseResponse } from '@/models/base'

// Get the status of the specified async task
export const getTaskStatus = (task_id: string) => {
  return get<BaseResponse<Task>>(`/tasks/${task_id}`)
}
