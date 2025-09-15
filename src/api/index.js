// API模块统一导出
export { userApi } from './modules/user'
export { chatApi } from './modules/chat'
export { socialApi } from './modules/social'

// 也可以作为默认导出
import { userApi } from './modules/user'
import { chatApi } from './modules/chat'
import { socialApi } from './modules/social'

export default {
  user: userApi,
  chat: chatApi,
  social: socialApi
}