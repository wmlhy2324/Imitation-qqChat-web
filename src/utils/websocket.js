import { ElMessage } from 'element-plus'

// 消息类型常量（对应后端constants）
const MESSAGE_TYPE = {
  TEXT: 0
}

// 聊天类型常量（对应后端constants）
const CHAT_TYPE = {
  GROUP: 1,     // 群聊
  SINGLE: 2     // 私聊
}

// 消息帧类型常量（对应后端websocket）
const FRAME_TYPE = {
  DATA: 0x0,
  PING: 0x1,
  ACK: 0x2,
  NO_ACK: 0x3,
  ERR: 0x9,
  TRANSPOND: 0x6
}

class WebSocketManager {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000
    this.userStore = null
    this.chatStore = null
    this.messageQueue = []
    this.pendingMessages = new Map() // 等待ACK确认的消息
  }

  // 连接WebSocket
  connect(userStore, chatStore) {
    // 保存store引用
    this.userStore = userStore
    this.chatStore = chatStore
    
    if (!userStore.token) {
      console.warn('未找到认证token，无法连接WebSocket')
      return
    }

    try {
      // 构建WebSocket URL（后端运行在10090端口，路径为/ws）
      const wsUrl = `ws://localhost:10090/ws`
      
      // 通过sec-websocket-protocol头部传递token（后端认证方式）
      this.ws = new WebSocket(wsUrl, [userStore.token])

      // 连接成功
      this.ws.onopen = () => {
        console.log('WebSocket连接成功')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.chatStore.setConnectionStatus(true)
        
        // 发送用户上线消息
        this.sendUserOnline()
        
        // 处理消息队列
        this.processMessageQueue()
        
        this.startHeartbeat()
        ElMessage.success('连接成功')
      }

      // 连接失败
      this.ws.onerror = (error) => {
        console.error('WebSocket连接失败:', error)
        this.isConnected = false
        this.chatStore.setConnectionStatus(false)
      }

      // 连接断开
      this.ws.onclose = (event) => {
        console.log('WebSocket连接断开:', event.code, event.reason)
        this.isConnected = false
        this.chatStore.setConnectionStatus(false)
        this.stopHeartbeat()
        
        // 如果不是主动断开，尝试重连
        if (event.code !== 1000) {
          this.handleReconnect()
        }
      }

      // 接收消息
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('解析WebSocket消息失败:', error, event.data)
        }
      }

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      ElMessage.error('连接失败')
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnect')
      this.ws = null
    }
    this.isConnected = false
    this.stopHeartbeat()
    this.messageQueue = []
    this.pendingMessages.clear()
    if (this.chatStore) {
      this.chatStore.setConnectionStatus(false)
    }
  }

  // 处理接收到的消息
  handleMessage(message) {
    console.log('收到WebSocket消息:', message)
    
    switch (message.frameType) {
      case FRAME_TYPE.DATA:
        this.handleDataMessage(message)
        break
      case FRAME_TYPE.ACK:
        this.handleAckMessage(message)
        break
      case FRAME_TYPE.ERR:
        this.handleErrorMessage(message)
        break
      case FRAME_TYPE.TRANSPOND:
        this.handleTranspondMessage(message)
        break
      default:
        console.log('未知消息类型:', message.frameType)
    }
  }

  // 处理数据消息
  handleDataMessage(message) {
    const { method, data } = message
    
    switch (method) {
      case 'push':
        // 收到新消息推送
        this.handleNewMessage(data)
        break
      default:
        console.log('未处理的数据消息方法:', method, data)
    }
  }

  // 处理新消息推送
  handleNewMessage(data) {
    console.log('收到新消息推送:', data)
    
    // 判断是否是自己发送的消息
    const isOwnMessage = data.sendId === this.userStore?.userId
    
    // 获取发送者信息
    let senderInfo = null
    if (isOwnMessage) {
      // 自己发送的消息
      senderInfo = {
        id: this.userStore.userId,
        nickname: this.userStore.nickname,
        avatar: this.userStore.avatar
      }
    } else {
      // 其他人发送的消息，从好友列表或群成员中查找
      senderInfo = this.getSenderInfo(data.sendId)
    }
    
    // 转换为前端消息格式
    const message = {
      id: data.msgId,
      conversationId: data.conversationId,
      sendId: data.sendId,
      recvId: data.recvId,
      msgType: data.mType + 1, // 后端从0开始，前端从1开始
      msgContent: data.content,
      chatType: data.chatType,
      sendTime: data.sendTime,
      status: 'delivered',
      isOwn: isOwnMessage,
      contentParsed: data.content,
      senderInfo: senderInfo
    }
    
    console.log('WebSocket接收消息 - 原始数据:', data)
    console.log('WebSocket接收消息 - 处理后消息:', message)
    console.log('WebSocket接收消息 - 是否自己发送:', isOwnMessage)
    console.log('WebSocket接收消息 - 发送者信息:', senderInfo)
    
    // 添加到聊天记录
    this.chatStore.addMessage(data.conversationId, message)
  }

  // 获取发送者信息
  getSenderInfo(senderId) {
    // 从好友列表中查找
    const friend = this.chatStore.friends.find(f => f.id === senderId)
    if (friend) {
      return {
        id: friend.id,
        nickname: friend.nickname || friend.name,
        avatar: friend.avatar
      }
    }
    
    // 如果找不到，返回默认信息
    return {
      id: senderId,
      nickname: '未知用户',
      avatar: ''
    }
  }

  // 处理ACK确认消息
  handleAckMessage(message) {
    const pendingMessage = this.pendingMessages.get(message.id)
    if (pendingMessage) {
      console.log('消息发送成功:', message.id)
      this.pendingMessages.delete(message.id)
      // 可以更新消息状态为已发送
    }
  }

  // 处理错误消息
  handleErrorMessage(message) {
    console.error('WebSocket错误:', message.data)
    ElMessage.error(`发送失败: ${message.data}`)
  }

  // 处理转发消息
  handleTranspondMessage(message) {
    console.log('收到转发消息:', message)
    // 根据需要处理转发消息
  }

  // 发送消息
  sendMessage(messageData) {
    if (!this.isConnected || !this.ws) {
      // 如果未连接，加入队列等待重连
      this.messageQueue.push(messageData)
      ElMessage.error('连接已断开，消息将在重连后发送')
      return false
    }

    try {
      // 构建符合后端格式的消息
      const messageId = this.generateMessageId()
      const wsMessage = {
        frameType: FRAME_TYPE.DATA,
        id: messageId,
        method: 'conversation.chat',
        formId: this.userStore.userId,
        data: {
          chatType: messageData.chatType === 1 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
          conversationId: messageData.conversationId,
          recvId: messageData.recvId,
          msg: {
            mType: MESSAGE_TYPE.TEXT, // 目前只支持文本消息
            content: messageData.content || messageData.msgContent
          }
        }
      }

      console.log('WebSocket发送消息:', wsMessage)
      
      // 发送消息
      this.ws.send(JSON.stringify(wsMessage))
      
      // 记录等待确认的消息
      this.pendingMessages.set(messageId, {
        ...wsMessage,
        timestamp: Date.now()
      })

      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      ElMessage.error('发送消息失败')
      return false
    }
  }

  // 发送用户上线消息
  sendUserOnline() {
    if (!this.isConnected || !this.ws) return

    const message = {
      frameType: FRAME_TYPE.DATA,
      id: this.generateMessageId(),
      method: 'user.online',
      formId: this.userStore.userId,
      data: {}
    }

    console.log('发送用户上线消息:', message)
    this.ws.send(JSON.stringify(message))
  }

  // 标记消息已读
  markMessagesAsRead(conversationId, chatType, recvId, msgIds) {
    if (!this.isConnected || !this.ws) return false

    try {
      const message = {
        frameType: FRAME_TYPE.DATA,
        id: this.generateMessageId(),
        method: 'conversation.markChat',
        formId: this.userStore.userId,
        data: {
          chatType: chatType === 1 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
          conversationId: conversationId,
          recvId: recvId,
          msgIds: msgIds
        }
      }

      console.log('发送标记已读消息:', message)
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('标记已读失败:', error)
      return false
    }
  }

  // 生成消息ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 处理消息队列
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const messageData = this.messageQueue.shift()
      this.sendMessage(messageData)
    }
  }

  // 加入房间（会话） - WebSocket版本不需要显式加入房间
  joinRoom(roomId) {
    console.log('WebSocket模式下自动处理房间管理:', roomId)
    // 原生WebSocket实现中，房间管理由后端根据会话ID自动处理
  }

  // 离开房间 - WebSocket版本不需要显式离开房间
  leaveRoom(roomId) {
    console.log('WebSocket模式下自动处理房间管理:', roomId)
    // 原生WebSocket实现中，房间管理由后端根据会话ID自动处理
  }

  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连失败，已达到最大重连次数')
      ElMessage.error('连接失败，请刷新页面重试')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连...`)
    
    setTimeout(() => {
      if (!this.isConnected && this.userStore && this.chatStore) {
        this.connect(this.userStore, this.chatStore)
      }
    }, delay)
  }

  // 开始心跳检测
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        const pingMessage = {
          frameType: FRAME_TYPE.PING,
          id: this.generateMessageId(),
          data: { timestamp: Date.now() }
        }
        console.log('发送心跳:', pingMessage)
        this.ws.send(JSON.stringify(pingMessage))
      }
    }, this.heartbeatTimeout)
  }

  // 停止心跳检测
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return this.isConnected
  }
}

// 创建单例实例
const wsManager = new WebSocketManager()

// 导出常量供其他模块使用
export { MESSAGE_TYPE, CHAT_TYPE, FRAME_TYPE }
export default wsManager