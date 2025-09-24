<template>
  <div class="chat-welcome">
    <div class="welcome-content">
      <div class="welcome-icon">
        <el-icon :size="120">
          <ChatDotSquare />
        </el-icon>
      </div>
      
      <h1 class="welcome-title">欢迎使用 Easy Chat</h1>
      <p class="welcome-subtitle">选择一个会话开始聊天，或者创建新的对话</p>
      
      <div class="welcome-actions">
        <el-button 
          type="primary" 
          size="large"
          :icon="Plus"
          @click="$emit('add-friend')"
        >
          添加好友
        </el-button>
        <el-button 
          size="large"
          :icon="UserFilled"
          @click="$emit('create-group')"
        >
          创建群组
        </el-button>
      </div>
      
      <div class="features">
        <div class="feature-item">
          <el-icon><Message /></el-icon>
          <span>实时消息</span>
        </div>
        <div class="feature-item">
          <el-icon><Picture /></el-icon>
          <span>图片分享</span>
        </div>
        <div class="feature-item">
          <el-icon><Folder /></el-icon>
          <span>文件传输</span>
        </div>
        <div class="feature-item">
          <el-icon><VideoCamera /></el-icon>
          <span>视频通话</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ChatDotSquare,
  Plus,
  UserFilled,
  Message,
  Picture,
  Folder,
  VideoCamera
} from '@element-plus/icons-vue'

// Emits
defineEmits(['add-friend', 'create-group'])
</script>

<style lang="scss" scoped>
.chat-welcome {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;
  
  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.05) 0%, transparent 70%);
    animation: float 8s ease-in-out infinite;
  }
}

.welcome-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.welcome-icon {
  margin-bottom: 32px;
  color: var(--primary-color);
  
  .el-icon {
    opacity: 0.8;
  }
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, #5dade2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 40px 0;
  line-height: 1.6;
}

.welcome-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
  
  .el-button {
    border-radius: 12px;
    padding: 12px 24px;
    font-weight: 500;
    
    &.el-button--primary {
      background: linear-gradient(135deg, var(--primary-color) 0%, #5dade2 100%);
      border: none;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
      }
    }
    
    &:not(.el-button--primary) {
      border: 1px solid var(--border-light);
      
      &:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 32px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
  
  .el-icon {
    font-size: 24px;
    color: var(--primary-color);
  }
  
  span {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

// 动画
@keyframes float {
  0%, 100% {
    transform: rotate(0deg) translate(0px);
  }
  25% {
    transform: rotate(90deg) translate(10px);
  }
  50% {
    transform: rotate(180deg) translate(0px);
  }
  75% {
    transform: rotate(270deg) translate(-10px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .welcome-content {
    padding: 24px;
    margin: 20px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
  
  .features {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
