import { upload } from '@/utils/request'
import { type UploadFileResponse, type UploadImageResponse } from '@/models/upload-file'

// Image upload service
export const uploadImage = (image: File) => {
  // 1.Build a form and add image data
  const formData = new FormData()
  formData.append('file', image)

  // 2.call the upload service to upload the image
  return upload<UploadImageResponse>(`/upload-files/image`, {
    data: formData,
  })
}

// File upload service
export const uploadFile = (file: File) => {
  // 1. build the form and add file data
  const formData = new FormData()
  formData.append('file', file)

  // 2.call the upload service to upload the file
  return upload<UploadFileResponse>(`/upload-files/file`, {
    data: formData,
  })
}
