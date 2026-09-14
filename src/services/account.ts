import { get, post } from '@/utils/request'
import { type BaseResponse } from '@/models/base'
import { type GetCurrentUserResponse } from '@/models/account'

// Obtain information of the currently logged‑in account
export const getCurrentUser = () => {
  return get<GetCurrentUserResponse>(`/account`)
}

// Change the password for the currently logged‑in account
export const updatePassword = (password: string) => {
  return post<BaseResponse<any>>(`/account/password`, {
    body: { password },
  })
}

//Modify the current login account name
export const updateName = (name: string) => {
  return post<BaseResponse<any>>(`/account/name`, {
    body: { name },
  })
}

// Modify the avatar of the currently logged‑in account
export const updateAvatar = (avatar: string) => {
  return post<BaseResponse<any>>(`/account/avatar`, {
    body: { avatar },
  })
}
