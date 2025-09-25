import request from '@/utils/request'

// 聊天相关API
export const chatApi = {
  // 获取会话列表
  getConversations: (params = {}) => {
    return request.get('/v1/im/conversation', { params })
  },

  // 获取聊天消息
  getMessages: (conversationId, params = {}) => {
    // 后端API接口是 /v1/im/chatlog，需要传入conversationId等参数
    const chatlogParams = {}
    
    // 确保必需参数始终存在
    chatlogParams.conversationId = conversationId
    chatlogParams.startSendTime = params.startSendTime !== undefined ? params.startSendTime : 0
    chatlogParams.endSendTime = params.endSendTime !== undefined ? params.endSendTime : 0
    chatlogParams.count = params.count || 20
    
    // 添加其他参数
    Object.keys(params).forEach(key => {
      if (!['startSendTime', 'endSendTime', 'count'].includes(key)) {
        chatlogParams[key] = params[key]
      }
    })
    
    console.log('API请求参数:', chatlogParams) // 调试用
    
    return request.get('/v1/im/chatlog', { params: chatlogParams })
  },

  // 发送消息
  sendMessage: (messageData) => {
    return request.post('/v1/im/messages', messageData)
  },

  // 标记消息为已读
  markAsRead: (conversationId, messageId) => {
    return request.put(`/v1/im/conversations/${conversationId}/read`, { messageId })
  },

  // 创建会话
  createConversation: (conversationData) => {
    return request.post('/v1/im/setup/conversation', conversationData)
  },

  // 上传文件
  uploadFile: (formData) => {
    return request.post('/v1/im/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取历史消息（分页加载更多）
  getHistoryMessages: (conversationId, options = {}) => {
    const params = {}
    
    // 确保必需参数始终存在
    params.conversationId = conversationId
    params.startSendTime = options.startSendTime !== undefined ? options.startSendTime : 0
    params.endSendTime = options.endSendTime !== undefined ? options.endSendTime : (options.beforeTime || 0)
    params.count = options.limit || options.count || 20
    
    console.log('历史消息API请求参数:', params) // 调试用
    
    return request.get('/v1/im/chatlog', { params })
  }
}