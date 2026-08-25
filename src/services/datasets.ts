import { get, post } from '@/utils/request'
import {
  type CreateDatasetRequest,
  type CreateDocumentsRequest,
  type CreateDocumentsResponse,
  type GetDatasetQueriesResponse,
  type GetDatasetResponse,
  type GetDatasetsWithPageResponse,
  type GetDocumentResponse,
  type GetDocumentsStatusResponse,
  type GetDocumentsWithPageRequest,
  type GetDocumentsWithPageResponse,
  type HitRequest,
  type HitResponse,
  type UpdateDatasetRequest,
} from '@/models/datasets'
import { type BaseResponse } from '@/models/base'

// Get paginated list data of the knowledge base
export const getDatasetsWithPage = (
  current_page: number = 1,
  page_size: number = 20,
  search_word: string = '',
) => {
  return get<GetDatasetsWithPageResponse>(`/datasets`, {
    params: { current_page, page_size, search_word },
  })
}

// Add Knowledge Base
export const createDataset = (req: CreateDatasetRequest) => {
  return post<BaseResponse<any>>(`/datasets`, {
    body: req,
  })
}

// Update the knowledge base
export const updateDataset = (dataset_id: string, req: UpdateDatasetRequest) => {
  return post<BaseResponse<any>>(`/datasets/${dataset_id}`, {
    body: req,
  })
}

// Knowledge base deletion request
export const deleteDataset = (dataset_id: string) => {
  return post<BaseResponse<any>>(`/datasets/${dataset_id}/delete`)
}

// Get knowledge base details
export const getDataset = (dataset_id: string) => {
  return get<GetDatasetResponse>(`/datasets/${dataset_id}`)
}

// Get paginated list data of documents
export const getDocumentsWithPage = (
  dataset_id: string,
  req: GetDocumentsWithPageRequest = {
    current_page: 1,
    page_size: 20,
    search_word: '',
  },
) => {
  return get<GetDocumentsWithPageResponse>(`/datasets/${dataset_id}/documents`, {
    params: req,
  })
}

// Get details of the specified document
export const getDocument = (dataset_id: string, document_id: string) => {
  return get<GetDocumentResponse>(`/datasets/${dataset_id}/documents/${document_id}`)
}

// Update the activation status of the specified document
export const updateDocumentEnabled = (
  dataset_id: string,
  document_id: string,
  enabled: boolean,
) => {
  return post<BaseResponse<any>>(`/datasets/${dataset_id}/documents/${document_id}/enabled`, {
    body: { enabled },
  })
}

// Delete the specified document information
export const deleteDocument = (dataset_id: string, document_id: string) => {
  return post<BaseResponse<any>>(`/datasets/${dataset_id}/documents/${document_id}/delete`)
}

// Update the name of the document
export const updateDocumentName = (dataset_id: string, document_id: string, name: string) => {
  return post<BaseResponse<any>>(`/datasets/${dataset_id}/documents/${document_id}/name`, {
    body: { name },
  })
}

// Knowledge Base Recall Test
export const hit = (dataset_id: string, req: HitRequest) => {
  return post<HitResponse>(`/datasets/${dataset_id}/hit`, {
    body: req,
  })
}

// Recent search records
export const getDatasetQueries = (dataset_id: string) => {
  return get<GetDatasetQueriesResponse>(`/datasets/${dataset_id}/queries`)
}

// Upload documents to the knowledge base
export const createDocuments = (dataset_id: string, req: CreateDocumentsRequest) => {
  return post<CreateDocumentsResponse>(`/datasets/${dataset_id}/documents`, {
    body: req,
  })
}

// Obtain the processing status of documents based on batch processing
export const getDocumentsStatus = (dataset_id: string, batch: string) => {
  return get<GetDocumentsStatusResponse>(`/datasets/${dataset_id}/documents/batch/${batch}`)
}
