import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const theme = ref('light') // 主题模式
  const language = ref('zh-CN') // 语言
  const sidebarCollapsed = ref(false) // 侧边栏折叠状态
  const isMobile = ref(false) // 是否移动端
  const loading = ref(false) // 全局加载状态
  const notifications = ref([]) // 通知列表

  // 动作
  const setTheme = (newTheme) => {
    theme.value = newTheme
    // 保存到localStorage
    localStorage.setItem('app_theme', newTheme)
    // 更新HTML类名
    document.documentElement.className = newTheme
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  const setLanguage = (newLanguage) => {
    language.value = newLanguage
    localStorage.setItem('app_language', newLanguage)
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed) => {
    sidebarCollapsed.value = collapsed
  }

  const setMobile = (mobile) => {
    isMobile.value = mobile
  }

  const setLoading = (loadingState) => {
    loading.value = loadingState
  }

  const addNotification = (notification) => {
    const id = Date.now().toString()
    const newNotification = {
      id,
      type: 'info', // info | success | warning | error
      title: '',
      message: '',
      duration: 4500,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // 自动移除通知
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index >= 0) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // 初始化应用状态
  const initAppState = () => {
    // 从localStorage恢复设置
    const savedTheme = localStorage.getItem('app_theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
    
    const savedLanguage = localStorage.getItem('app_language')
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
    
    // 检测移动端
    const checkMobile = () => {
      setMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  return {
    // 状态
    theme,
    language,
    sidebarCollapsed,
    isMobile,
    loading,
    notifications,
    
    // 动作
    setTheme,
    toggleTheme,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,
    setMobile,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    initAppState
  }
})