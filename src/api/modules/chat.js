import request from '@/utils/request'

// 聊天相关API
export const chatApi = {
  // 获取会话列表
  getConversations: (params = {}) => {
    return request.get('/v1/im/conversations', { params })
  },

  // 获取聊天消息
  getMessages: (conversationId, params = {}) => {
    return request.get(`/v1/im/conversations/${conversationId}/messages`, { params })
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
    return request.post('/v1/im/conversations', conversationData)
  },

  // 上传文件
  uploadFile: (formData) => {
    return request.post('/v1/im/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取历史消息
  getHistoryMessages: (conversationId, beforeTime, limit = 20) => {
    return request.get(`/v1/im/conversations/${conversationId}/history`, {
      params: { beforeTime, limit }
    })
  }
}