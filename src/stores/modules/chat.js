import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi } from '@/api'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref({}) // 按会话ID存储消息
  const unreadCounts = ref({}) // 未读消息计数
  const onlineUsers = ref(new Set()) // 在线用户
  const isConnected = ref(false) // WebSocket连接状态

  // 计算属性
  const totalUnreadCount = computed(() => {
    return Object.values(unreadCounts.value).reduce((total, count) => total + count, 0)
  })

  const currentMessages = computed(() => {
    if (!currentConversation.value) return []
    return messages.value[currentConversation.value.id] || []
  })

  // 动作
  const setConversations = (newConversations) => {
    conversations.value = newConversations
  }

  const addConversation = (conversation) => {
    const existIndex = conversations.value.findIndex(c => c.id === conversation.id)
    if (existIndex >= 0) {
      conversations.value[existIndex] = conversation
    } else {
      conversations.value.unshift(conversation)
    }
  }

  const setCurrentConversation = (conversation) => {
    currentConversation.value = conversation
    // 标记为已读
    if (conversation && unreadCounts.value[conversation.id]) {
      unreadCounts.value[conversation.id] = 0
    }
  }

  const addMessage = (conversationId, message) => {
    if (!messages.value[conversationId]) {
      messages.value[conversationId] = []
    }
    messages.value[conversationId].push(message)
    
    // 更新未读计数
    if (currentConversation.value?.id !== conversationId) {
      unreadCounts.value[conversationId] = (unreadCounts.value[conversationId] || 0) + 1
    }
  }

  const setMessages = (conversationId, messageList) => {
    messages.value[conversationId] = messageList
  }

  const sendMessage = async (messageData) => {
    try {
      const response = await chatApi.sendMessage(messageData)
      const message = response.data
      
      // 添加到当前会话消息
      if (currentConversation.value) {
        addMessage(currentConversation.value.id, message)
      }
      
      return { success: true, data: message }
    } catch (error) {
      console.error('发送消息失败:', error)
      return { success: false, message: error.message }
    }
  }

  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations()
      setConversations(response.data)
    } catch (error) {
      console.error('加载会话列表失败:', error)
    }
  }

  const loadMessages = async (conversationId, page = 1, pageSize = 20) => {
    try {
      const response = await chatApi.getMessages(conversationId, { page, pageSize })
      const messageList = response.data
      
      if (page === 1) {
        setMessages(conversationId, messageList)
      } else {
        // 历史消息插入到开头
        if (!messages.value[conversationId]) {
          messages.value[conversationId] = []
        }
        messages.value[conversationId].unshift(...messageList)
      }
      
      return messageList
    } catch (error) {
      console.error('加载消息失败:', error)
      return []
    }
  }

  const markAsRead = (conversationId) => {
    unreadCounts.value[conversationId] = 0
  }

  const setOnlineUsers = (users) => {
    onlineUsers.value = new Set(users)
  }

  const addOnlineUser = (userId) => {
    onlineUsers.value.add(userId)
  }

  const removeOnlineUser = (userId) => {
    onlineUsers.value.delete(userId)
  }

  const setConnectionStatus = (status) => {
    isConnected.value = status
  }

  const clearChatData = () => {
    conversations.value = []
    currentConversation.value = null
    messages.value = {}
    unreadCounts.value = {}
    onlineUsers.value = new Set()
    isConnected.value = false
  }

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    onlineUsers,
    isConnected,
    
    // 计算属性
    totalUnreadCount,
    currentMessages,
    
    // 动作
    setConversations,
    addConversation,
    setCurrentConversation,
    addMessage,
    setMessages,
    sendMessage,
    loadConversations,
    loadMessages,
    markAsRead,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setConnectionStatus,
    clearChatData
  }
})