import { get, post } from '@/utils/request'
import { type AuthorizeResponse, type ProviderResponse } from '@/models/oauth'

// Obtain the redirect address of the specified third‑party authorization service
export const provider = (provider_name: string) => {
  return get<ProviderResponse>(`/oauth/${provider_name}`)
}

// Specify the authentication address for third‑party authorization services
export const authorize = (provider_name: string, code: string) => {
  return post<AuthorizeResponse>(`/oauth/authorize/${provider_name}`, {
    body: { code },
  })
}
