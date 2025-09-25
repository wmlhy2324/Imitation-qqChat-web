<template>
  <div class="contact-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h3>{{ conversation ? '会话信息' : '联系人' }}</h3>
      <el-button :icon="Close" circle size="small" @click="$emit('close')" />
    </div>

    <!-- 会话信息（当有选中会话时显示） -->
    <div v-if="conversation" class="conversation-info">
      <!-- 会话头像和基本信息 -->
      <div class="conversation-profile">
        <el-avatar :size="80" :src="conversation.avatar">
          {{ conversation.title?.charAt(0) }}
        </el-avatar>
        <h2>{{ conversation.title }}</h2>
        <p class="conversation-type">
          <el-icon>
            <component :is="conversation.chatType === 2 ? 'User' : 'UserFilled'" />
          </el-icon>
          {{ conversation.chatType === 2 ? '私聊' : '群聊' }}
          <span v-if="conversation.chatType === 1">
            ({{ conversation.memberCount || 0 }} 人)
          </span>
        </p>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <div class="action-item" @click="handleVoiceCall">
          <el-icon><Phone /></el-icon>
          <span>语音通话</span>
        </div>
        <div class="action-item" @click="handleVideoCall">
          <el-icon><VideoCamera /></el-icon>
          <span>视频通话</span>
        </div>
        <div class="action-item" @click="handleSearchMessages">
          <el-icon><Search /></el-icon>
          <span>搜索消息</span>
        </div>
        <div class="action-item" @click="handleViewFiles">
          <el-icon><Folder /></el-icon>
          <span>文件管理</span>
        </div>
      </div>

      <!-- 群聊成员列表 -->
      <div v-if="conversation.chatType === 1" class="group-members">
        <div class="section-header">
          <h4>群成员 ({{ groupMembers.length }})</h4>
          <el-button size="small" text @click="handleInviteMembers">
            <el-icon><Plus /></el-icon>
            邀请
          </el-button>
        </div>
        
        <div class="members-list">
          <div 
            v-for="member in groupMembers"
            :key="member.id"
            class="member-item"
            @click="handleMemberClick(member)"
          >
            <el-avatar :size="36" :src="member.avatar">
              {{ member.nickname?.charAt(0) }}
            </el-avatar>
            <div class="member-info">
              <div class="member-name">{{ member.nickname }}</div>
              <div class="member-role">{{ member.role || '成员' }}</div>
            </div>
            <div v-if="member.online" class="online-indicator" />
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="settings-section">
        <div class="setting-item" @click="handleToggleMute">
          <el-icon><BellFilled /></el-icon>
          <span>消息免打扰</span>
          <el-switch v-model="conversationSettings.muted" />
        </div>
        
        <div class="setting-item" @click="handleTogglePin">
          <el-icon><Top /></el-icon>
          <span>置顶会话</span>
          <el-switch v-model="conversationSettings.pinned" />
        </div>
        
        <div class="setting-item danger" @click="handleDeleteConversation">
          <el-icon><Delete /></el-icon>
          <span>删除会话</span>
        </div>
      </div>
    </div>

    <!-- 联系人列表（当没有选中会话时显示） -->
    <div v-else class="contacts-section">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索联系人..."
          :prefix-icon="Search"
          clearable
        />
      </div>

      <!-- 快捷操作 -->
      <div class="contact-actions">
        <div class="action-button" @click="$emit('add-friend')">
          <el-icon><UserFilled /></el-icon>
          <span>添加好友</span>
        </div>
        <div class="action-button" @click="$emit('create-group')">
          <el-icon><UserFilled /></el-icon>
          <span>创建群组</span>
        </div>
      </div>

      <!-- 联系人标签 -->
      <el-tabs v-model="activeTab" class="contact-tabs">
        <el-tab-pane label="好友" name="friends">
          <div class="contacts-list">
            <div 
              v-for="friend in filteredFriends"
              :key="friend.id"
              class="contact-item"
              @click="handleContactClick(friend)"
            >
              <el-avatar :size="40" :src="friend.avatar">
                {{ friend.nickname?.charAt(0) }}
              </el-avatar>
              <div class="contact-info">
                <div class="contact-name">{{ friend.nickname }}</div>
                <div class="contact-status">
                  {{ friend.online ? '在线' : '离线' }}
                </div>
              </div>
              <div v-if="friend.online" class="online-indicator" />
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="群组" name="groups">
          <div class="contacts-list">
            <div 
              v-for="group in filteredGroups"
              :key="group.id"
              class="contact-item"
              @click="handleContactClick(group)"
            >
              <el-avatar :size="40" :src="group.avatar">
                {{ group.name?.charAt(0) }}
              </el-avatar>
              <div class="contact-info">
                <div class="contact-name">{{ group.name }}</div>
                <div class="contact-status">
                  {{ group.memberCount || 0 }} 名成员
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close,
  User,
  UserFilled,
  Phone,
  VideoCamera,
  Search,
  Folder,
  Plus,
  BellFilled,
  Top,
  Delete
} from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/modules/chat'
import { useUserStore } from '@/stores/modules/user'
import { socialApi } from '@/api'

// Props
const props = defineProps({
  conversation: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'add-friend', 'create-group'])

// Store
const chatStore = useChatStore()
const userStore = useUserStore()

// 响应式数据
const searchKeyword = ref('')
const activeTab = ref('friends')
const groupMembers = ref([])
const conversationSettings = ref({
  muted: false,
  pinned: false
})

// 计算属性
const filteredFriends = computed(() => {
  if (!searchKeyword.value) {
    return chatStore.friends
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return chatStore.friends.filter(friend => 
    friend.nickname?.toLowerCase().includes(keyword) ||
    friend.phone?.includes(keyword)
  )
})

const filteredGroups = computed(() => {
  if (!searchKeyword.value) {
    return chatStore.groups
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return chatStore.groups.filter(group => 
    group.name?.toLowerCase().includes(keyword)
  )
})

// 方法
const handleContactClick = async (contact) => {
  try {
    // 创建或打开会话
    const chatType = contact.memberCount !== undefined ? 1 : 2 // 群组或私聊
    const conversationData = {
      sendId: userStore.userId || userStore.userInfo?.id, // 当前用户ID
      recvId: contact.id,
      ChatType: chatType
    }
    await chatStore.createConversation(conversationData)
    
    // 关闭联系人面板
    emit('close')
  } catch (error) {
    console.error('打开会话失败:', error)
    ElMessage.error('打开会话失败')
  }
}

const handleMemberClick = (member) => {
  // TODO: 显示成员详情或发起私聊
  console.log('点击成员:', member)
}

const handleVoiceCall = () => {
  ElMessage.info('语音通话功能开发中')
}

const handleVideoCall = () => {
  ElMessage.info('视频通话功能开发中')
}

const handleSearchMessages = () => {
  ElMessage.info('消息搜索功能开发中')
}

const handleViewFiles = () => {
  ElMessage.info('文件管理功能开发中')
}

const handleInviteMembers = () => {
  ElMessage.info('邀请成员功能开发中')
}

const handleToggleMute = () => {
  // TODO: 调用API设置免打扰
  console.log('切换免打扰:', conversationSettings.value.muted)
}

const handleTogglePin = () => {
  // TODO: 调用API设置置顶
  console.log('切换置顶:', conversationSettings.value.pinned)
}

const handleDeleteConversation = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个会话吗？删除后将无法恢复聊天记录。',
      '删除会话',
      {
        type: 'warning'
      }
    )
    
    // TODO: 调用删除会话API
    ElMessage.success('会话已删除')
    emit('close')
  } catch (error) {
    // 用户取消删除
  }
}

const loadGroupMembers = async () => {
  if (!props.conversation || props.conversation.chatType !== 2) return
  
  try {
    const response = await socialApi.getGroupMembers(props.conversation.targetId)
    groupMembers.value = response.data || []
  } catch (error) {
    console.error('获取群成员失败:', error)
  }
}

// 监听会话变化
watch(
  () => props.conversation,
  (newConversation) => {
    if (newConversation && newConversation.chatType === 1) {
      loadGroupMembers()
    }
    
    // 重置设置
    conversationSettings.value = {
      muted: newConversation?.muted || false,
      pinned: newConversation?.pinned || false
    }
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  if (props.conversation && props.conversation.chatType === 1) {
    loadGroupMembers()
  }
})
</script>

<style lang="scss" scoped>
.contact-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .el-button {
    color: var(--text-secondary);
    
    &:hover {
      color: var(--text-primary);
    }
  }
}

.conversation-info {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.conversation-profile {
  text-align: center;
  margin-bottom: 24px;
  
  .el-avatar {
    margin-bottom: 12px;
  }
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .conversation-type {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
    
    .el-icon {
      font-size: 16px;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: var(--background-light);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--primary-color-light);
      color: var(--primary-color);
    }
    
    .el-icon {
      font-size: 20px;
    }
    
    span {
      font-size: 12px;
      text-align: center;
    }
  }
}

.group-members {
  margin-bottom: 24px;
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    
    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .el-button {
      color: var(--primary-color);
      
      &:hover {
        background: var(--primary-color-light);
      }
    }
  }
  
  .members-list {
    max-height: 200px;
    overflow-y: auto;
    
    .member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      cursor: pointer;
      position: relative;
      
      &:hover {
        background: var(--background-light);
        border-radius: 6px;
        margin: 0 -8px;
        padding: 8px;
      }
      
      .member-info {
        flex: 1;
        min-width: 0;
        
        .member-name {
          font-size: 14px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .member-role {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      
      .online-indicator {
        width: 8px;
        height: 8px;
        background: var(--success-color);
        border-radius: 50%;
        flex-shrink: 0;
      }
    }
  }
}

.settings-section {
  .setting-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    cursor: pointer;
    border-bottom: 1px solid var(--border-lighter);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover:not(.danger) {
      color: var(--primary-color);
    }
    
    &.danger {
      color: var(--danger-color);
      
      &:hover {
        background: rgba(245, 108, 108, 0.1);
        border-radius: 6px;
        margin: 0 -8px;
        padding: 12px 8px;
      }
    }
    
    .el-icon {
      font-size: 16px;
    }
    
    span {
      flex: 1;
      font-size: 14px;
    }
  }
}

.contacts-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-lighter);
  
  :deep(.el-input__wrapper) {
    border-radius: 20px;
    background: var(--background-light);
    border: none;
    box-shadow: none;
    
    &:hover,
    &.is-focus {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.contact-actions {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--border-lighter);
  
  .action-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: var(--primary-color-light);
    color: var(--primary-color);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--primary-color);
      color: white;
    }
    
    .el-icon {
      font-size: 16px;
    }
  }
}

.contact-tabs {
  flex: 1;
  overflow: hidden;
  
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-lighter);
  }
  
  :deep(.el-tabs__content) {
    height: 100%;
    padding: 0;
  }
  
  :deep(.el-tab-pane) {
    height: 100%;
    overflow-y: auto;
  }
}

.contacts-list {
  padding: 12px 20px;
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
    position: relative;
    
    &:hover {
      background: var(--background-light);
      border-radius: 6px;
      margin: 0 -8px;
      padding: 8px;
    }
    
    .contact-info {
      flex: 1;
      min-width: 0;
      
      .contact-name {
        font-size: 14px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }
      
      .contact-status {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
    
    .online-indicator {
      width: 8px;
      height: 8px;
      background: var(--success-color);
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
}

// 滚动条样式
.conversation-info,
.members-list,
.contacts-list {
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    
    .action-item {
      padding: 12px 8px;
      
      .el-icon {
        font-size: 18px;
      }
      
      span {
        font-size: 11px;
      }
    }
  }
  
  .contact-actions {
    flex-direction: column;
    gap: 8px;
    
    .action-button {
      justify-content: flex-start;
      padding: 12px;
    }
  }
}
</style>
