<template>
  <el-dialog
    v-model="dialogVisible"
    title="申请加群"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="join-group-dialog">
      <!-- 搜索群组 -->
      <div class="search-section">
        <div class="search-input-wrapper">
          <el-input
            v-model="searchKeyword"
            placeholder="输入群组ID或群组名称搜索"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
            class="search-input"
          />
          <el-button 
            type="primary"
            :loading="searching"
            @click="handleSearch"
            class="search-button"
          >
            搜索
          </el-button>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span>搜索结果 ({{ searchResults.length }})</span>
        </div>
        
        <div class="results-list">
          <div 
            v-for="group in searchResults"
            :key="group.id"
            class="group-item"
          >
            <el-avatar :size="40" :src="group.icon">
              {{ group.name?.charAt(0) }}
            </el-avatar>
            
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-desc">{{ group.description || '暂无描述' }}</div>
              <div class="group-members">成员数: {{ group.memberCount || 0 }}</div>
            </div>
            
            <el-button
              v-if="!isAlreadyMember(group.id)"
              type="primary"
              size="small"
              :loading="sendingRequest === group.id"
              @click="handleShowRequestDialog(group)"
            >
              {{ sentRequests.has(group.id) ? '已发送' : '申请加入' }}
            </el-button>
            
            <el-tag v-else type="success" size="small">
              已是成员
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="hasSearched && !searching" class="empty-state">
        <div class="empty-icon">
          <el-icon><Search /></el-icon>
        </div>
        <div class="empty-text">未找到相关群组</div>
        <div class="empty-hint">尝试使用不同的关键词搜索</div>
      </div>

      <!-- 初始状态 -->
      <div v-else-if="!hasSearched" class="initial-state">
        <div class="initial-icon">
          <el-icon><ChatDotSquare /></el-icon>
        </div>
        <div class="initial-text">搜索群组</div>
        <div class="initial-hint">输入群组ID或名称来搜索您想加入的群组</div>
      </div>
    </div>

    <!-- 申请加群确认对话框 -->
    <el-dialog
      v-model="requestDialogVisible"
      title="申请加入群组"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div v-if="selectedGroup" class="request-dialog">
        <div class="group-preview">
          <el-avatar :size="60" :src="selectedGroup.icon">
            {{ selectedGroup.name?.charAt(0) }}
          </el-avatar>
          <div class="group-details">
            <h4>{{ selectedGroup.name }}</h4>
            <p>{{ selectedGroup.description || '暂无描述' }}</p>
          </div>
        </div>
        
        <el-form :model="requestForm" label-width="80px">
          <el-form-item label="申请消息">
            <el-input
              v-model="requestForm.message"
              type="textarea"
              :rows="3"
              placeholder="请输入申请理由（可选）"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="requestDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="sendingRequest"
            @click="handleSendRequest"
          >
            发送申请
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  ChatDotSquare
} from '@element-plus/icons-vue'
import { socialApi } from '@/api'
import { useChatStore } from '@/stores/modules/chat'

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
const chatStore = useChatStore()

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const sendingRequest = ref(null)
const sentRequests = ref(new Set())
const requestDialogVisible = ref(false)
const selectedGroup = ref(null)

const requestForm = ref({
  message: ''
})

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
    
    // 调用综合搜索接口，过滤出群组结果
    const response = await socialApi.searchAll(searchKeyword.value.trim())
    
    // 处理搜索结果，只保留群组
    const allResults = response.data?.list || []
    searchResults.value = allResults.filter(item => item.type === 'group' || item.chatType === 2)
    hasSearched.value = true

    if (searchResults.value.length === 0) {
      ElMessage.info('未找到相关群组')
    }
  } catch (error) {
    console.error('搜索群组失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const isAlreadyMember = (groupId) => {
  // TODO: 检查用户是否已经是群成员
  // 可以从chatStore的会话列表中检查是否已存在该群的会话
  return chatStore.conversationList.some(conv => 
    conv.chatType === 2 && conv.targetId === groupId
  )
}

const handleShowRequestDialog = (group) => {
  if (sentRequests.value.has(group.id)) {
    ElMessage.info('申请已发送，请等待群主处理')
    return
  }

  selectedGroup.value = group
  requestForm.value.message = `我想加入您的群组：${group.name}`
  requestDialogVisible.value = true
}

const handleSendRequest = async () => {
  if (!selectedGroup.value) return

  try {
    sendingRequest.value = selectedGroup.value.id
    
    // 发送申请加群请求
    const requestData = {
      groupId: selectedGroup.value.id,
      reqMsg: requestForm.value.message.trim(),
      reqTime: Date.now()
    }

    await socialApi.joinGroupRequest(requestData)
    
    // 标记已发送请求
    sentRequests.value.add(selectedGroup.value.id)
    
    ElMessage.success('申请已发送，请等待群主处理')
    requestDialogVisible.value = false
    
    emit('success')
  } catch (error) {
    console.error('发送加群申请失败:', error)
    ElMessage.error(error.response?.data?.msg || '申请失败，请稍后重试')
  } finally {
    sendingRequest.value = null
  }
}

const handleClose = () => {
  dialogVisible.value = false
  
  // 重置数据
  searchKeyword.value = ''
  searchResults.value = []
  searching.value = false
  hasSearched.value = false
  sendingRequest.value = null
  sentRequests.value.clear()
  requestDialogVisible.value = false
  selectedGroup.value = null
  requestForm.value = { message: '' }
}
</script>

<style lang="scss" scoped>
.join-group-dialog {
  .search-section {
    margin-bottom: 20px;
    
    .search-input-wrapper {
      display: flex;
      gap: 8px;
      
      .search-input {
        flex: 1;
      }
      
      .search-button {
        flex-shrink: 0;
        min-width: 60px;
      }
    }
  }
  
  .search-results {
    .results-header {
      padding: 8px 0;
      font-size: 14px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-lighter);
      margin-bottom: 16px;
    }
    
    .results-list {
      max-height: 400px;
      overflow-y: auto;
      
      .group-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border-lighter);
        margin-bottom: 8px;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .group-info {
          flex: 1;
          min-width: 0;
          
          .group-name {
            font-size: 16px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .group-desc {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .group-members {
            font-size: 11px;
            color: var(--text-placeholder);
          }
        }
        
        .el-button {
          flex-shrink: 0;
        }
        
        .el-tag {
          flex-shrink: 0;
        }
      }
    }
  }
  
  .empty-state,
  .initial-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    
    .empty-icon,
    .initial-icon {
      font-size: 48px;
      color: var(--text-placeholder);
      margin-bottom: 16px;
    }
    
    .empty-text,
    .initial-text {
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .empty-hint,
    .initial-hint {
      font-size: 14px;
      color: var(--text-placeholder);
    }
  }
}

.request-dialog {
  .group-preview {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--background-light);
    border-radius: 8px;
    margin-bottom: 20px;
    
    .group-details {
      flex: 1;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: var(--text-primary);
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.4;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 滚动条样式
.results-list::-webkit-scrollbar {
  width: 4px;
}

.results-list::-webkit-scrollbar-track {
  background: transparent;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>
