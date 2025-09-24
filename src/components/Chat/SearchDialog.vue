<template>
  <el-dialog
    v-model="dialogVisible"
    title="搜索好友和群组"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="search-dialog">
      <!-- 搜索输入框 -->
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="输入用户名或群组名搜索..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
          @keyup.enter="handleSearch"
          ref="searchInputRef"
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
      <div v-if="showResults" class="search-results">
        <!-- 好友搜索结果 -->
        <div v-if="friendResults.length > 0" class="result-section">
          <div class="section-header">
            <el-icon><User /></el-icon>
            <span>好友 ({{ friendResults.length }})</span>
          </div>
          
          <div class="results-list">
            <div 
              v-for="friend in friendResults"
              :key="`friend-${friend.id}`"
              class="result-item"
              @click="handleSelectFriend(friend)"
            >
              <el-avatar :size="40" :src="friend.avatar">
                {{ friend.nickname?.charAt(0) }}
              </el-avatar>
              
              <div class="result-info">
                <div class="result-name">{{ friend.nickname }}</div>
                <div class="result-desc">{{ friend.phone || '好友' }}</div>
              </div>
              
              <div class="result-actions">
                <el-button type="primary" size="small">聊天</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 群组搜索结果 -->
        <div v-if="groupResults.length > 0" class="result-section">
          <div class="section-header">
            <el-icon><UserFilled /></el-icon>
            <span>群组 ({{ groupResults.length }})</span>
          </div>
          
          <div class="results-list">
            <div 
              v-for="group in groupResults"
              :key="`group-${group.id}`"
              class="result-item"
              @click="handleSelectGroup(group)"
            >
              <el-avatar :size="40" :src="group.avatar" shape="square">
                {{ group.name?.charAt(0) }}
              </el-avatar>
              
              <div class="result-info">
                <div class="result-name">{{ group.name }}</div>
                <div class="result-desc">{{ group.memberCount || 0 }}人 · {{ group.description || '群聊' }}</div>
              </div>
              
              <div class="result-actions">
                <el-button type="primary" size="small">进入</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="hasSearched && friendResults.length === 0 && groupResults.length === 0" class="empty-state">
          <el-empty 
            description="未找到相关结果"
            :image-size="100"
          >
            <template #image>
              <el-icon :size="60">
                <Search />
              </el-icon>
            </template>
          </el-empty>
        </div>
      </div>

      <!-- 默认提示 -->
      <div v-else class="default-hint">
        <div class="hint-content">
          <el-icon :size="60"><Search /></el-icon>
          <p>输入关键词搜索好友和群组</p>
          <div class="hint-tips">
            <p>小贴士：</p>
            <ul>
              <li>支持按用户名、手机号搜索好友</li>
              <li>支持按群组名称搜索群组</li>
              <li>点击结果可以直接开始聊天</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import { socialApi } from '@/api'
import { useChatStore } from '@/stores'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'select-friend', 'select-group'])

const router = useRouter()
const chatStore = useChatStore()

// 响应式数据
const searchKeyword = ref('')
const friendResults = ref([])
const groupResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const searchInputRef = ref(null)

// 防抖搜索
let searchTimer = null

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showResults = computed(() => {
  return hasSearched.value && !searching.value
})

// 方法
const handleSearchInput = (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 防抖搜索，用户停止输入500ms后执行搜索
  if (value.trim()) {
    searchTimer = setTimeout(() => {
      handleSearch()
    }, 500)
  } else {
    // 清空搜索结果
    friendResults.value = []
    groupResults.value = []
    hasSearched.value = false
  }
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  try {
    searching.value = true
    
    // 并行搜索好友和群组
    const [friendResponse, groupResponse] = await Promise.all([
      searchFriends(searchKeyword.value.trim()).catch(() => ({ data: { list: [] } })),
      searchGroups(searchKeyword.value.trim()).catch(() => ({ data: { list: [] } }))
    ])
    
    friendResults.value = friendResponse.data?.list || []
    groupResults.value = groupResponse.data?.list || []
    hasSearched.value = true
    
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    searching.value = false
  }
}

// 搜索好友
const searchFriends = async (keyword) => {
  try {
    // 优先使用综合搜索接口
    const response = await socialApi.searchAll(keyword)
    return {
      data: {
        list: response.data?.friendList || []
      }
    }
  } catch (error) {
    // 如果综合搜索接口不存在，使用单独的搜索用户接口
    const response = await socialApi.searchUsers(keyword)
    return {
      data: {
        list: response.data?.list || []
      }
    }
  }
}

// 搜索群组
const searchGroups = async (keyword) => {
  try {
    // 优先使用综合搜索接口
    const response = await socialApi.searchAll(keyword)
    return {
      data: {
        list: response.data?.groupList || []
      }
    }
  } catch (error) {
    // 如果综合搜索接口不存在，使用单独的搜索群组接口
    const response = await socialApi.searchGroups(keyword)
    return {
      data: {
        list: response.data?.list || []
      }
    }
  }
}

// 选择好友
const handleSelectFriend = async (friend) => {
  try {
    // 创建或获取私聊会话
    const conversationData = {
      type: 'private',
      targetId: friend.id,
      title: friend.nickname,
      avatar: friend.avatar
    }
    
    // 通过store创建会话
    const result = await chatStore.createOrGetConversation(conversationData)
    
    if (result.success) {
      // 关闭搜索对话框
      handleClose()
      
      // 选择该会话
      emit('select-friend', friend, result.data)
    } else {
      ElMessage.error('创建会话失败')
    }
  } catch (error) {
    console.error('选择好友失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 选择群组
const handleSelectGroup = async (group) => {
  try {
    // 创建或获取群聊会话
    const conversationData = {
      type: 'group',
      targetId: group.id,
      title: group.name,
      avatar: group.avatar
    }
    
    // 通过store创建会话
    const result = await chatStore.createOrGetConversation(conversationData)
    
    if (result.success) {
      // 关闭搜索对话框
      handleClose()
      
      // 选择该会话
      emit('select-group', group, result.data)
    } else {
      ElMessage.error('创建会话失败')
    }
  } catch (error) {
    console.error('选择群组失败:', error)
    ElMessage.error('创建会话失败')
  }
}

const handleClose = () => {
  dialogVisible.value = false
  
  // 重置数据
  searchKeyword.value = ''
  friendResults.value = []
  groupResults.value = []
  hasSearched.value = false
  
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

// 监听对话框显示，自动聚焦搜索框
watch(dialogVisible, async (visible) => {
  if (visible) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})
</script>

<style lang="scss" scoped>
.search-dialog {
  .search-section {
    margin-bottom: 20px;
  }
  
  .search-results {
    max-height: 400px;
    overflow-y: auto;
    
    .result-section {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-lighter);
        margin-bottom: 12px;
        
        .el-icon {
          font-size: 16px;
          color: var(--text-secondary);
        }
      }
      
      .results-list {
        .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          
          &:hover {
            background: var(--background-light);
          }
          
          .result-info {
            flex: 1;
            min-width: 0;
            
            .result-name {
              font-size: 14px;
              font-weight: 500;
              color: var(--text-primary);
              margin-bottom: 4px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .result-desc {
              font-size: 12px;
              color: var(--text-secondary);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          
          .result-actions {
            .el-button {
              font-size: 12px;
              padding: 4px 12px;
            }
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
}

.dialog-footer {
  text-align: right;
}

// 滚动条样式
.search-results::-webkit-scrollbar {
  width: 4px;
}

.search-results::-webkit-scrollbar-track {
  background: transparent;
}

.search-results::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>
