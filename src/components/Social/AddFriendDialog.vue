<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加好友"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="add-friend-dialog">
      <!-- 搜索用户 -->
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="输入手机号或用户名搜索"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button 
              type="primary"
              :loading="searching"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span>搜索结果 ({{ searchResults.length }})</span>
        </div>
        
        <div class="results-list">
          <div 
            v-for="user in searchResults"
            :key="user.id"
            class="user-item"
          >
            <el-avatar :size="40" :src="user.avatar">
              {{ user.nickname?.charAt(0) }}
            </el-avatar>
            
            <div class="user-info">
              <div class="user-name">{{ user.nickname }}</div>
              <div class="user-phone">{{ user.phone }}</div>
            </div>
            
            <el-button
              v-if="!isAlreadyFriend(user.id)"
              type="primary"
              size="small"
              :loading="sendingRequest === user.id"
              @click="handleShowVerificationDialog(user)"
            >
              {{ sentRequests.has(user.id) ? '已发送' : '添加' }}
            </el-button>
            
            <el-tag v-else type="success" size="small">
              已是好友
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="hasSearched && !searching" class="empty-state">
        <el-empty 
          description="未找到相关用户"
          :image-size="100"
        >
          <template #image>
            <el-icon :size="60">
              <UserFilled />
            </el-icon>
          </template>
        </el-empty>
      </div>

      <!-- 默认提示 -->
      <div v-else class="default-hint">
        <div class="hint-content">
          <el-icon :size="60"><Search /></el-icon>
          <p>输入手机号或用户名搜索用户</p>
          <div class="hint-tips">
            <p>小贴士：</p>
            <ul>
              <li>可以通过手机号精确搜索</li>
              <li>可以通过用户名模糊搜索</li>
              <li>确保输入的信息准确无误</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 好友请求历史 -->
      <div class="friend-requests">
        <el-divider>
          <span>好友请求</span>
        </el-divider>
        
        <div v-if="friendRequests.length > 0" class="requests-list">
          <div 
            v-for="request in friendRequests"
            :key="request.id"
            class="request-item"
          >
            <el-avatar :size="36" :src="request.req_avatar">
              {{ (request.req_nickname || request.nickname)?.charAt(0) }}
            </el-avatar>
            
            <div class="request-info">
              <div class="request-name">{{ request.req_nickname || request.nickname }}</div>
              <div class="request-message">{{ request.req_msg || '请求添加您为好友' }}</div>
              <div class="request-time">{{ formatTime(request.req_time) }}</div>
            </div>
            
            <div class="request-actions">
              <!-- 如果是自己发出的请求 -->
              <div v-if="isOwnRequest(request)">
                <el-tag 
                  v-if="request.handle_result === 1"
                  type="warning"
                  size="small"
                >
                  等待验证
                </el-tag>
                <el-tag 
                  v-else-if="request.handle_result === 2"
                  type="success"
                  size="small"
                >
                  已同意
                </el-tag>
                <el-tag 
                  v-else-if="request.handle_result === 3"
                  type="danger"
                  size="small"
                >
                  已拒绝
                </el-tag>
              </div>
              
              <!-- 如果是别人发给自己的请求 -->
              <div v-else>
                <el-button
                  v-if="request.handle_result === 1"
                  type="primary"
                  size="small"
                  :loading="handlingRequest === request.id"
                  @click="handleAcceptRequest(request)"
                >
                  通过
                </el-button>
                <el-button
                  v-if="request.handle_result === 1"
                  size="small"
                  :loading="handlingRequest === request.id"
                  @click="handleRejectRequest(request)"
                >
                  拒绝
                </el-button>
                <el-tag 
                  v-if="request.handle_result === 2"
                  type="success"
                  size="small"
                >
                  已同意
                </el-tag>
                <el-tag 
                  v-if="request.handle_result === 3"
                  type="danger"
                  size="small"
                >
                  已拒绝
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="no-requests">
          <p>暂无好友请求</p>
        </div>
      </div>
    </div>

    <!-- 验证信息对话框 -->
    <el-dialog
      v-model="showVerificationDialog"
      title="添加好友"
      width="400px"
      :close-on-click-modal="false"
      :show-close="true"
      append-to-body
    >
      <div class="verification-dialog">
        <div class="target-user-info">
          <el-avatar :size="50" :src="selectedUser?.avatar">
            {{ selectedUser?.nickname?.charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <div class="user-name">{{ selectedUser?.nickname }}</div>
            <div class="user-phone">{{ selectedUser?.phone }}</div>
          </div>
        </div>
        
        <el-divider />
        
        <el-form :model="verificationForm" label-width="80px">
          <el-form-item label="验证信息">
            <el-input
              v-model="verificationForm.message"
              type="textarea"
              :rows="4"
              placeholder="请输入验证信息，向对方介绍一下自己吧"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          
          <div class="quick-messages">
            <div class="quick-label">快捷消息：</div>
            <div class="quick-buttons">
              <el-button
                v-for="msg in quickMessages"
                :key="msg"
                size="small"
                @click="verificationForm.message = msg"
              >
                {{ msg }}
              </el-button>
            </div>
          </div>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showVerificationDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            :loading="sendingRequest === selectedUser?.id"
            @click="handleSendFriendRequest"
          >
            发送申请
          </el-button>
        </div>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  Search,
  UserFilled
} from '@element-plus/icons-vue'
import { socialApi } from '@/api'
import { useSocialStore } from '@/stores'
import { useUserStore } from '@/stores'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'success'])

// Store
const socialStore = useSocialStore()
const userStore = useUserStore()

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref([])
const friendRequests = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const sendingRequest = ref('')
const handlingRequest = ref('')
const sentRequests = ref(new Set())

// 验证信息对话框相关
const showVerificationDialog = ref(false)
const selectedUser = ref(null)
const verificationForm = ref({
  message: ''
})

// 快捷消息
const quickMessages = [
  '我是朋友介绍过来的',
  '希望能成为朋友',
  '通过搜索找到您的',
  '我们可以互相交流学习'
]

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  try {
    searching.value = true
    const response = await socialApi.searchUsers(searchKeyword.value.trim())
    searchResults.value = response.data?.list || []
    hasSearched.value = true
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
  } finally {
    searching.value = false
  }
}

// 显示验证信息对话框
const handleShowVerificationDialog = (user) => {
  selectedUser.value = user
  verificationForm.value.message = `我是 ${userStore.nickname || '用户'}，希望能添加您为好友`
  showVerificationDialog.value = true
}

// 发送好友请求
const handleSendFriendRequest = async () => {
  if (!selectedUser.value) return
  
  // 检查登录状态
  if (!userStore.isAuthenticated) {
    ElMessage.error('请先登录')
    return
  }
  
  if (!verificationForm.value.message.trim()) {
    ElMessage.warning('请输入验证信息')
    return
  }
  
  console.log('准备发送好友请求:', {
    targetUserId: selectedUser.value.id,
    message: verificationForm.value.message.trim(),
    currentUser: userStore.userInfo,
    token: userStore.token ? '存在' : '不存在'
  })
  
  try {
    sendingRequest.value = selectedUser.value.id
    
    const result = await socialStore.sendFriendRequest(
      selectedUser.value.id, 
      verificationForm.value.message.trim()
    )
    
    console.log('好友请求发送结果:', result)
    
    if (result.success) {
      sentRequests.value.add(selectedUser.value.id)
      ElMessage.success('好友请求已发送')
      showVerificationDialog.value = false
      // 重置表单
      verificationForm.value.message = ''
      selectedUser.value = null
    } else {
      console.error('好友请求发送失败:', result)
      ElMessage.error(result.message || '发送好友请求失败')
    }
    
  } catch (error) {
    console.error('发送好友请求异常:', error)
    ElMessage.error('发送好友请求失败')
  } finally {
    sendingRequest.value = ''
  }
}

const handleAcceptRequest = async (request) => {
  try {
    handlingRequest.value = request.id
    
    const result = await socialStore.handleFriendRequest(request.id, 'accept', '已同意添加为好友')
    
    if (result.success) {
      request.handle_result = 2  // 2表示已同意
      ElMessage.success('已接受好友请求')
      emit('success')
    } else {
      ElMessage.error(result.message || '接受好友请求失败')
    }
    
  } catch (error) {
    console.error('接受好友请求失败:', error)
    ElMessage.error('接受好友请求失败')
  } finally {
    handlingRequest.value = ''
  }
}

const handleRejectRequest = async (request) => {
  try {
    handlingRequest.value = request.id
    
    const result = await socialStore.handleFriendRequest(request.id, 'reject', '抱歉，暂时不接受添加好友')
    
    if (result.success) {
      request.handle_result = 3  // 3表示已拒绝
      ElMessage.success('已拒绝好友请求')
    } else {
      ElMessage.error(result.message || '拒绝好友请求失败')
    }
    
  } catch (error) {
    console.error('拒绝好友请求失败:', error)
    ElMessage.error('拒绝好友请求失败')
  } finally {
    handlingRequest.value = ''
  }
}

const isAlreadyFriend = (userId) => {
  return socialStore.friends.some(friend => friend.friend_uid === userId)
}

// 判断是否是自己发出的请求
const isOwnRequest = (request) => {
  // 如果当前用户ID等于记录的user_id，说明是自己发出的请求
  // user_id是请求的发起方，req_uid是请求的接收方
  return userStore.userId === request.user_id
}

const loadFriendRequests = async () => {
  try {
    await socialStore.loadFriendRequests()
    // 使用store中的数据
    friendRequests.value = socialStore.friendRequests
  } catch (error) {
    console.error('获取好友请求失败:', error)
  }
}

const handleClose = () => {
  dialogVisible.value = false
  
  // 重置数据
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  sentRequests.value.clear()
  
  // 关闭验证对话框
  showVerificationDialog.value = false
  selectedUser.value = null
  verificationForm.value.message = ''
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 监听对话框显示
watch(dialogVisible, (visible) => {
  if (visible) {
    loadFriendRequests()
  }
})
</script>

<style lang="scss" scoped>
.add-friend-dialog {
  .search-section {
    margin-bottom: 20px;
  }
  
  .search-results {
    margin-bottom: 20px;
    
    .results-header {
      padding: 8px 0;
      font-size: 14px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-lighter);
      margin-bottom: 12px;
    }
    
    .results-list {
      .user-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-lighter);
        
        &:last-child {
          border-bottom: none;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
          
          .user-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          
          .user-phone {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
    }
  }
  
  .empty-state {
    padding: 40px 0;
    text-align: center;
    
    .el-icon {
      color: var(--text-placeholder);
      margin-bottom: 16px;
    }
  }
  
  .default-hint {
    padding: 40px 20px;
    text-align: center;
    
    .hint-content {
      .el-icon {
        color: var(--text-placeholder);
        margin-bottom: 16px;
      }
      
      p {
        font-size: 16px;
        color: var(--text-secondary);
        margin-bottom: 24px;
      }
      
      .hint-tips {
        text-align: left;
        background: var(--background-light);
        padding: 16px;
        border-radius: 8px;
        
        p {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        ul {
          margin: 0;
          padding-left: 16px;
          
          li {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
  
  .friend-requests {
    .requests-list {
      max-height: 300px;
      overflow-y: auto;
      
      .request-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-lighter);
        
        &:last-child {
          border-bottom: none;
        }
        
        .request-info {
          flex: 1;
          min-width: 0;
          
          .request-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          
          .request-message {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            line-height: 1.4;
          }
          
          .request-time {
            font-size: 11px;
            color: var(--text-placeholder);
          }
        }
        
        .request-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
      }
    }
    
    .no-requests {
      text-align: center;
      padding: 20px;
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
}

// 验证信息对话框样式
.verification-dialog {
  .target-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .user-details {
      .user-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      
      .user-phone {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
  
  .quick-messages {
    margin-top: 16px;
    
    .quick-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .quick-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .el-button {
        font-size: 12px;
        padding: 4px 8px;
        height: auto;
        
        &:hover {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 滚动条样式
.requests-list::-webkit-scrollbar {
  width: 4px;
}

.requests-list::-webkit-scrollbar-track {
  background: transparent;
}

.requests-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>
