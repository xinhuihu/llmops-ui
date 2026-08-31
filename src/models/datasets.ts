import { type BasePaginatorResponse, type BaseResponse } from '@/models/base'

// Get Knowledge Base Pagination List Response Interface
export type GetDatasetsWithPageResponse = BasePaginatorResponse<{
  id: string
  name: string
  icon: string
  description: string
  document_count: number
  character_count: number
  related_app_count: number
  updated_at: number
  created_at: number
}>

// New Knowledge Base Request Interface
export type CreateDatasetRequest = {
  name: string
  icon: string
  description: string
}

// Update knowledge base request interface
export type UpdateDatasetRequest = {
  name: string
  icon: string
  description: string
}

// Get Knowledge Base Details Response Interface
export type GetDatasetResponse = BaseResponse<{
  id: string
  icon: string
  name: string
  description: string
  document_count: number
  hit_count: number
  related_app_count: number
  character_count: number
  updated_at: number
  created_at: number
}>

// Pagination request interface for obtaining the specified knowledge base document list
export type GetDocumentsWithPageRequest = {
  current_page: number
  page_size: number
  search_word: string
}

// Response Interface for Obtaining Paginated List of Specified Knowledge Base Documents
export type GetDocumentsWithPageResponse = BasePaginatorResponse<{
  id: string
  name: string
  character_count: number
  hit_count: number
  position: number
  enabled: boolean
  disabled_at: number
  status: string
  error: string
  updated_at: number
  created_at: number
}>

// Response Interface for Obtaining a specified document detail
export type GetDocumentResponse = BaseResponse<{
  id: string
  dataset_id: string
  name: string
  segment_count: number
  character_count: number
  hit_count: number
  position: number
  enabled: boolean
  disabled_at: number
  status: string
  error: string
  updated_at: number
  created_at: number
}>

// Knowledge Base Recall Test Request Structure
export type HitRequest = {
  retrieval_strategy: string
  k: number
  query: string
  score: number
}

// Knowledge Base Recall Test Response Structure
export type HitResponse = BaseResponse<
  Array<{
    id: string
    document: {
      id: string
      name: string
      extension: string
      mime_type: string
    }
    dataset_id: string
    score: number
    position: number
    keywords: string[]
    character_count: number
    token_count: number
    hit_count: number
    enabled: boolean
    disabled_at: number
    status: string
    error: string
    updated_at: number
    created_at: number
  }>
>

// Latest Query List of Knowledge Base
export type GetDatasetQueriesResponse = BaseResponse<
  Array<{
    id: string
    query: string
    source: string
    dataset_id: string
    created_at: number
  }>
>

// Request Structure for Uploading Document List to Knowledge Base
export type CreateDocumentsRequest = {
  upload_file_ids: string[]
  process_type: string
  rule?: {
    pre_process_rules: {
      id: string
      enabled: boolean
    }[]
    segment: {
      separators: string[]
      chunk_size: number
      chunk_overlap: number
    }
  }
}

// Response Structure for Uploading Document List to Knowledge Base
export type CreateDocumentsResponse = BaseResponse<{
  batch: string
  documents: {
    id: string
    name: string
    status: string
    created_at: string
  }[]
}>

// Batch‑processing acquisition of document processing progress response structure
export type GetDocumentsStatusResponse = BaseResponse<
  Array<{
    id: string
    name: string
    size: number
    extension: string
    mime_type: string
    position: number
    segment_count: number
    completed_segment_count: number
    error: string
    status: string
    processing_started_at: number
    parsing_completed_at: number
    splitting_completed_at: number
    indexing_completed_at: number
    completed_at: number
    stopped_at: number
    created_at: number
  }>
>

// Request structure for getting a segment list of the specified document
export type GetSegmentsWithPageRequest = {
  current_page: number
  page_size: number
  search_word: string
}

// Response Structure for getting a segment List of Specified Documents
export type GetSegmentsWithPageResponse = BasePaginatorResponse<{
  id: string
  dataset_id: string
  document_id: string
  position: number
  content: string
  keywords: string[]
  character_count: number
  token_count: number
  hit_count: number
  enabled: boolean
  disabled_at: number
  status: string
  error: string
  updated_at: number
  created_at: number
}>

// Request Structure for New Document segment
export type CreateSegmentRequest = {
  content: string
  keywords: string[]
}

// Request structure for modifying document segment
export type UpdateSegmentRequest = {
  content: string
  keywords: string[]
}

// Query Document Snippet Response Structure
export type GetSegmentResponse = BaseResponse<{
  id: string
  document_id: string
  dataset_id: string
  position: number
  content: string
  keywords: string[]
  character_count: number
  token_count: number
  hit_count: number
  hash: string
  enabled: boolean
  status: string
  error: string
  updated_at: number
  created_at: number
}>
