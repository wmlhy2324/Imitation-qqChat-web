// Pinia store 入口文件
import { createPinia } from 'pinia'

const pinia = createPinia()

// 可以在这里添加插件
// pinia.use(somePiniaPlugin)

export default pinia

// 导出所有store供外部使用
export { useUserStore } from './modules/user'
export { useChatStore } from './modules/chat'
export { useSocialStore } from './modules/social'
export { useAppStore } from './modules/app'