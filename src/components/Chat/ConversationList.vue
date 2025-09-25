<template>
  <div class="conversation-list">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton 
        animated
        :rows="5"
        :loading="true"
      >
        <template #template>
          <div v-for="i in 5" :key="i" class="conversation-skeleton">
            <el-skeleton-item variant="circle" style="width: 48px; height: 48px;" />
            <div class="skeleton-content">
              <el-skeleton-item variant="text" style="width: 60%; height: 16px;" />
              <el-skeleton-item variant="text" style="width: 80%; height: 14px; margin-top: 8px;" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 会话列表 -->
    <div v-else-if="conversations.length > 0" class="conversation-items">
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ 
          active: conversation.id === currentId,
          unread: conversation.unread > 0
        }"
        @click="handleSelect(conversation)"
        @contextmenu.prevent="handleContextMenu(conversation, $event)"
      >
        <!-- 头像 -->
        <div class="avatar-container">
          <el-avatar :size="48" :src="conversation.avatar">
            {{ getAvatarText(conversation) }}
          </el-avatar>
          
          <!-- 在线状态指示器（仅私聊显示） -->
          <div 
            v-if="conversation.chatType === 2 && conversation.online"
            class="online-indicator"
          />
          
          <!-- 未读消息数量 -->
          <el-badge 
            v-if="conversation.unread > 0"
            :value="conversation.unread > 99 ? '99+' : conversation.unread"
            class="unread-badge"
          />
        </div>

        <!-- 会话信息 -->
        <div class="conversation-info">
          <div class="conversation-header">
            <h4 class="conversation-title">
              {{ conversation.title || '未知会话' }}
              <!-- 群组成员数 -->
              <span v-if="conversation.chatType === 1 && conversation.memberCount" class="member-count">
                ({{ conversation.memberCount }})
              </span>
            </h4>
            <span class="conversation-time">
              {{ formatTime(conversation.lastMessageTime) }}
            </span>
          </div>
          
          <div class="conversation-preview">
            <div class="last-message">
              {{ getLastMessageText(conversation.lastMessage) }}
            </div>
            
            <!-- 消息状态指示器 -->
            <div v-if="conversation.lastMessage?.isOwn" class="message-status">
              <el-icon 
                v-if="conversation.lastMessage.status === 'sending'"
                class="status-sending"
              >
                <Loading />
              </el-icon>
              <el-icon 
                v-else-if="conversation.lastMessage.status === 'sent'"
                class="status-sent"
              >
                <Check />
              </el-icon>
              <el-icon 
                v-else-if="conversation.lastMessage.status === 'delivered'"
                class="status-delivered"
              >
                <Check />
              </el-icon>
              <el-icon 
                v-else-if="conversation.lastMessage.status === 'read'"
                class="status-read"
              >
                <Check />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty 
        description="暂无会话"
        :image-size="120"
      >
        <template #image>
          <el-icon :size="60" class="empty-icon">
            <ChatDotSquare />
          </el-icon>
        </template>
        <el-button type="primary" @click="$emit('add-conversation')">
          开始聊天
        </el-button>
      </el-empty>
    </div>

    <!-- 右键菜单 -->
    <el-popover
      ref="contextMenuRef"
      :visible="contextMenuVisible"
      placement="bottom-start"
      trigger="manual"
      :width="160"
      popper-class="conversation-context-menu"
    >
      <div class="context-menu">
        <div class="menu-item" @click="handleMarkAsRead">
          <el-icon><CircleCheck /></el-icon>
          标记为已读
        </div>
        <div class="menu-item" @click="handlePin">
          <el-icon><Top /></el-icon>
          {{ selectedConversation?.pinned ? '取消置顶' : '置顶会话' }}
        </div>
        <div class="menu-item danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          删除会话
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import {
  ChatDotSquare,
  Loading,
  Check,
  CircleCheck,
  Top,
  Delete
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  currentId: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['select', 'delete', 'add-conversation'])

// 响应式数据
const contextMenuRef = ref()
const contextMenuVisible = ref(false)
const selectedConversation = ref(null)

// 方法
const handleSelect = (conversation) => {
  emit('select', conversation)
}

const handleContextMenu = (conversation, event) => {
  selectedConversation.value = conversation
  contextMenuVisible.value = true
  
  // 设置右键菜单位置
  const menu = contextMenuRef.value
  if (menu) {
    menu.$el.style.left = `${event.clientX}px`
    menu.$el.style.top = `${event.clientY}px`
  }
  
  // 点击其他地方关闭菜单
  const closeMenu = () => {
    contextMenuVisible.value = false
    document.removeEventListener('click', closeMenu)
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 100)
}

const handleMarkAsRead = () => {
  if (selectedConversation.value) {
    // TODO: 调用标记已读API
    console.log('标记已读:', selectedConversation.value.id)
  }
  contextMenuVisible.value = false
}

const handlePin = () => {
  if (selectedConversation.value) {
    // TODO: 调用置顶/取消置顶API
    console.log('置顶会话:', selectedConversation.value.id)
  }
  contextMenuVisible.value = false
}

const handleDelete = () => {
  if (selectedConversation.value) {
    emit('delete', selectedConversation.value.id)
  }
  contextMenuVisible.value = false
}

const getAvatarText = (conversation) => {
  return conversation.title?.charAt(0) || '?'
}

const getLastMessageText = (lastMessage) => {
  if (!lastMessage) return '暂无消息'
  
  switch (lastMessage.msgType) {
    case 1: // 文本消息
      return lastMessage.contentParsed || lastMessage.msgContent || ''
    case 2: // 图片消息
      return '[图片]'
    case 3: // 文件消息
      return '[文件]'
    case 4: // 语音消息
      return '[语音]'
    case 5: // 视频消息
      return '[视频]'
    case 6: // 位置消息
      return '[位置]'
    default:
      return '[消息]'
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = dayjs()
  const messageTime = dayjs(timestamp)
  
  // 如果是今天
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm')
  }
  
  // 如果是昨天
  if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  }
  
  // 如果是本周
  if (messageTime.isSame(now, 'week')) {
    return messageTime.format('dddd')
  }
  
  // 如果是今年
  if (messageTime.isSame(now, 'year')) {
    return messageTime.format('MM/DD')
  }
  
  // 其他情况显示年月日
  return messageTime.format('YYYY/MM/DD')
}
</script>

<style lang="scss" scoped>
.conversation-list {
  height: 100%;
  overflow-y: auto;
}

.loading-container {
  padding: 16px;
}

.conversation-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  
  .skeleton-content {
    flex: 1;
  }
}

.conversation-items {
  .conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-lighter);
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      background: var(--background-light);
    }
    
    &.active {
      background: var(--primary-color-light);
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary-color);
      }
    }
    
    &.unread {
      background: rgba(64, 158, 255, 0.05);
      
      .conversation-title {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .last-message {
        font-weight: 500;
        color: var(--text-primary);
      }
    }
  }
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
  
  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: var(--success-color);
    border: 2px solid white;
    border-radius: 50%;
  }
  
  .unread-badge {
    position: absolute;
    top: -6px;
    right: -6px;
  }
}

.conversation-info {
  flex: 1;
  min-width: 0;
  
  .conversation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    
    .conversation-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      
      .member-count {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: normal;
      }
    }
    
    .conversation-time {
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
      margin-left: 8px;
    }
  }
  
  .conversation-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .last-message {
      flex: 1;
      font-size: 13px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    
    .message-status {
      flex-shrink: 0;
      
      .el-icon {
        font-size: 14px;
        
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
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .empty-icon {
    color: var(--text-placeholder);
  }
}

// 右键菜单样式
:deep(.conversation-context-menu) {
  padding: 8px 0;
  
  .context-menu {
    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-primary);
      transition: background-color 0.2s ease;
      
      &:hover {
        background: var(--background-light);
      }
      
      &.danger {
        color: var(--danger-color);
        
        &:hover {
          background: rgba(245, 108, 108, 0.1);
        }
      }
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 滚动条样式
.conversation-list::-webkit-scrollbar {
  width: 4px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>
