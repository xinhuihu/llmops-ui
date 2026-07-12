// api请求接口前缀
export const apiPrefix: string = 'http://localhost:5000'

// 业务桩体阿妈
export const httpCode = {
  success: 'success',
  fail: 'fail',
  notFound: 'not_found',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  validateError: 'validate_error',
}
// 类型字符串与中文映射
export const typeMap: { [key: string]: string } = {
  str: 'string',
  int: 'int',
  float: 'float',
  bool: 'bool',
}