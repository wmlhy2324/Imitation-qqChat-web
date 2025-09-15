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
      friendRequests.value = response.data
    } catch (error) {
      console.error('加载好友请求失败:', error)
    }
  }

  const sendFriendRequest = async (userId, message) => {
    try {
      const response = await socialApi.sendFriendRequest({ userId, message })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('发送好友请求失败:', error)
      return { success: false, message: error.message }
    }
  }

  const handleFriendRequest = async (requestId, action, replyMessage) => {
    try {
      const response = await socialApi.handleFriendRequest({
        requestId,
        action, // 'accept' | 'reject'
        replyMessage
      })
      
      // 更新本地请求状态
      const requestIndex = friendRequests.value.findIndex(req => req.id === requestId)
      if (requestIndex >= 0) {
        friendRequests.value[requestIndex].handleResult = action === 'accept' ? 1 : 2
        friendRequests.value[requestIndex].handleMsg = replyMessage
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
      const response = await socialApi.searchUsers(keyword)
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