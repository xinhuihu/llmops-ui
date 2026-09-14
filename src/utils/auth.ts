import storage from '@/utils/storage'

export default {
  isLogin: (): boolean => {
    // 1.find the authorization and authentication credential
    const credential = storage.get('credential')

    // 2.Determine whether an access_token exists in the authorization credential and check whether the token has expired
    const now = Math.floor(Date.now() / 1000)
    if (
      !credential ||
      !credential.access_token ||
      !credential.expire_at ||
      credential.expire_at < now
    ) {
      // 3.The account is not logged in. Directly remove data in LocalStorage, including user data and authorization credentials.
      storage.clear()
      return false
    }
    // 4.Return true if all conditions are met
    return true
  },
}
