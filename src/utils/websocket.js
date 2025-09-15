import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'
import { useChatStore, useUserStore } from '@/stores'

class WebSocketManager {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000
  }

  // 连接WebSocket
  connect() {
    const userStore = useUserStore()
    const chatStore = useChatStore()
    
    if (!userStore.token) {
      console.warn('未找到认证token，无法连接WebSocket')
      return
    }

    try {
      this.socket = io('/ws', {
        auth: {
          token: userStore.token
        },
        transports: ['websocket'],
        reconnection: false // 手动处理重连
      })

      // 连接成功
      this.socket.on('connect', () => {
        console.log('WebSocket连接成功')
        this.isConnected = true
        this.reconnectAttempts = 0
        chatStore.setConnectionStatus(true)
        this.startHeartbeat()
        ElMessage.success('连接成功')
      })

      // 连接失败
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket连接失败:', error)
        this.isConnected = false
        chatStore.setConnectionStatus(false)
        this.handleReconnect()
      })

      // 连接断开
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket连接断开:', reason)
        this.isConnected = false
        chatStore.setConnectionStatus(false)
        this.stopHeartbeat()
        
        if (reason !== 'io client disconnect') {
          this.handleReconnect()
        }
      })

      // 接收新消息
      this.socket.on('new_message', (message) => {
        console.log('收到新消息:', message)
        chatStore.addMessage(message.conversationId, message)
      })

      // 用户在线状态变化
      this.socket.on('user_online', (userId) => {
        console.log('用户上线:', userId)
        chatStore.addOnlineUser(userId)
      })

      this.socket.on('user_offline', (userId) => {
        console.log('用户下线:', userId)
        chatStore.removeOnlineUser(userId)
      })

      // 在线用户列表
      this.socket.on('online_users', (users) => {
        console.log('在线用户列表:', users)
        chatStore.setOnlineUsers(users)
      })

      // 消息状态更新
      this.socket.on('message_status', (data) => {
        console.log('消息状态更新:', data)
        // 可以在这里更新消息的已读状态等
      })

      // 系统通知
      this.socket.on('system_notification', (notification) => {
        console.log('系统通知:', notification)
        ElMessage.info(notification.message)
      })

    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      ElMessage.error('连接失败')
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.stopHeartbeat()
    const chatStore = useChatStore()
    chatStore.setConnectionStatus(false)
  }

  // 发送消息
  sendMessage(messageData) {
    if (!this.isConnected || !this.socket) {
      ElMessage.error('连接已断开，请稍后重试')
      return false
    }

    this.socket.emit('send_message', messageData)
    return true
  }

  // 加入房间（会话）
  joinRoom(roomId) {
    if (!this.isConnected || !this.socket) return
    
    this.socket.emit('join_room', { roomId })
  }

  // 离开房间
  leaveRoom(roomId) {
    if (!this.isConnected || !this.socket) return
    
    this.socket.emit('leave_room', { roomId })
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
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  // 开始心跳检测
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('ping')
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

export default wsManager