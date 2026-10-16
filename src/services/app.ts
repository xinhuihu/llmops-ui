import { ssePost,get,post } from '@/utils/request'
import type {
  GetAppResponse,
  GetDraftAppConfigResponse,
  UpdateDraftAppConfigRequest,
  CreateAppRequest,
  UpdateAppRequest,
  GetAppsWithPageRequest,
  GetAppsWithPageResponse,
  GetPublishHistoriesWithPageResponse,
  GetDebugConversationMessagesWithPageRequest,
  GetDebugConversationMessagesWithPageResponse
} from '@/models/app'

import type {
  BaseResponse,
  BasePaginatorRequest
} from '@/models/base'

//Get agent base information
export const getApp = (app_id: string) => {
  return get<GetAppResponse>(`/apps/${app_id}`)
}

// Create app in personal workspace
export const createApp =(req: CreateAppRequest) =>{
  return post<BaseResponse<{id:string}>>(`/apps`, { body: req })
}

// update the specific agent
export const updateApp = (app_id: string, req: UpdateAppRequest) => {
  return post<BaseResponse<any>>(`/apps/${app_id}`, { body: req })
}

//Delete the specified agent
export const deleteApp = (app_id: string) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/delete`)
}

// call the backend api to make a copy of builtin agent
export const copyApp = (app_id: string) => {
  return post<BaseResponse<{ id: string }>>(`/apps/${app_id}/copy`)
}

// call the backend api to get paginated list data of agent
export const getAppsWithPage = (req: GetAppsWithPageRequest) => {
  return get<GetAppsWithPageResponse>(`/apps`, { params: req })
}

//Get the draft configuration of a specific agent
export const getDraftAppConfig = (app_id: string) => {
  return get<GetDraftAppConfigResponse>(`/apps/${app_id}/draft-app-config`)
}

// Update the draft configuration information for specific applications
export const updateDraftAppConfig = (app_id: string, req: UpdateDraftAppConfigRequest) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/draft-app-config`, { body: req })
}

// Get the long-term debug memory of the application
export const getDebugConversationSummary = (app_id: string) => {
  return get<BaseResponse<{ summary: string }>>(`/apps/${app_id}/summary`)
}
// update the long-term debug memory of the application
export const updateDebugConversationSummary =(app_id: string, summary: string)=>{

  return post<BaseResponse<any>>(`/apps/${app_id}/summary`,{body:{summary}})
}

// Debug interface for agent.This interface is sse
export const debugChat = (
  app_id: string,
  query: string,
  onData: (event_response: { [key: string]: any }) => void,
  regenerate_message_id?: string,
) => {
  return ssePost(
    `/apps/${app_id}/conversations`,
    {
      body: { query, regenerate_message_id },
    },
    onData,
  )
}

//Stop the agent conversation during the process of debug
export const stopDebugChat =(app_id: string,task_id:string) =>{
  return post(`/apps/${app_id}/conversations/tasks/${task_id}/stop`)
}

// Update/publish application configuration information
export const publish = (app_id: string) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/publish`)
}

// Cancel the publishing of the specified application
export const cancelPublish = (app_id: string) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/cancel-publish`)
}

// Obtain the publishing history list information of the application
export const getPublishHistoriesWithPage = (app_id: string, req: BasePaginatorRequest) => {
  return get<GetPublishHistoriesWithPageResponse>(`/apps/${app_id}/publish-histories`, {
    params: req,
  })
}

// Roll back the specified historical configuration to the draft
export const fallbackHistoryToDraft = (app_id: string, app_config_version_id: string) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/fallback-history`, {
    body: { app_config_version_id },
  })
}

// Clear the debug session records of the application
export const deleteDebugConversation = (app_id: string) => {
  return post<BaseResponse<any>>(`/apps/${app_id}/conversations/delete-debug-conversation`)
}

// Get the list of debug session messages for the application
export const getDebugConversationMessagesWithPage = (
  app_id: string,
  req?: GetDebugConversationMessagesWithPageRequest,
) => {
  return get<GetDebugConversationMessagesWithPageResponse>(
    `/apps/${app_id}/conversations/messages`,
    { params: req },
  )
}

