import { Message } from '@arco-design/web-vue'
import { apiPrefix, httpCode } from '@/config'

// 1. 超时时间设置为100秒
const TIME_OUT = 100000

// 2. 基础配置
const baseFetchOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  redirect: 'follow',
}

// 3. 封装基础的 fetch 请求
const baseFetch = <T>(url: string, fetchOptions: any): Promise<T> => {
  // 4. 合并配置
  const options = Object.assign({}, baseFetchOptions, fetchOptions)

  // 5. 组装 URL
  let urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 6. 处理 GET 请求的 params
  const { method, params, body } = options
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach((key) => {
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`)
    })
    urlWithPrefix += urlWithPrefix.includes('?') ? `&${paramsArray.join('&')}` : `?${paramsArray.join('&')}`
    delete options.params
  }

  // 7. 处理 POST 请求的 body
  if (body) {
    options.body = JSON.stringify(body)
  }

  // 🌟 核心修复点：使用 Promise.race 处理超时
  return new Promise((resolve, reject) => {
    // 8. 启动一个倒计时炸弹，并记录下这个炸弹的编号（timerId）
    const timerId = setTimeout(() => {
      reject(new Error('接口已超时'))
    }, TIME_OUT)

    // 9. 发起真实的网络请求
    globalThis
      .fetch(urlWithPrefix, options as RequestInit)
      .then(async (res) => {
        // 10. 🌟 无论请求成功还是失败，只要有了响应，立刻拆除炸弹！
        clearTimeout(timerId)

        const json = await res.json()
        if (json.code === httpCode.success) {
          resolve(json)
        } else {
          Message.error(json.message)
          reject(new Error(json.message))
        }
      })
      .catch((err) => {
        // 11. 🌟 网络断开等报错时，也要记得拆除炸弹！
        clearTimeout(timerId)

        Message.error(err.message || '网络请求失败')
        reject(err)
      })
  }) as Promise<T>
}

// 导出快捷方法
export const request = <T>(url: string, options = {}) => {
  return baseFetch<T>(url, options)
}

export const get = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'GET' }))
}

export const post = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'POST' }))
}