// Async task status enumeration
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed'

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
  updated_at: number
  created_at: number
}
