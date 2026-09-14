export default {
  // Get localStorage value
  get: (key: string, defaultValue: any = ''): any => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return defaultValue
  },
  // set the item value of localStorage
  set: (key: string, value: any): void => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  },
  // remove item from localStorage
  remove: (key: string): void => {
    localStorage.removeItem(key)
  },
  // clear item value of localStorage
  clear: (): void => {
    localStorage.clear()
  },
}
