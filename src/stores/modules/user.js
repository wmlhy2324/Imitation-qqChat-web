import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import { userApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(null)
  const token = ref(Cookies.get('token') || '')
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!userInfo.value)
  const userId = computed(() => userInfo.value?.id || '')
  const nickname = computed(() => userInfo.value?.nickname || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  // 动作
  const login = async (credentials) => {
    try {
      isLoading.value = true
      const response = await userApi.login(credentials)
      const { token: newToken, expire, user: newUserInfo } = response.data
      
      // 保存token和用户信息
      token.value = newToken
      userInfo.value = newUserInfo
      
      // 保存到cookie，使用后端返回的过期时间
      const expireDays = expire ? Math.ceil((expire - Date.now()) / (24 * 60 * 60 * 1000)) : 7
      Cookies.set('token', newToken, { expires: expireDays })
      
      return { success: true }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: error.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      const response = await userApi.register(userData)
      const { token: newToken, expire } = response.data
      
      // 注册成功后自动登录
      token.value = newToken
      
      // 保存到cookie
      const expireDays = expire ? Math.ceil((expire - Date.now()) / (24 * 60 * 60 * 1000)) : 7
      Cookies.set('token', newToken, { expires: expireDays })
      
      // 获取用户信息
      await fetchUserInfo()
      
      return { success: true }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: error.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    userInfo.value = null
    token.value = ''
    Cookies.remove('token')
    // 可以在这里添加其他清理操作
  }

  const updateUserInfo = (newUserInfo) => {
    userInfo.value = { ...userInfo.value, ...newUserInfo }
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    
    try {
      const response = await userApi.getUserInfo()
      userInfo.value = response.data.info // 根据后端UserInfoResp结构调整
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果token失效，清除本地数据
      if (error.response?.status === 401) {
        logout()
      }
    }
  }

  const initUserState = async () => {
    if (token.value) {
      await fetchUserInfo()
    }
  }

  return {
    // 状态
    userInfo,
    token,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    userId,
    nickname,
    avatar,
    
    // 动作
    login,
    register,
    logout,
    updateUserInfo,
    fetchUserInfo,
    initUserState
  }
})