
import { Message } from '@arco-design/web-vue'

/**
 * Beautify and format JSON strings
 * @param jsonStr Original JSON text
 * @param space Indentation spaces, default to 2
 * @returns Formatted string; return the original content and prompt if there is a format error
 */
export function formatJsonString(jsonStr: string, space = 2): string {
  const trimStr = jsonStr.trim()
  if (!trimStr) return ''

  try {
    const parsed = JSON.parse(trimStr)
    return JSON.stringify(parsed, null, space)
  } catch (err) {
    Message.warning('JSON syntax error, formatting failed, please check')
    console.error('JSON format error:', err)
    return jsonStr
  }
}