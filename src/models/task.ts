// Async task status enumeration
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed'

// A single completed step recorded in the task's progress list
export type TaskProgressItem = {
  key: string
  label: string
  done_at: number
}

// Async task entity
export type Task = {
  id: string
  celery_task_id: string
  task_type: string
  target_type: string
  target_id: string | null
  account_id: string | null
  status: TaskStatus
  error: string
  progress: Array<TaskProgressItem>
  updated_at: number
  created_at: number
}
