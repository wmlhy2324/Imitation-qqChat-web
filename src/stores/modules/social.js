import { defineStore } from 'pinia'
import { ref } from 'vue'
import { socialApi } from '@/api'

export const useSocialStore = defineStore('social', () => {
  // 状态
  const friends = ref([])
  const groups = ref([])
  const friendRequests = ref([])
  const groupRequests = ref([])
  const isLoading = ref(false)

  // 动作
  const loadFriends = async () => {
    try {
      isLoading.value = true
      const response = await socialApi.getFriends()
      friends.value = response.data
    } catch (error) {
      console.error('加载好友列表失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadGroups = async () => {
    try {
      isLoading.value = true
      const response = await socialApi.getGroups()
      groups.value = response.data
    } catch (error) {
      console.error('加载群组列表失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadFriendRequests = async () => {
    try {
      const response = await socialApi.getFriendRequests()
      // 正确提取好友请求列表
      friendRequests.value = response.data?.list || []
    } catch (error) {
      console.error('加载好友请求失败:', error)
    }
  }

  const sendFriendRequest = async (userId, message) => {
    try {
      console.log('Social Store: 准备发送好友请求', { userId, message })
      
      const requestData = { 
        userId, 
        reqMsg: message 
      }
      console.log('Social Store: 请求数据', requestData)
      
      const response = await socialApi.sendFriendRequest(requestData)
      console.log('Social Store: API响应', response)
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Social Store: 发送好友请求失败', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      })
      
      // 显示具体的后端错误信息
      if (error.response?.data) {
        console.error('后端返回的错误详情:', error.response.data)
        // 使用后端返回的具体错误信息
        const backendMsg = error.response.data.msg || error.response.data.message
        if (backendMsg) {
          return { success: false, message: backendMsg }
        }
      }
      return { success: false, message: error.message }
    }
  }

  const handleFriendRequest = async (requestId, action, replyMessage) => {
    try {
      // 将action转换为后端需要的格式
      // 1: 待处理, 2: 同意, 3: 拒绝
      const handleResult = action === 'accept' ? 2 : 3
      
      const response = await socialApi.handleFriendRequest({
        friendReqId: requestId,
        handleResult
      })
      
      // 更新本地请求状态
      const requestIndex = friendRequests.value.findIndex(req => req.id === requestId)
      if (requestIndex >= 0) {
        friendRequests.value[requestIndex].handle_result = handleResult
        friendRequests.value[requestIndex].handle_msg = replyMessage || ''
      }
      
      // 如果接受请求，重新加载好友列表
      if (action === 'accept') {
        await loadFriends()
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('处理好友请求失败:', error)
      return { success: false, message: error.message }
    }
  }

  const deleteFriend = async (friendId) => {
    try {
      await socialApi.deleteFriend(friendId)
      // 从本地列表中移除
      friends.value = friends.value.filter(friend => friend.id !== friendId)
      return { success: true }
    } catch (error) {
      console.error('删除好友失败:', error)
      return { success: false, message: error.message }
    }
  }

  const createGroup = async (groupData) => {
    try {
      const response = await socialApi.createGroup(groupData)
      const newGroup = response.data
      groups.value.unshift(newGroup)
      return { success: true, data: newGroup }
    } catch (error) {
      console.error('创建群组失败:', error)
      return { success: false, message: error.message }
    }
  }

  const joinGroup = async (groupId) => {
    try {
      const response = await socialApi.joinGroup(groupId)
      await loadGroups() // 重新加载群组列表
      return { success: true, data: response.data }
    } catch (error) {
      console.error('加入群组失败:', error)
      return { success: false, message: error.message }
    }
  }

  const leaveGroup = async (groupId) => {
    try {
      await socialApi.leaveGroup(groupId)
      // 从本地列表中移除
      groups.value = groups.value.filter(group => group.id !== groupId)
      return { success: true }
    } catch (error) {
      console.error('退出群组失败:', error)
      return { success: false, message: error.message }
    }
  }

  const searchUsers = async (keyword) => {
    try {
      // 使用userApi搜索用户
      const { userApi } = await import('@/api')
      const response = await userApi.searchUsers(keyword)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('搜索用户失败:', error)
      return { success: false, message: error.message }
    }
  }

  const clearSocialData = () => {
    friends.value = []
    groups.value = []
    friendRequests.value = []
    groupRequests.value = []
  }

  return {
    // 状态
    friends,
    groups,
    friendRequests,
    groupRequests,
    isLoading,
    
    // 动作
    loadFriends,
    loadGroups,
    loadFriendRequests,
    sendFriendRequest,
    handleFriendRequest,
    deleteFriend,
    createGroup,
    joinGroup,
    leaveGroup,
    searchUsers,
    clearSocialData
  }
})