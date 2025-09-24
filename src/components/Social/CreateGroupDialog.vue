<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建群组"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-group-dialog">
      <!-- 群组基本信息 -->
      <el-form
        ref="formRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="80px"
        class="group-form"
      >
        <el-form-item label="群组头像">
          <div class="avatar-upload">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="handleAvatarUpload"
              accept="image/*"
            >
              <div class="avatar-container">
                <el-avatar 
                  v-if="groupForm.avatar"
                  :size="80"
                  :src="groupForm.avatar"
                />
                <div v-else class="avatar-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>上传头像</span>
                </div>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="群组名称" prop="name">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入群组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="群组描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            placeholder="请输入群组描述（可选）"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <!-- 选择成员 -->
      <div class="member-selection">
        <div class="section-header">
          <h4>选择成员</h4>
          <div class="selected-count">
            已选择 {{ selectedMembers.length }} 人
          </div>
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索好友..."
            :prefix-icon="Search"
            clearable
            :loading="searching"
            @input="handleSearchInput"
            @clear="handleClearSearch"
          />
        </div>

        <!-- 已选择的成员 -->
        <div v-if="selectedMembers.length > 0" class="selected-members">
          <div class="selected-header">
            <span>已选择的成员</span>
            <el-button size="small" text @click="clearSelectedMembers">
              清空
            </el-button>
          </div>
          
          <div class="selected-list">
            <div 
              v-for="member in selectedMembers"
              :key="member.id"
              class="selected-member"
            >
              <el-avatar :size="24" :src="member.avatar">
                {{ member.nickname?.charAt(0) }}
              </el-avatar>
              <span>{{ member.nickname }}</span>
              <el-button
                :icon="Close"
                circle
                size="small"
                @click="removeMember(member)"
              />
            </div>
          </div>
        </div>

        <!-- 好友列表 -->
        <div class="friends-list">
          <div class="list-header">
            <span>我的好友 ({{ filteredFriends.length }})</span>
          </div>
          
          <div class="friends-container">
            <div 
              v-for="friend in filteredFriends"
              :key="friend.id"
              class="friend-item"
              :class="{ selected: isSelected(friend.id) }"
              @click="toggleMember(friend)"
            >
              <el-avatar :size="36" :src="friend.avatar">
                {{ friend.nickname?.charAt(0) }}
              </el-avatar>
              
              <div class="friend-info">
                <div class="friend-name">{{ friend.nickname }}</div>
                <div class="friend-status">
                  {{ friend.online ? '在线' : '离线' }}
                </div>
              </div>
              
              <el-checkbox
                :model-value="isSelected(friend.id)"
                @change="toggleMember(friend)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="creating"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          创建群组
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Search,
  Close
} from '@element-plus/icons-vue'
import { socialApi, chatApi } from '@/api'
import { useChatStore } from '@/stores/modules/chat'
import { useSocialStore } from '@/stores/modules/social'

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
const socialStore = useSocialStore()

// 响应式数据
const formRef = ref()
const searchKeyword = ref('')
const selectedMembers = ref([])
const creating = ref(false)
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)

const groupForm = ref({
  name: '',
  description: '',
  avatar: ''
})

const groupRules = {
  name: [
    { required: true, message: '请输入群组名称', trigger: 'blur' },
    { min: 2, max: 20, message: '群组名称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredFriends = computed(() => {
  // 如果有搜索关键词且已搜索，显示搜索结果
  if (searchKeyword.value && hasSearched.value) {
    return searchResults.value
  }
  
  // 否则显示所有好友（从socialStore获取）
  return socialStore.friends || []
})

const canCreate = computed(() => {
  return groupForm.value.name.trim() && selectedMembers.value.length >= 1
})

// 防抖搜索
let searchTimer = null

// 方法
const handleSearchInput = (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  if (!value.trim()) {
    // 清空搜索结果
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  // 防抖搜索，用户停止输入500ms后执行搜索
  searchTimer = setTimeout(() => {
    handleSearch(value.trim())
  }, 500)
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

const handleSearch = async (keyword) => {
  if (!keyword) return
  
  try {
    searching.value = true
    
    // 调用搜索用户接口
    const response = await socialApi.searchUsers(keyword)
    
    // 处理搜索结果，映射为统一的好友格式
    searchResults.value = (response.data?.list || []).map(user => ({
      id: user.id,
      friend_uid: user.id, // 保持与好友数据结构一致
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      online: false // 搜索结果默认不显示在线状态
    }))
    
    hasSearched.value = true
  } catch (error) {
    console.error('搜索好友失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const handleAvatarUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小（5MB）
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    groupForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

const toggleMember = (friend) => {
  const index = selectedMembers.value.findIndex(m => m.id === friend.id)
  
  if (index >= 0) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(friend)
  }
}

const removeMember = (member) => {
  const index = selectedMembers.value.findIndex(m => m.id === member.id)
  if (index >= 0) {
    selectedMembers.value.splice(index, 1)
  }
}

const clearSelectedMembers = () => {
  selectedMembers.value = []
}

const isSelected = (friendId) => {
  return selectedMembers.value.some(m => m.id === friendId || m.friend_uid === friendId)
}

const handleCreate = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()
    
    creating.value = true

    // 准备群组数据
    const groupData = {
      name: groupForm.value.name.trim(),
      description: groupForm.value.description.trim(),
      icon: groupForm.value.avatar,
      memberIds: selectedMembers.value.map(m => m.id)
    }

    // 如果有头像，先上传
    if (groupForm.value.avatar && groupForm.value.avatar.startsWith('data:')) {
      // 将base64转换为文件并上传
      const response = await fetch(groupForm.value.avatar)
      const blob = await response.blob()
      const file = new File([blob], 'icon.png', { type: 'image/png' })
      
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await chatApi.uploadFile(formData)
      groupData.icon = uploadResponse.data.url
    }

    // 创建群组
    await socialApi.createGroup(groupData)

    ElMessage.success('群组创建成功')
    emit('success')
    handleClose()

  } catch (error) {
    console.error('创建群组失败:', error)
    ElMessage.error('创建群组失败')
  } finally {
    creating.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  groupForm.value = {
    name: '',
    description: '',
    avatar: ''
  }
  
  selectedMembers.value = []
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
  
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

// 监听对话框打开，加载好友列表
watch(dialogVisible, async (visible) => {
  if (visible) {
    // 加载好友列表
    await socialStore.loadFriends()
  }
})
</script>

<style lang="scss" scoped>
.create-group-dialog {
  .group-form {
    margin-bottom: 24px;
    
    .avatar-upload {
      .avatar-uploader {
        :deep(.el-upload) {
          border: none;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          
          &:hover {
            border-color: var(--primary-color);
          }
        }
        
        .avatar-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px dashed var(--border-light);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          
          &:hover {
            border-color: var(--primary-color);
          }
          
          .avatar-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: var(--text-secondary);
            
            .el-icon {
              font-size: 20px;
            }
            
            span {
              font-size: 12px;
            }
          }
        }
      }
    }
  }
  
  .member-selection {
    .section-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .selected-count {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
    
    .search-box {
      margin-bottom: 16px;
      
      :deep(.el-input__wrapper) {
        border-radius: 8px;
      }
    }
    
    .selected-members {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--background-light);
      border-radius: 8px;
      
      .selected-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        span {
          font-size: 14px;
          color: var(--text-secondary);
        }
      }
      
      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .selected-member {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border-light);
          font-size: 12px;
          
          span {
            color: var(--text-primary);
          }
          
          .el-button {
            margin-left: 4px;
            
            &:hover {
              color: var(--danger-color);
            }
          }
        }
      }
    }
    
    .friends-list {
      .list-header {
        padding: 8px 0;
        font-size: 14px;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-lighter);
        margin-bottom: 12px;
      }
      
      .friends-container {
        max-height: 300px;
        overflow-y: auto;
        
        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--background-light);
          }
          
          &.selected {
            background: var(--primary-color-light);
            color: var(--primary-color);
          }
          
          .friend-info {
            flex: 1;
            min-width: 0;
            
            .friend-name {
              font-size: 14px;
              color: var(--text-primary);
              margin-bottom: 2px;
            }
            
            .friend-status {
              font-size: 12px;
              color: var(--text-secondary);
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
.friends-container::-webkit-scrollbar {
  width: 4px;
}

.friends-container::-webkit-scrollbar-track {
  background: transparent;
}

.friends-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}
</style>
