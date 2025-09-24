<template>
  <div class="message-input">
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <!-- 表情按钮 -->
      <el-popover
        ref="emojiPopoverRef"
        :visible="showEmojiPicker"
        placement="top-start"
        trigger="manual"
        :width="320"
        popper-class="emoji-popover"
      >
        <template #reference>
          <el-button 
            :icon="Sunny" 
            circle 
            size="small"
            @click="toggleEmojiPicker"
          />
        </template>
        
        <div class="emoji-picker">
          <div class="emoji-categories">
            <div 
              v-for="category in emojiCategories"
              :key="category.name"
              class="emoji-category"
              :class="{ active: currentEmojiCategory === category.name }"
              @click="currentEmojiCategory = category.name"
            >
              {{ category.icon }}
            </div>
          </div>
          
          <div class="emoji-grid">
            <div
              v-for="emoji in currentEmojis"
              :key="emoji"
              class="emoji-item"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </div>
          </div>
        </div>
      </el-popover>

      <!-- 文件上传 -->
      <el-upload
        ref="fileUploadRef"
        action="#"
        :show-file-list="false"
        :before-upload="handleFileUpload"
        :accept="acceptFileTypes"
        multiple
      >
        <el-button :icon="Paperclip" circle size="small" />
      </el-upload>

      <!-- 图片上传 -->
      <el-upload
        ref="imageUploadRef"
        action="#"
        :show-file-list="false"
        :before-upload="handleImageUpload"
        accept="image/*"
        multiple
      >
        <el-button :icon="Picture" circle size="small" />
      </el-upload>

      <!-- 语音输入（暂时禁用） -->
      <el-button 
        :icon="Microphone" 
        circle 
        size="small" 
        disabled
        @click="handleVoiceInput"
      />
    </div>

    <!-- 输入框区域 -->
    <div class="input-area">
      <!-- 文本输入框 -->
      <div class="input-wrapper">
        <el-input
          ref="textInputRef"
          v-model="messageText"
          type="textarea"
          :rows="inputRows"
          :maxlength="messageMaxLength"
          resize="none"
          placeholder="输入消息..."
          class="message-textarea"
          @keydown="handleKeyDown"
          @input="handleInput"
          @paste="handlePaste"
        />
        
        <!-- 字数统计 -->
        <div v-if="messageText.length > messageMaxLength * 0.8" class="char-count">
          {{ messageText.length }}/{{ messageMaxLength }}
        </div>
      </div>

      <!-- 发送按钮 -->
      <el-button
        type="primary"
        :disabled="!canSend"
        :loading="sending"
        @click="handleSend"
        class="send-button"
      >
        <el-icon><Promotion /></el-icon>
      </el-button>
    </div>

    <!-- 文件预览区域 -->
    <div v-if="uploadFiles.length > 0" class="file-preview">
      <div class="preview-header">
        <span>准备发送的文件 ({{ uploadFiles.length }})</span>
        <el-button 
          size="small" 
          text 
          type="danger"
          @click="clearFiles"
        >
          清空
        </el-button>
      </div>
      
      <div class="preview-list">
        <div 
          v-for="(file, index) in uploadFiles"
          :key="index"
          class="preview-item"
        >
          <!-- 图片预览 -->
          <div v-if="file.type === 'image'" class="image-preview">
            <el-image
              :src="file.preview"
              fit="cover"
              class="preview-image"
            />
            <el-button
              class="remove-btn"
              :icon="Close"
              circle
              size="small"
              @click="removeFile(index)"
            />
          </div>
          
          <!-- 文件预览 -->
          <div v-else class="file-preview-item">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
            <el-button
              class="remove-btn"
              :icon="Close"
              circle
              size="small"
              @click="removeFile(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 正在上传进度 -->
    <div v-if="uploadProgress.length > 0" class="upload-progress">
      <div 
        v-for="(progress, index) in uploadProgress"
        :key="index"
        class="progress-item"
      >
        <span>{{ progress.name }}</span>
        <el-progress :percentage="progress.percent" size="small" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Sunny,
  Paperclip,
  Picture,
  Microphone,
  Promotion,
  Close,
  Document
} from '@element-plus/icons-vue'
import { chatApi } from '@/api'

// Props
const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['send', 'typing'])

// 响应式数据
const textInputRef = ref()
const fileUploadRef = ref()
const imageUploadRef = ref()
const emojiPopoverRef = ref()

const messageText = ref('')
const uploadFiles = ref([])
const uploadProgress = ref([])
const sending = ref(false)
const showEmojiPicker = ref(false)
const currentEmojiCategory = ref('常用')

const messageMaxLength = 2000
const acceptFileTypes = '.doc,.docx,.pdf,.txt,.zip,.rar,.7z'

// 表情包数据
const emojiCategories = [
  { name: '常用', icon: '😊' },
  { name: '人物', icon: '😀' },
  { name: '动物', icon: '🐶' },
  { name: '食物', icon: '🍎' },
  { name: '活动', icon: '⚽' },
  { name: '符号', icon: '❤️' }
]

const emojiData = {
  常用: ['😊', '😂', '😍', '🥰', '😘', '😜', '🤔', '😎', '😴', '🤯', '😢', '😭', '😤', '😡', '🤗', '👍', '👌', '👏', '🙏', '❤️'],
  人物: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '☺️', '🙂'],
  动物: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  食物: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍑', '🥭', '🍍', '🥥', '🥦', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔'],
  活动: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
  符号: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️']
}

// 计算属性
const currentEmojis = computed(() => {
  return emojiData[currentEmojiCategory.value] || []
})

const inputRows = computed(() => {
  const lines = messageText.value.split('\n').length
  return Math.min(Math.max(lines, 1), 4)
})

const canSend = computed(() => {
  return (messageText.value.trim() || uploadFiles.value.length > 0) && !sending.value
})

// 方法
const handleKeyDown = (event) => {
  // Ctrl/Cmd + Enter 发送消息
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSend()
    return
  }
  
  // 普通 Enter 换行（如果没有按住 Shift）
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
    return
  }
  
  // 发送正在输入状态
  emit('typing', true)
}

const handleInput = () => {
  // 发送正在输入状态
  emit('typing', true)
  
  // 延迟停止输入状态
  clearTimeout(handleInput.timer)
  handleInput.timer = setTimeout(() => {
    emit('typing', false)
  }, 1000)
}

const handlePaste = async (event) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        await handleImageUpload(file)
      }
    }
  }
}

const handleSend = async () => {
  if (!canSend.value) return
  
  try {
    sending.value = true
    
    // 如果有文件，先上传文件
    if (uploadFiles.value.length > 0) {
      await sendFilesMessage()
    }
    
    // 如果有文本，发送文本消息
    if (messageText.value.trim()) {
      await sendTextMessage()
    }
    
    // 清空输入
    clearInput()
    
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
  }
}

const sendTextMessage = async () => {
  const messageData = {
    conversationId: props.conversation.id,
    msgType: 1, // 文本消息
    msgContent: messageText.value.trim(),
    chatType: props.conversation.chatType,
    recvId: props.conversation.targetId
  }
  
  emit('send', messageData)
}

const sendFilesMessage = async () => {
  for (const file of uploadFiles.value) {
    try {
      // 上传文件
      const formData = new FormData()
      formData.append('file', file.file)
      
      // 显示上传进度
      const progressItem = {
        name: file.name,
        percent: 0
      }
      uploadProgress.value.push(progressItem)
      
      const response = await chatApi.uploadFile(formData)
      const fileUrl = response.data.url
      
      // 发送文件消息
      const messageData = {
        conversationId: props.conversation.id,
        msgType: file.type === 'image' ? 2 : 3, // 2: 图片, 3: 文件
        msgContent: JSON.stringify({
          url: fileUrl,
          name: file.name,
          size: file.size,
          type: file.file.type
        }),
        chatType: props.conversation.chatType,
        recvId: props.conversation.targetId
      }
      
      emit('send', messageData)
      
      // 移除进度项
      const index = uploadProgress.value.indexOf(progressItem)
      if (index > -1) {
        uploadProgress.value.splice(index, 1)
      }
      
    } catch (error) {
      console.error('上传文件失败:', error)
      ElMessage.error(`上传文件 ${file.name} 失败`)
    }
  }
}

const handleFileUpload = (file) => {
  // 检查文件大小（限制为50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }
  
  uploadFiles.value.push({
    file,
    name: file.name,
    size: file.size,
    type: 'file'
  })
  
  return false // 阻止自动上传
}

const handleImageUpload = (file) => {
  // 检查文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadFiles.value.push({
      file,
      name: file.name,
      size: file.size,
      type: 'image',
      preview: e.target.result
    })
  }
  reader.readAsDataURL(file)
  
  return false // 阻止自动上传
}

const removeFile = (index) => {
  uploadFiles.value.splice(index, 1)
}

const clearFiles = () => {
  uploadFiles.value = []
}

const clearInput = () => {
  messageText.value = ''
  uploadFiles.value = []
  uploadProgress.value = []
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
  
  if (showEmojiPicker.value) {
    // 点击外部关闭表情选择器
    const closeEmojiPicker = (event) => {
      if (!emojiPopoverRef.value?.$el.contains(event.target)) {
        showEmojiPicker.value = false
        document.removeEventListener('click', closeEmojiPicker)
      }
    }
    
    setTimeout(() => {
      document.addEventListener('click', closeEmojiPicker)
    }, 100)
  }
}

const insertEmoji = (emoji) => {
  const cursorPosition = textInputRef.value?.ref?.selectionStart || messageText.value.length
  const newText = messageText.value.slice(0, cursorPosition) + emoji + messageText.value.slice(cursorPosition)
  
  messageText.value = newText
  showEmojiPicker.value = false
  
  // 聚焦到输入框
  nextTick(() => {
    textInputRef.value?.focus()
    textInputRef.value?.ref?.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length)
  })
}

const handleVoiceInput = () => {
  ElMessage.info('语音输入功能开发中')
}

const formatFileSize = (size) => {
  if (size < 1024) return size + ' B'
  else if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB'
  else return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// 生命周期
onMounted(() => {
  // 聚焦到输入框
  nextTick(() => {
    textInputRef.value?.focus()
  })
})

onBeforeUnmount(() => {
  clearTimeout(handleInput.timer)
})
</script>

<style lang="scss" scoped>
.message-input {
  border-top: 1px solid var(--border-lighter);
  background: white;
  padding: 16px;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  
  .el-button {
    color: var(--text-secondary);
    
    &:hover:not(:disabled) {
      color: var(--primary-color);
      background: var(--primary-color-light);
    }
    
    &:disabled {
      opacity: 0.5;
    }
  }
  
  :deep(.el-upload) {
    .el-button {
      margin: 0;
    }
  }
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-wrapper {
  flex: 1;
  position: relative;
  
  .message-textarea {
    :deep(.el-textarea__inner) {
      border-radius: 12px;
      border: 1px solid var(--border-light);
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.4;
      resize: none;
      transition: border-color 0.2s ease;
      
      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
      
      &::placeholder {
        color: var(--text-placeholder);
      }
    }
  }
  
  .char-count {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 12px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.9);
    padding: 2px 4px;
    border-radius: 4px;
  }
}

.send-button {
  min-width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #5dade2 100%);
  border: none;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
  
  &:disabled {
    background: var(--border-light);
    transform: none;
    box-shadow: none;
  }
  
  .el-icon {
    font-size: 18px;
  }
}

.file-preview {
  margin: 16px 0 0 0;
  padding: 12px;
  background: var(--background-light);
  border-radius: 8px;
  border: 1px solid var(--border-lighter);
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .preview-item {
    position: relative;
  }
  
  .image-preview {
    position: relative;
    
    .preview-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--danger-color);
      color: white;
      border: 2px solid white;
      
      &:hover {
        background: var(--danger-color);
        opacity: 0.8;
      }
    }
  }
  
  .file-preview-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid var(--border-light);
    position: relative;
    max-width: 200px;
    
    .file-icon {
      font-size: 20px;
      color: var(--primary-color);
    }
    
    .file-info {
      flex: 1;
      min-width: 0;
      
      .file-name {
        font-size: 12px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .file-size {
        font-size: 11px;
        color: var(--text-secondary);
      }
    }
    
    .remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--danger-color);
      color: white;
      border: 2px solid white;
      
      &:hover {
        background: var(--danger-color);
        opacity: 0.8;
      }
    }
  }
}

.upload-progress {
  margin-top: 12px;
  
  .progress-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--text-secondary);
    
    span {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .el-progress {
      flex: 1;
    }
  }
}

// 表情选择器样式
:deep(.emoji-popover) {
  padding: 0;
  
  .emoji-picker {
    .emoji-categories {
      display: flex;
      padding: 8px;
      border-bottom: 1px solid var(--border-lighter);
      gap: 4px;
      
      .emoji-category {
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s ease;
        
        &:hover,
        &.active {
          background: var(--primary-color-light);
        }
      }
    }
    
    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      padding: 8px;
      max-height: 200px;
      overflow-y: auto;
      
      .emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s ease;
        
        &:hover {
          background: var(--background-light);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .message-input {
    padding: 12px;
  }
  
  .input-toolbar {
    gap: 6px;
    margin-bottom: 8px;
    
    .el-button {
      padding: 6px;
    }
  }
  
  .send-button {
    min-width: 40px;
    height: 40px;
  }
  
  .file-preview {
    .preview-list {
      .image-preview .preview-image {
        width: 60px;
        height: 60px;
      }
      
      .file-preview-item {
        max-width: 150px;
      }
    }
  }
}
</style>
