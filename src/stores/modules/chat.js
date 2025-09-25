import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi, socialApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref(new Map()) // 会话列表
  const messages = ref(new Map()) // 消息缓存 conversationId -> messages[]
  const currentConversationId = ref('') // 当前选中的会话ID
  const onlineUsers = ref(new Set()) // 在线用户列表
  const isConnected = ref(false) // WebSocket连接状态
  const isLoading = ref(false)
  const friends = ref([]) // 好友列表
  const groups = ref([]) // 群组列表
  
  // 计算属性
  const conversationList = computed(() => {
    return Array.from(conversations.value.values())
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
  })
  
  const currentConversation = computed(() => {
    return conversations.value.get(currentConversationId.value) || null
  })
  
  const currentMessages = computed(() => {
    return messages.value.get(currentConversationId.value) || []
  })

  // 动作
  
  // 获取会话列表
  const fetchConversations = async () => {
    try {
      isLoading.value = true
      const response = await chatApi.getConversations()
      const data = response.data
      
      // 根据后端API结构处理数据
      if (data.conversationList) {
        const newConversations = new Map()
        Object.entries(data.conversationList).forEach(([id, conv]) => {
          newConversations.set(id, {
            id: conv.conversationId || id,
            conversationId: conv.conversationId || id,
            chatType: conv.chatType, // 2: 私聊, 1: 群聊
            targetId: conv.targetId,
            isShow: conv.isShow,
            seq: conv.seq,
            total: conv.total,
            unread: conv.unread,
            lastMessage: null,
            lastMessageTime: null,
            // 扩展字段
            title: '', // 会话标题，稍后从好友/群组数据中获取
            avatar: '', // 头像
            online: false // 是否在线（私聊）
          })
        })
        conversations.value = newConversations
        
        // 获取会话的详细信息（标题、头像等）
        await enrichConversationInfo()
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
      ElMessage.error('获取会话列表失败')
    } finally {
      isLoading.value = false
    }
  }

  // 丰富会话信息（获取标题、头像等）
  const enrichConversationInfo = async () => {
    try {
      // 并行获取好友和群组信息
      const [friendsResponse, groupsResponse] = await Promise.all([
        socialApi.getFriends().catch(() => ({ data: [] })),
        socialApi.getGroups().catch(() => ({ data: [] }))
      ])
      
      friends.value = friendsResponse.data || []
      groups.value = groupsResponse.data || []
      
      // 创建映射表
      const friendsMap = new Map(friends.value.map(f => [f.id, f]))
      const groupsMap = new Map(groups.value.map(g => [g.id, g]))
      
      // 更新会话信息
      conversations.value.forEach((conv, id) => {
        if (conv.chatType === 2) {
          // 私聊
          const friend = friendsMap.get(conv.targetId)
          if (friend) {
            conv.title = friend.nickname || friend.phone || '未知用户'
            conv.avatar = friend.avatar || ''
            conv.online = onlineUsers.value.has(conv.targetId)
          }
        } else if (conv.chatType === 1) {
          // 群聊
          const group = groupsMap.get(conv.targetId)
          if (group) {
            conv.title = group.name || '未命名群组'
            conv.avatar = group.avatar || ''
            conv.memberCount = group.memberCount || 0
          }
        }
      })
    } catch (error) {
      console.error('获取会话详细信息失败:', error)
    }
  }

  // 获取聊天记录
  const fetchMessages = async (conversationId, options = {}) => {
    try {
      const { startSendTime, endSendTime, count = 20 } = options
      const response = await chatApi.getMessages(conversationId, {
        startSendTime,
        endSendTime,
        count
      })
      
      const messageList = response.data.list || []
      
      // 转换消息格式
      const formattedMessages = messageList.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        sendId: msg.sendId,
        recvId: msg.recvId,
        msgType: msg.msgType, // 1: 文本, 2: 图片, 3: 文件等
        msgContent: msg.msgContent,
        chatType: msg.chatType,
        sendTime: msg.sendTime,
        // 扩展字段
        status: 'sent', // sent, delivered, read
        senderInfo: null, // 发送者信息，稍后填充
        isOwn: false, // 是否是自己发送的消息
        contentParsed: null // 解析后的内容（如JSON）
      }))
      
      // 填充发送者信息
      await enrichMessageSenderInfo(formattedMessages)
      
      // 更新消息缓存
      if (options.prepend) {
        // 历史消息，添加到前面
        const existingMessages = messages.value.get(conversationId) || []
        messages.value.set(conversationId, [...formattedMessages, ...existingMessages])
      } else {
        // 新消息或重新获取
        messages.value.set(conversationId, formattedMessages)
      }
      
      // 更新会话的最后一条消息
      if (formattedMessages.length > 0) {
        const lastMessage = formattedMessages[formattedMessages.length - 1]
        updateConversationLastMessage(conversationId, lastMessage)
      }
      
      return formattedMessages
    } catch (error) {
      console.error('获取聊天记录失败:', error)
      ElMessage.error('获取聊天记录失败')
      return []
    }
  }

  // 填充消息发送者信息
  const enrichMessageSenderInfo = async (messageList) => {
    const userStore = useUserStore()
    const currentUserId = userStore.userId
    
    // 创建用户信息映射
    const userInfoMap = new Map()
    
    // 添加当前用户信息
    userInfoMap.set(currentUserId, {
      id: currentUserId,
      nickname: userStore.nickname,
      avatar: userStore.avatar
    })
    
    // 添加好友信息
    friends.value.forEach(friend => {
      userInfoMap.set(friend.id, friend)
    })
    
    // 填充消息发送者信息
    messageList.forEach(msg => {
      msg.isOwn = msg.sendId === currentUserId
      msg.senderInfo = userInfoMap.get(msg.sendId) || {
        id: msg.sendId,
        nickname: '未知用户',
        avatar: ''
      }
      
      // 解析消息内容
      if (msg.msgType === 1) {
        // 文本消息
        msg.contentParsed = msg.msgContent
      } else if (msg.msgType === 2) {
        // 图片消息
        try {
          msg.contentParsed = JSON.parse(msg.msgContent)
        } catch {
          msg.contentParsed = { url: msg.msgContent }
        }
      } else if (msg.msgType === 3) {
        // 文件消息
        try {
          msg.contentParsed = JSON.parse(msg.msgContent)
        } catch {
          msg.contentParsed = { url: msg.msgContent, name: '文件' }
        }
      }
    })
  }

  // 发送消息
  const sendMessage = async (messageData) => {
    try {
      const response = await chatApi.sendMessage(messageData)
      return response.data
    } catch (error) {
      console.error('发送消息失败:', error)
      ElMessage.error('发送消息失败')
      throw error
    }
  }

  // 添加消息（WebSocket接收到新消息时调用）
  const addMessage = (conversationId, message) => {
    const existingMessages = messages.value.get(conversationId) || []
    
    // 检查消息是否已存在（避免重复）
    const messageExists = existingMessages.some(msg => msg.id === message.id)
    if (messageExists) return
    
    // 格式化消息
    const formattedMessage = {
      ...message,
      senderInfo: null,
      isOwn: false,
      contentParsed: null
    }
    
    // 填充发送者信息（同步）
    enrichMessageSenderInfo([formattedMessage])
    
    // 添加到消息列表
    existingMessages.push(formattedMessage)
    messages.value.set(conversationId, existingMessages)
    
    // 更新会话的最后一条消息
    updateConversationLastMessage(conversationId, formattedMessage)
    
    // 如果不是当前会话，增加未读数
    if (conversationId !== currentConversationId.value && !formattedMessage.isOwn) {
      const conversation = conversations.value.get(conversationId)
      if (conversation) {
        conversation.unread = (conversation.unread || 0) + 1
      }
    }
  }

  // 更新会话的最后一条消息
  const updateConversationLastMessage = (conversationId, message) => {
    const conversation = conversations.value.get(conversationId)
    if (conversation) {
      conversation.lastMessage = message
      conversation.lastMessageTime = message.sendTime
    }
  }

  // 设置当前会话
  const setCurrentConversation = (conversationId) => {
    currentConversationId.value = conversationId
    
    // 标记消息为已读
    const conversation = conversations.value.get(conversationId)
    if (conversation && conversation.unread > 0) {
      conversation.unread = 0
      // 调用API标记为已读
      markConversationAsRead(conversationId)
    }
  }

  // 标记会话为已读
  const markConversationAsRead = async (conversationId) => {
    try {
      const messageList = messages.value.get(conversationId) || []
      if (messageList.length > 0) {
        const lastMessage = messageList[messageList.length - 1]
        await chatApi.markAsRead(conversationId, lastMessage.id)
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 创建新会话
  const createConversation = async (conversationData) => {
    try {
      const response = await chatApi.createConversation(conversationData)
      
      // 刷新会话列表
      await fetchConversations()
      
      return response.data
    } catch (error) {
      console.error('创建会话失败:', error)
      ElMessage.error('创建会话失败')
      throw error
    }
  }

  // WebSocket 相关方法
  const setConnectionStatus = (status) => {
    isConnected.value = status
  }

  const setOnlineUsers = (users) => {
    onlineUsers.value = new Set(users)
    
    // 更新会话中用户的在线状态
    conversations.value.forEach(conv => {
      if (conv.chatType === 2) { // 私聊
        conv.online = onlineUsers.value.has(conv.targetId)
      }
    })
  }

  const addOnlineUser = (userId) => {
    onlineUsers.value.add(userId)
    
    // 更新相关会话的在线状态
    conversations.value.forEach(conv => {
      if (conv.chatType === 2 && conv.targetId === userId) {
        conv.online = true
      }
    })
  }

  const removeOnlineUser = (userId) => {
    onlineUsers.value.delete(userId)
    
    // 更新相关会话的在线状态
    conversations.value.forEach(conv => {
      if (conv.chatType === 2 && conv.targetId === userId) {
        conv.online = false
      }
    })
  }

  // 创建或获取会话
  const createOrGetConversation = async (conversationData) => {
    try {
      // 检查是否已存在相同类型和目标的会话
      const existingConv = Array.from(conversations.value.values()).find(conv => 
        conv.chatType === conversationData.ChatType && 
        conv.targetId === conversationData.recvId
      )
      
      if (existingConv) {
        // 切换到现有会话
        return { success: true, data: existingConv }
      }
      
      // 创建新会话
      const response = await createConversation(conversationData)
      
      return { success: true, data: response }
    } catch (error) {
      console.error('创建或获取会话失败:', error)
      return { success: false, message: error.message }
    }
  }

  // 清除所有数据
  const clearAll = () => {
    conversations.value.clear()
    messages.value.clear()
    currentConversationId.value = ''
    onlineUsers.value.clear()
    isConnected.value = false
    friends.value = []
    groups.value = []
  }

  return {
    // 状态
    conversations,
    messages,
    currentConversationId,
    onlineUsers,
    isConnected,
    isLoading,
    friends,
    groups,
    
    // 计算属性
    conversationList,
    currentConversation,
    currentMessages,
    
    // 动作
    fetchConversations,
    fetchMessages,
    sendMessage,
    addMessage,
    setCurrentConversation,
    createConversation,
    createOrGetConversation,
    setConnectionStatus,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    clearAll
  }
})

// 修复导入问题
import { useUserStore } from './user'