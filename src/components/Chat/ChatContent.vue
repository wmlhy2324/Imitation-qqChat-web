<template>
  <div class="chat-content">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="conversation-info">
        <el-avatar :size="40" :src="conversation.avatar">
          {{ conversation.title?.charAt(0) }}
        </el-avatar>
        <div class="info-details">
          <h3>{{ conversation.title }}</h3>
          <span v-if="conversation.chatType === 1" class="status">
            {{ conversation.online ? '在线' : '离线' }}
          </span>
          <span v-else class="status">
            {{ conversation.memberCount || 0 }} 名成员
          </span>
        </div>
      </div>
      
      <div class="header-actions">
        <el-tooltip content="语音通话">
          <el-button :icon="Phone" circle @click="handleVoiceCall" />
        </el-tooltip>
        <el-tooltip content="视频通话">
          <el-button :icon="VideoCamera" circle @click="handleVideoCall" />
        </el-tooltip>
        <el-tooltip content="会话信息">
          <el-button :icon="InfoFilled" circle @click="handleShowInfo" />
        </el-tooltip>
      </div>
    </div>

    <!-- 消息列表区域 -->
    <div 
      ref="messagesContainer"
      class="messages-container"
      @scroll="handleScroll"
    >
      <!-- 加载更多按钮 -->
      <div v-if="hasMore" class="load-more">
        <el-button 
          :loading="loading"
          size="small"
          text
          @click="handleLoadMore"
        >
          {{ loading ? '加载中...' : '加载更多消息' }}
        </el-button>
      </div>

      <!-- 消息列表 -->
      <div class="messages-list">
        <div
          v-for="(message, index) in messages"
          :key="message.id"
          class="message-wrapper"
          :class="{ 'is-own': message.isOwn }"
        >
          <!-- 时间分隔线 -->
          <div 
            v-if="shouldShowTimeDivider(message, index)"
            class="time-divider"
          >
            <span>{{ formatMessageTime(message.sendTime) }}</span>
          </div>

          <!-- 消息内容 -->
          <div class="message-item">
            <!-- 头像（别人的消息显示在左侧） -->
            <el-avatar 
              v-if="!message.isOwn"
              :size="36"
              :src="message.senderInfo?.avatar"
              class="message-avatar"
            >
              {{ message.senderInfo?.nickname?.charAt(0) }}
            </el-avatar>

            <!-- 消息主体 -->
            <div class="message-body">
              <!-- 发送者名称（群聊中显示） -->
              <div 
                v-if="!message.isOwn && conversation.chatType === 2"
                class="sender-name"
              >
                {{ message.senderInfo?.nickname || '未知用户' }}
              </div>

              <!-- 消息内容 -->
              <div class="message-content" :class="`message-type-${message.msgType}`">
                <!-- 文本消息 -->
                <div v-if="message.msgType === 1" class="text-message">
                  {{ message.contentParsed }}
                </div>

                <!-- 图片消息 -->
                <div v-else-if="message.msgType === 2" class="image-message">
                  <el-image
                    :src="message.contentParsed?.url || message.msgContent"
                    fit="cover"
                    class="message-image"
                    :preview-src-list="[message.contentParsed?.url || message.msgContent]"
                    preview-teleported
                  />
                </div>

                <!-- 文件消息 -->
                <div v-else-if="message.msgType === 3" class="file-message">
                  <div class="file-info">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <div class="file-details">
                      <div class="file-name">
                        {{ message.contentParsed?.name || '未知文件' }}
                      </div>
                      <div class="file-size">
                        {{ formatFileSize(message.contentParsed?.size) }}
                      </div>
                    </div>
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="handleDownloadFile(message)"
                    >
                      下载
                    </el-button>
                  </div>
                </div>

                <!-- 其他类型消息 -->
                <div v-else class="unsupported-message">
                  <el-icon><WarningFilled /></el-icon>
                  <span>不支持的消息类型</span>
                </div>
              </div>

              <!-- 消息状态和时间 -->
              <div class="message-meta">
                <span class="message-time">
                  {{ formatTime(message.sendTime) }}
                </span>
                
                <!-- 消息状态（仅自己的消息显示） -->
                <div v-if="message.isOwn" class="message-status">
                  <el-icon 
                    v-if="message.status === 'sending'"
                    class="status-sending"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon 
                    v-else-if="message.status === 'sent'"
                    class="status-sent"
                  >
                    <Check />
                  </el-icon>
                  <el-icon 
                    v-else-if="message.status === 'delivered'"
                    class="status-delivered"
                  >
                    <Check />
                  </el-icon>
                  <el-icon 
                    v-else-if="message.status === 'read'"
                    class="status-read"
                  >
                    <Check />
                  </el-icon>
                </div>
              </div>
            </div>

            <!-- 头像（自己的消息显示在右侧） -->
            <el-avatar 
              v-if="message.isOwn"
              :size="36"
              :src="message.senderInfo?.avatar"
              class="message-avatar"
            >
              {{ message.senderInfo?.nickname?.charAt(0) }}
            </el-avatar>
          </div>
        </div>
      </div>

      <!-- 正在输入指示器 -->
      <div v-if="typingUsers.length > 0" class="typing-indicator">
        <div class="typing-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">
            {{ getTypingText() }}
          </span>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <MessageInput 
      :conversation="conversation"
      @send="handleSendMessage"
      @typing="handleTyping"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import {
  Phone,
  VideoCamera,
  InfoFilled,
  Document,
  WarningFilled,
  Loading,
  Check
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MessageInput from './MessageInput.vue'

// Props
const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['send-message', 'load-more'])

// 响应式数据
const messagesContainer = ref()
const hasMore = ref(true)
const typingUsers = ref([])
const shouldScrollToBottom = ref(true)

// 计算属性
const sortedMessages = computed(() => {
  return [...props.messages].sort((a, b) => a.sendTime - b.sendTime)
})

// 方法
const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  
  // 检查是否滚动到顶部（用于加载更多）
  if (scrollTop === 0 && hasMore.value) {
    handleLoadMore()
  }
  
  // 检查是否应该自动滚动到底部
  shouldScrollToBottom.value = scrollTop + clientHeight >= scrollHeight - 100
}

const handleLoadMore = () => {
  if (props.loading || !hasMore.value) return
  
  const oldestMessage = sortedMessages.value[0]
  if (oldestMessage) {
    emit('load-more', props.conversation.id, oldestMessage.sendTime)
  }
}

const handleSendMessage = (messageData) => {
  emit('send-message', {
    ...messageData,
    conversationId: props.conversation.id
  })
}

const handleTyping = (isTyping) => {
  // TODO: 发送正在输入状态到WebSocket
  console.log('正在输入:', isTyping)
}

const handleVoiceCall = () => {
  ElMessage.info('语音通话功能开发中')
}

const handleVideoCall = () => {
  ElMessage.info('视频通话功能开发中')
}

const handleShowInfo = () => {
  ElMessage.info('会话信息功能开发中')
}

const handleDownloadFile = (message) => {
  const fileUrl = message.contentParsed?.url || message.msgContent
  if (fileUrl) {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = message.contentParsed?.name || '文件'
    link.click()
  }
}

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (messagesContainer.value) {
      const container = messagesContainer.value
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  })
}

const shouldShowTimeDivider = (message, index) => {
  if (index === 0) return true
  
  const currentTime = dayjs(message.sendTime)
  const prevTime = dayjs(sortedMessages.value[index - 1].sendTime)
  
  // 如果时间差超过5分钟，显示时间分隔线
  return currentTime.diff(prevTime, 'minute') > 5
}

const formatMessageTime = (timestamp) => {
  const now = dayjs()
  const messageTime = dayjs(timestamp)
  
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm')
  } else if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${messageTime.format('HH:mm')}`
  } else if (messageTime.isSame(now, 'year')) {
    return messageTime.format('MM月DD日 HH:mm')
  } else {
    return messageTime.format('YYYY年MM月DD日 HH:mm')
  }
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('HH:mm')
}

const formatFileSize = (size) => {
  if (!size) return ''
  
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let fileSize = size
  
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024
    index++
  }
  
  return `${fileSize.toFixed(1)} ${units[index]}`
}

const getTypingText = () => {
  if (typingUsers.value.length === 1) {
    return `${typingUsers.value[0]} 正在输入...`
  } else if (typingUsers.value.length > 1) {
    return `${typingUsers.value.length} 人正在输入...`
  }
  return ''
}

// 监听消息变化，自动滚动到底部
watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && shouldScrollToBottom.value) {
      scrollToBottom()
    }
  }
)

// 监听会话变化，滚动到底部
watch(
  () => props.conversation.id,
  () => {
    nextTick(() => {
      scrollToBottom(false)
    })
  }
)

// 生命周期
onMounted(() => {
  scrollToBottom(false)
})
</script>

<style lang="scss" scoped>
.chat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  z-index: 10;
  
  .conversation-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .info-details {
      h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .status {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    
    .el-button {
      color: var(--text-secondary);
      
      &:hover {
        color: var(--primary-color);
        background: var(--primary-color-light);
      }
    }
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: #f8f9fa;
}

.load-more {
  text-align: center;
  margin-bottom: 16px;
}

.messages-list {
  .message-wrapper {
    margin-bottom: 16px;
    
    &.is-own {
      .message-item {
        flex-direction: row-reverse;
        
        .message-body {
          align-items: flex-end;
          
          .message-content {
            background: var(--primary-color);
            color: white;
            
            &.message-type-2,
            &.message-type-3 {
              background: white;
              color: var(--text-primary);
            }
          }
          
          .message-meta {
            flex-direction: row-reverse;
          }
        }
      }
    }
  }
}

.time-divider {
  text-align: center;
  margin: 20px 0;
  
  span {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.message-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 60%;
  min-width: 0;
}

.sender-name {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  padding: 0 12px;
}

.message-content {
  background: white;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  
  &.message-type-1 {
    // 文本消息
    .text-message {
      line-height: 1.4;
      white-space: pre-wrap;
    }
  }
  
  &.message-type-2 {
    // 图片消息
    padding: 4px;
    
    .message-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      cursor: pointer;
    }
  }
  
  &.message-type-3 {
    // 文件消息
    padding: 12px;
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .file-icon {
        font-size: 24px;
        color: var(--primary-color);
      }
      
      .file-details {
        flex: 1;
        min-width: 0;
        
        .file-name {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .file-size {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }
  }
}

.unsupported-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-style: italic;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 0 4px;
  
  .message-time {
    font-size: 11px;
    color: var(--text-placeholder);
  }
  
  .message-status {
    .el-icon {
      font-size: 12px;
      
      &.status-sending {
        color: var(--text-secondary);
        animation: rotate 1s linear infinite;
      }
      
      &.status-sent {
        color: var(--text-secondary);
      }
      
      &.status-delivered {
        color: var(--info-color);
      }
      
      &.status-read {
        color: var(--success-color);
      }
    }
  }
}

.typing-indicator {
  padding: 8px 0;
  margin-left: 44px;
  
  .typing-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .typing-dots {
      display: flex;
      gap: 2px;
      
      span {
        width: 4px;
        height: 4px;
        background: var(--text-secondary);
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    
    .typing-text {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

// 动画
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes typing {
  0%, 60%, 100% { 
    transform: scale(1);
    opacity: 0.5;
  }
  30% { 
    transform: scale(1.2);
    opacity: 1;
  }
}

// 滚动条样式
.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .messages-container {
    padding: 12px 16px;
  }
  
  .message-body {
    max-width: 80%;
  }
  
  .chat-header {
    padding: 12px 16px;
    
    .header-actions {
      .el-button {
        display: none;
        
        &:last-child {
          display: inline-flex;
        }
      }
    }
  }
}
</style>
