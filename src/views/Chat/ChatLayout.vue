<template>
  <div class="chat-layout">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <!-- 用户信息头部 -->
      <div class="user-header">
        <div class="user-info">
          <el-avatar :size="40" :src="userStore.avatar">
            {{ userStore.nickname?.charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <h4>{{ userStore.nickname || '用户' }}</h4>
            <span class="status" :class="{ online: chatStore.isConnected }">
              {{ chatStore.isConnected ? '在线' : '离线' }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip content="添加好友">
            <el-button 
              :icon="Plus" 
              size="small" 
              circle 
              @click="showAddFriendDialog"
            />
          </el-tooltip>
          <el-tooltip content="创建群组">
            <el-button 
              :icon="UserFilled" 
              size="small" 
              circle 
              @click="showCreateGroupDialog"
            />
          </el-tooltip>
          <el-dropdown trigger="click" @command="handleMenuCommand">
            <el-button :icon="More" size="small" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索好友、群组..."
          :prefix-icon="Search"
          clearable
          @focus="showSearchDialog"
          @click="showSearchDialog"
          readonly
        />
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list">
        <ConversationList 
          :conversations="filteredConversations"
          :current-id="chatStore.currentConversationId"
          :loading="chatStore.isLoading"
          @select="handleSelectConversation"
          @delete="handleDeleteConversation"
        />
      </div>
    </div>

    <!-- 中间聊天区域 -->
    <div class="chat-main">
      <ChatContent 
        v-if="chatStore.currentConversation"
        :conversation="chatStore.currentConversation"
        :messages="chatStore.currentMessages"
        :loading="messagesLoading"
        @send-message="handleSendMessage"
        @load-more="handleLoadMoreMessages"
      />
      <ChatWelcome v-else />
    </div>

    <!-- 右侧联系人面板 -->
    <transition name="slide-left">
      <div v-if="showContactPanel" class="contact-panel">
        <ContactPanel 
          :conversation="chatStore.currentConversation"
          @close="showContactPanel = false"
          @add-friend="showAddFriendDialog"
          @create-group="showCreateGroupDialog"
        />
      </div>
    </transition>

    <!-- 添加好友对话框 -->
    <AddFriendDialog 
      v-model="addFriendVisible"
      @success="handleAddFriendSuccess"
    />

    <!-- 创建群组对话框 -->
    <CreateGroupDialog 
      v-model="createGroupVisible"
      @success="handleCreateGroupSuccess"
    />
    
    <!-- 搜索对话框 -->
    <SearchDialog 
      v-model="searchVisible"
      @select-friend="handleSelectSearchResult"
      @select-group="handleSelectSearchResult"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  UserFilled, 
  More, 
  Search 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { useChatStore } from '@/stores/modules/chat'
import wsManager from '@/utils/websocket'

// 组件
import ConversationList from '@/components/Chat/ConversationList.vue'
import ChatContent from '@/components/Chat/ChatContent.vue'
import ChatWelcome from '@/components/Chat/ChatWelcome.vue'
import ContactPanel from '@/components/Chat/ContactPanel.vue'
import AddFriendDialog from '@/components/Social/AddFriendDialog.vue'
import CreateGroupDialog from '@/components/Social/CreateGroupDialog.vue'
import SearchDialog from '@/components/Chat/SearchDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

// 响应式数据
const searchKeyword = ref('')
const showContactPanel = ref(false)
const addFriendVisible = ref(false)
const createGroupVisible = ref(false)
const searchVisible = ref(false)
const messagesLoading = ref(false)

// 计算属性
const filteredConversations = computed(() => {
  if (!searchKeyword.value) {
    return chatStore.conversationList
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return chatStore.conversationList.filter(conv => 
    conv.title?.toLowerCase().includes(keyword)
  )
})

// 方法
const handleSearch = (value) => {
  // 搜索逻辑已通过计算属性实现
  console.log('搜索:', value)
}

// 显示搜索对话框
const showSearchDialog = () => {
  searchVisible.value = true
}

const handleSelectConversation = async (conversation) => {
  try {
    messagesLoading.value = true
    chatStore.setCurrentConversation(conversation.id)
    
    // 加载聊天记录
    await chatStore.fetchMessages(conversation.id)
    
    // 加入WebSocket房间
    wsManager.joinRoom(conversation.id)
  } catch (error) {
    console.error('选择会话失败:', error)
    ElMessage.error('加载会话失败')
  } finally {
    messagesLoading.value = false
  }
}

const handleDeleteConversation = async (conversationId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会话吗？', '删除会话', {
      type: 'warning'
    })
    
    // TODO: 调用删除会话API
    ElMessage.success('会话已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const handleSendMessage = async (messageData) => {
  try {
    // 先在界面上显示消息（乐观更新）
    const tempMessage = {
      id: `temp_${Date.now()}`,
      ...messageData,
      sendTime: Date.now(),
      status: 'sending',
      isOwn: true,
      senderInfo: {
        id: userStore.userId,
        nickname: userStore.nickname,
        avatar: userStore.avatar
      }
    }
    
    chatStore.addMessage(messageData.conversationId, tempMessage)
    
    // 通过WebSocket发送消息
    const success = wsManager.sendMessage(messageData)
    
    if (!success) {
      // WebSocket发送失败，尝试HTTP API
      await chatStore.sendMessage(messageData)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const handleLoadMoreMessages = async (conversationId, beforeTime) => {
  try {
    messagesLoading.value = true
    await chatStore.fetchMessages(conversationId, {
      endSendTime: beforeTime,
      count: 20,
      prepend: true
    })
  } catch (error) {
    console.error('加载历史消息失败:', error)
    ElMessage.error('加载历史消息失败')
  } finally {
    messagesLoading.value = false
  }
}

const showAddFriendDialog = () => {
  addFriendVisible.value = true
}

const showCreateGroupDialog = () => {
  createGroupVisible.value = true
}

const handleAddFriendSuccess = () => {
  // 刷新好友列表和会话列表
  chatStore.fetchConversations()
}

const handleCreateGroupSuccess = () => {
  // 刷新群组列表和会话列表
  chatStore.fetchConversations()
}

// 处理搜索结果选择
const handleSelectSearchResult = async (item, conversation) => {
  if (conversation) {
    // 直接选择该会话
    await handleSelectConversation(conversation)
  } else {
    // 刷新会话列表，等待新会话出现
    await chatStore.fetchConversations()
  }
}

// 处理路由导航（从好友页面跳转过来）
const handleRouteNavigation = async (queryParams) => {
  try {
    const { targetId, targetName, targetAvatar, chatType } = queryParams
    
    if (!targetId) return
    
    // 查找是否已存在对应的会话
    let targetConversation = chatStore.conversationList.find(conv => 
      conv.chatType == chatType && conv.targetId === targetId
    )
    
    if (!targetConversation) {
      // 如果没找到会话，等待一段时间后再次加载（因为可能刚创建）
      await new Promise(resolve => setTimeout(resolve, 500))
      await chatStore.fetchConversations()
      
      // 再次查找
      targetConversation = chatStore.conversationList.find(conv => 
        conv.chatType == chatType && conv.targetId === targetId
      )
    }
    
    if (targetConversation) {
      // 选择该会话
      await handleSelectConversation(targetConversation)
      ElMessage.success(`已打开与 ${targetName} 的聊天`)
    } else {
      console.warn('未找到对应会话，可能创建失败')
      ElMessage.warning('未找到聊天记录，请稍后重试')
    }
    
    // 清除路由参数，避免重复处理
    router.replace({ name: 'ChatLayout' })
  } catch (error) {
    console.error('处理路由导航失败:', error)
  }
}

const handleMenuCommand = async (command) => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人资料编辑
      ElMessage.info('个人资料编辑功能开发中')
      break
    case 'settings':
      // TODO: 打开设置页面
      ElMessage.info('设置功能开发中')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
          type: 'warning'
        })
        
        // 断开WebSocket连接
        wsManager.disconnect()
        
        // 清除聊天数据
        chatStore.clearAll()
        
        // 用户登出
        userStore.logout()
        
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        // 用户取消退出
      }
      break
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 初始化用户状态
    await userStore.initUserState()
    
    // 连接WebSocket
    wsManager.connect(userStore, chatStore)
    
    // 加载会话列表
    await chatStore.fetchConversations()
    
    // 检查路由参数，如果有targetId说明是从好友页面跳转过来的
    const route = router.currentRoute.value
    if (route.query.targetId) {
      await handleRouteNavigation(route.query)
    }
  } catch (error) {
    console.error('初始化聊天界面失败:', error)
    ElMessage.error('初始化失败，请刷新页面重试')
  }
})

onUnmounted(() => {
  // 断开WebSocket连接
  wsManager.disconnect()
})
</script>

<style lang="scss" scoped>
.chat-layout {
  height: 100vh;
  display: flex;
  background: #f8f9fa;
  overflow: hidden;
}

.chat-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid var(--border-lighter);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.user-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    
    .user-details {
      flex: 1;
      min-width: 0;
      
      h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .status {
        font-size: 12px;
        color: var(--text-secondary);
        
        &.online {
          color: var(--success-color);
        }
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

.search-box {
  padding: 16px;
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

.conversation-list {
  flex: 1;
  overflow-y: auto;
  
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

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
}

.contact-panel {
  width: 280px;
  background: white;
  border-left: 1px solid var(--border-lighter);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
}

// 过渡动画
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

// 响应式设计
@media (max-width: 1024px) {
  .chat-sidebar {
    width: 280px;
  }
  
  .contact-panel {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-lighter);
  }
  
  .chat-main {
    height: calc(100vh - 200px);
  }
  
  .contact-panel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 100;
  }
}
</style>