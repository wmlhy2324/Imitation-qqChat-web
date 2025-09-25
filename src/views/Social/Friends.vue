<template>
  <div class="friends-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2>好友列表</h2>
        <span class="friend-count">(共 {{ friends.length }} 个好友)</span>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索好友..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearchFriends"
        />
        <el-button 
          type="primary"
          :icon="Plus"
          @click="showAddFriendDialog = true"
        >
          添加好友
        </el-button>
        <el-button 
          :icon="Refresh"
          @click="loadFriends"
          :loading="isLoading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="friends-content">
      <div v-if="isLoading && friends.length === 0" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredFriends.length === 0" class="empty-state">
        <el-empty 
          :description="searchKeyword ? '未找到相关好友' : '暂无好友'"
          :image-size="120"
        >
          <template #image>
            <el-icon :size="80">
              <UserFilled />
            </el-icon>
          </template>
          <el-button 
            v-if="!searchKeyword"
            type="primary"
            @click="showAddFriendDialog = true"
          >
            添加好友
          </el-button>
        </el-empty>
      </div>
      
      <div v-else class="friends-list">
        <div 
          v-for="friend in filteredFriends"
          :key="friend.friend_uid"
          class="friend-item"
          @click="handleChatWithFriend(friend)"
        >
          <div class="friend-avatar-wrapper">
            <el-avatar 
              :size="50" 
              :src="friend.avatar"
              class="friend-avatar"
            >
              {{ friend.nickname?.charAt(0) }}
            </el-avatar>
            <div 
              :class="['online-status', { online: isOnline(friend.friend_uid) }]"
            ></div>
          </div>
          
          <div class="friend-info">
            <div class="friend-name">
              {{ friend.remark || friend.nickname }}
              <span v-if="friend.remark" class="real-name">(本名: {{ friend.nickname }})</span>
            </div>
            <div class="friend-status">
              {{ isOnline(friend.friend_uid) ? '在线' : '离线' }}
            </div>
          </div>
          
          <div class="friend-actions" @click.stop>
            <el-dropdown trigger="click">
              <el-button 
                type="text" 
                :icon="MoreFilled" 
                class="action-btn"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    :icon="ChatDotSquare"
                    @click="handleChatWithFriend(friend)"
                  >
                    发送消息
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :icon="Edit"
                    @click="handleEditRemark(friend)"
                  >
                    修改备注
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :icon="Delete"
                    @click="handleDeleteFriend(friend)"
                    divided
                  >
                    删除好友
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加好友对话框 -->
    <AddFriendDialog 
      v-model="showAddFriendDialog"
      @success="handleAddFriendSuccess"
    />

    <!-- 修改备注对话框 -->
    <el-dialog
      v-model="showRemarkDialog"
      title="修改好友备注"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="好友昵称">
          <span>{{ currentFriend?.nickname }}</span>
        </el-form-item>
        <el-form-item label="备注名称">
          <el-input
            v-model="remarkForm.remark"
            placeholder="请输入备注名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRemarkDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSaveRemark"
          :loading="savingRemark"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Refresh,
  UserFilled,
  MoreFilled,
  ChatDotSquare,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { useSocialStore } from '@/stores'
import { useUserStore } from '@/stores/modules/user'
import AddFriendDialog from '@/components/Social/AddFriendDialog.vue'

// Router
const router = useRouter()

// Store
const socialStore = useSocialStore()

// 响应式数据
const searchKeyword = ref('')
const showAddFriendDialog = ref(false)
const showRemarkDialog = ref(false)
const currentFriend = ref(null)
const remarkForm = ref({ remark: '' })
const savingRemark = ref(false)
const onlineUsers = ref(new Map())

// 计算属性
const friends = computed(() => socialStore.friends || [])
const isLoading = computed(() => socialStore.isLoading)

const filteredFriends = computed(() => {
  if (!searchKeyword.value) return friends.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return friends.value.filter(friend => 
    (friend.nickname && friend.nickname.toLowerCase().includes(keyword)) ||
    (friend.remark && friend.remark.toLowerCase().includes(keyword))
  )
})

// 方法
const loadFriends = async () => {
  await socialStore.loadFriends()
  // 加载好友在线状态
  await loadFriendsOnlineStatus()
}

const loadFriendsOnlineStatus = async () => {
  try {
    const { socialApi } = await import('@/api')
    const response = await socialApi.getFriendsOnline()
    if (response.data) {
      onlineUsers.value = new Map(Object.entries(response.data.onLineList || {}))
    }
  } catch (error) {
    console.error('获取好友在线状态失败:', error)
  }
}

const isOnline = (userId) => {
  return onlineUsers.value.get(userId) === true
}

const handleSearchFriends = () => {
  // 按防抖处理，可以后续优化
}

const handleChatWithFriend = async (friend) => {
  try {
    // 先创建对话框
    const { chatApi } = await import('@/api')
    const userStore = useUserStore()
    
    const conversationData = {
      sendId: userStore.userId || userStore.userInfo?.id, // 当前用户ID
      recvId: friend.friend_uid,
      ChatType: 2 // 2表示私聊
    }
    
    await chatApi.createConversation(conversationData)
    
    // 创建成功后跳转到聊天界面，使用ChatLayout路由
    router.push({
      name: 'ChatLayout',
      query: {
        targetId: friend.friend_uid,
        targetName: friend.remark || friend.nickname,
        targetAvatar: friend.avatar,
        chatType: 2
      }
    })
    
    ElMessage.success('正在打开聊天窗口...')
    
  } catch (error) {
    console.error('创建对话失败:', error)
    ElMessage.error('创建对话失败，请稍后重试')
  }
}

const handleEditRemark = (friend) => {
  currentFriend.value = friend
  remarkForm.value.remark = friend.remark || ''
  showRemarkDialog.value = true
}

const handleSaveRemark = async () => {
  if (!currentFriend.value) return
  
  try {
    savingRemark.value = true
    
    // 这里需要后端提供修改备注的接口
    // await socialStore.updateFriendRemark(currentFriend.value.id, remarkForm.value.remark)
    
    // 暂时更新本地数据
    const friendIndex = friends.value.findIndex(f => f.friend_uid === currentFriend.value.friend_uid)
    if (friendIndex >= 0) {
      friends.value[friendIndex].remark = remarkForm.value.remark
    }
    
    ElMessage.success('备注修改成功')
    showRemarkDialog.value = false
    
  } catch (error) {
    console.error('修改备注失败:', error)
    ElMessage.error('修改备注失败')
  } finally {
    savingRemark.value = false
  }
}

const handleDeleteFriend = async (friend) => {
  try {
    await ElMessageBox.confirm(
      `确认要删除好友「${friend.remark || friend.nickname}」吗？`,
      '删除好友',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const result = await socialStore.deleteFriend(friend.id)
    
    if (result.success) {
      ElMessage.success('已删除好友')
    } else {
      ElMessage.error(result.message || '删除好友失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除好友失败:', error)
      ElMessage.error('删除好友失败')
    }
  }
}

const handleAddFriendSuccess = () => {
  // 添加好友成功后刷新列表
  loadFriends()
}

// 组件挂载
onMounted(() => {
  loadFriends()
  
  // 定期更新在线状态
  const onlineStatusTimer = setInterval(loadFriendsOnlineStatus, 30000)
  
  // 组件销毁时清理定时器
  onUnmounted(() => {
    if (onlineStatusTimer) {
      clearInterval(onlineStatusTimer)
    }
  })
})
</script>

<style lang="scss" scoped>
.friends-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-lighter);
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .friend-count {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .search-input {
        width: 200px;
      }
    }
  }
  
  .friends-content {
    flex: 1;
    overflow: hidden;
    
    .loading-state {
      padding: 20px;
    }
    
    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        color: var(--text-placeholder);
      }
    }
    
    .friends-list {
      height: 100%;
      overflow-y: auto;
      padding: 0 20px;
      
      .friend-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid var(--border-lighter);
        cursor: pointer;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: var(--background-light);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .friend-avatar-wrapper {
          position: relative;
          
          .friend-avatar {
            border: 2px solid var(--border-light);
          }
          
          .online-status {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--color-danger);
            border: 2px solid #fff;
            
            &.online {
              background-color: var(--color-success);
            }
          }
        }
        
        .friend-info {
          flex: 1;
          min-width: 0;
          
          .friend-name {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            
            .real-name {
              font-size: 12px;
              font-weight: normal;
              color: var(--text-secondary);
            }
          }
          
          .friend-status {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
        
        .friend-actions {
          .action-btn {
            color: var(--text-secondary);
            
            &:hover {
              color: var(--text-primary);
            }
          }
        }
      }
    }
  }
}

// 滚动条样式
.friends-list::-webkit-scrollbar {
  width: 6px;
}

.friends-list::-webkit-scrollbar-track {
  background: transparent;
}

.friends-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>