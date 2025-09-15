<template>
  <div class="chat-layout">
    <div class="welcome-container">
      <div class="welcome-content">
        <div class="welcome-icon">
          <el-icon :size="80">
            <ChatDotSquare />
          </el-icon>
        </div>
        <h1 class="welcome-title">欢迎来到 Easy Chat</h1>
        <p class="welcome-subtitle">开始你的聊天之旅吧！</p>
        <div class="user-info">
          <el-avatar :size="60" :src="userInfo?.avatar">
            {{ userInfo?.nickname?.charAt(0) }}
          </el-avatar>
          <div class="user-details">
            <h3>{{ userInfo?.nickname || '用户' }}</h3>
            <p>{{ userInfo?.mobile || '未知手机号' }}</p>
          </div>
        </div>
        <el-button type="primary" @click="logout">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotSquare } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.chat-layout {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.welcome-container {
  text-align: center;
  max-width: 500px;
  padding: 40px;
}

.welcome-content {
  background: white;
  border-radius: 16px;
  padding: 48px 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
  margin-bottom: 24px;
  color: var(--primary-color);
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px;
  background: var(--background-light);
  border-radius: 12px;
  
  .user-details {
    text-align: left;
    
    h3 {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}
</style>