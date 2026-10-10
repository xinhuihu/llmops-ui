import { Message } from '@arco-design/web-vue'
import { apiPrefix, httpCode } from '@/config'
import { useCredentialStore } from '@/stores/credential'
import router from '@/router'

// 1.The timeout period is 100s
const TIME_OUT = 100000

// 2.basic configuration
const baseFetchOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  redirect: 'follow',
}

// 3.fetch parameter types
type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, any>
  body?: BodyInit | Record<string, any> | null
}

// 4.Encapsulate basic fetch requests
const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<T> => {
  // 5.Combine all the configuration information
  const options: typeof baseFetchOptions & FetchOptionType = Object.assign(
    {},
    baseFetchOptions,
    fetchOptions,
  )
  const { credential, clear: clearCredential } = useCredentialStore()
  const access_token = credential.access_token
  if (access_token) options.headers.set('Authorization', `Bearer ${access_token}`)

  // 6.Assemble the URL
  let urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 7.Parse out the corresponding request method, params and body parameters
  const { method, params, body } = options

  // 8.If the request uses the GET method and the params parameter is passed
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach((key) => {
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`)
    })
    if (urlWithPrefix.search(/\?/) === -1) {
      urlWithPrefix += `?${paramsArray.join('&')}`
    } else {
      urlWithPrefix += `&${paramsArray.join('&')}`
    }

    delete options.params
  }

  // 9.Process data transmitted via POST
  if (body) {
    options.body = JSON.stringify(body)
  }

  // 10.Initiate two Promises simultaneously (or two operations; whichever returns first gets completed first)
  return Promise.race([
    // 11.Use a timer to detect whether a timeout has occurred
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('The interface has timed out')
      }, TIME_OUT)
    }),
    // 12.Initiate a normal request
    new Promise((resolve, reject) => {
      globalThis
        .fetch(urlWithPrefix, options as RequestInit)
        .then(async (res) => {
          const json = await res.json()
          if (json.code === httpCode.success) {
            resolve(json)
          } else if (json.code === httpCode.unauthorized) {
            clearCredential()
            await router.replace({ path: '/auth/login' })
          } else {
            Message.error(json.message)
            reject(new Error(json.message))
          }
        })
        .catch((err) => {
          Message.error(err.message)
          reject(err)
        })
    }),
  ]) as Promise<T>
}

// =============================================
// SSE Streaming request section (rewritten in accordance with the W3C SSE specification)
// =============================================

/**
 * Encapsulate POST‑based SSE (Server‑Sent Events) streaming event‑response requests
 */
export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: { [key: string]: any }) => void,
) => {
  // Assemble the basic fetch request configuration
  const options = Object.assign({}, baseFetchOptions, { method: 'POST' }, fetchOptions)
  const { credential } = useCredentialStore()
  const access_token = credential.access_token
  if (access_token) options.headers.set('Authorization', `Bearer ${access_token}`)

  // Assemble the request URL
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // Deconstruct the body parameter and process the corresponding data of the body
  const { body } = fetchOptions
  if (body) options.body = JSON.stringify(body)

  // Initiate a fetch request
  const response = await globalThis.fetch(urlWithPrefix, options as RequestInit)
  return handleStream(response, onData)
}

/**
 * Process SSE streaming responses
 * Parse strictly in accordance with the W3C SSE specification:
 * - Events are separated by \n\n
 * - Fields are split at the first colon, with at most one space removed after the colon
 * - Multi‑line data is concatenated with \n
 * - Dispatch occurs when the data field exists (including empty strings); defaults to "message" if no event is specified
 */
const handleStream = async (
  response: Response,
  onData: (data: { [key: string]: any }) => void,
) => {
  // 1. Check whether the network request is normal
  if (!response.ok) {
    throw new Error(`Network request failed: ${response.status} ${response.statusText}`)
  }

  // 2. Detect the Content‑Type to prevent mis‑parsing non‑SSE responses (e.g., JSON error bodies returned by the backend)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream')) {
    const errorBody = await response.text()
    let message = `非SSE响应 (Content-Type: ${contentType})`
    try {
      const parsed = JSON.parse(errorBody)
      message = parsed.message || parsed.error || message
    } catch {
      // 非 JSON，使用默认消息
    }
    throw new Error(message)
  }

  // 3. Construct the reader and decoder
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持 ReadableStream')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 4. 按双换行分割事件块（SSE 事件以 \n\n 分隔）
      const eventBlocks = buffer.split('\n\n')
      // 最后一段可能不完整，留在 buffer 中
      buffer = eventBlocks.pop() || ''

      for (const eventBlock of eventBlocks) {
        if (!eventBlock.trim()) continue

        let event = 'message' // SSE 默认事件类型
        let data = ''
        let hasData = false

        // 5. 逐行解析字段
        for (const line of eventBlock.split('\n')) {
          // 以首个冒号分割 field name 和 field value
          const colonIndex = line.indexOf(':')
          if (colonIndex === -1) continue // 无冒号的行忽略

          const fieldName = line.substring(0, colonIndex)
          let fieldValue = line.substring(colonIndex + 1)

          // 规范：冒号后最多去除一个空格
          if (fieldValue.startsWith(' ')) {
            fieldValue = fieldValue.slice(1)
          }

          switch (fieldName) {
            case 'event':
              event = fieldValue
              break
            case 'data':
              hasData = true
              // 多行 data 用 \n 拼接
              data += (data ? '\n' : '') + fieldValue
              break
            case 'id':
              // 可扩展：记录 lastEventId 用于断线重连
              break
            case 'retry':
              // 可扩展：设置重连间隔
              break
            default:
              // 未知字段按规范忽略
              break
          }
        }

        // 6. 只要出现过 data: 字段就分派（包括空串）
        if (hasData) {
          try {
            onData({
              event: event,
              data: JSON.parse(data),
            })
          } catch (error) {
            console.error('SSE 数据解析失败:', error, 'raw:', data)
          }
        }
      }
    }

    // 7. 刷新 TextDecoder 中可能残留的多字节字符
    buffer += decoder.decode()
    if (buffer.trim()) {
      console.warn('SSE 流结束时存在未处理的残留数据:', buffer)
    }
  } catch (error) {
    console.error('SSE 读取失败:', error)
    throw error
  } finally {
    // 8. 确保底层连接真正关闭
    await reader.cancel()
  }
}

export const request = <T>(url: string, options = {}) => {
  return baseFetch<T>(url, options)
}

export const get = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'GET' }))
}

export const post = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'POST' }))
}

// Fetch a raw binary resource (document preview/download). Unlike ``baseFetch``, the
// response body is a Blob rather than the JSON envelope, so a JSON body signals an error.
export const getBlob = async (url: string): Promise<Blob> => {
  // 1. Assemble the request URL and attach the auth token
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`
  const { credential, clear: clearCredential } = useCredentialStore()
  const access_token = credential.access_token
  const headers = new Headers()
  if (access_token) headers.set('Authorization', `Bearer ${access_token}`)

  // 2. Initiate the fetch request
  const response = await globalThis.fetch(urlWithPrefix, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  // 3. A JSON body is the error envelope, raw bytes otherwise
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = await response.json()
    if (json.code === httpCode.unauthorized) {
      clearCredential()
      await router.replace({ path: '/auth/login' })
    } else {
      Message.error(json.message)
    }
    throw new Error(json.message)
  }
  if (!response.ok) {
    Message.error(`Network request failed: ${response.status} ${response.statusText}`)
    throw new Error(`Network request failed: ${response.status}`)
  }

  return response.blob()
}

interface UploadOptions {
  method?: string
  headers?: Record<string, string>
  data?: XMLHttpRequestBodyInit
  onprogress?: (e: ProgressEvent<EventTarget>) => void
}


export const upload = <T>(url: string, options: any = {}): Promise<T> => {
  // 1 组装请求URL
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 2.组装xhr请求配置信息
  const defaultOptions = {
    method: 'POST',
    url: urlWithPrefix,
    headers: {},
    data: {},
  }
  options = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  }
  const { credential, clear: clearCredential } = useCredentialStore()
  const access_token = credential.access_token
  if (access_token) options.headers['Authorization'] = `Bearer ${access_token}`

  // 3.构建promise并使用xhr完成文件上传
  return new Promise((resolve, reject) => {
    // 4.创建xhr服务
    const xhr = new XMLHttpRequest()

    // 5.初始化xhr请求并配置headers
    xhr.open(options.method, options.url)
    for (const key in options.headers) {
      xhr.setRequestHeader(key, options.headers[key])
    }

    // 6.设置xhr响应格式并携带授权凭证（例如cookie）
    xhr.withCredentials = true
    xhr.responseType = 'json'

    // 7.监听xhr状态变化并导出数据
    xhr.onreadystatechange = async () => {
      // 8.判断xhr的状态是不是为4，如果为4则代表已经传输完成（涵盖成功与失败）
      if (xhr.readyState === 4) {
        // 9.检查响应状态码，当HTTP状态码为200的时候表示请求成功
        if (xhr.status === 200) {
          // 10.判断业务状态码是否正常
          const response = xhr.response
          if (response.code === httpCode.success) {
            resolve(response)
          } else if (response.code === httpCode.unauthorized) {
            clearCredential()
            await router.replace({ path: '/auth/login' })
          } else {
            reject(xhr.response)
          }
        } else {
          reject(xhr)
        }
      }
    }

    // 10.添加xhr进度监听
    xhr.upload.onprogress = options.onprogress

    // 11.发送请求
    xhr.send(options.data)
  })
}