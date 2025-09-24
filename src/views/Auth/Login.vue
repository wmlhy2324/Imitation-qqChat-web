<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 头部logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <el-icon :size="40" class="logo-icon">
            <ChatDotSquare />
          </el-icon>
        </div>
        <h1 class="title">Easy Chat</h1>
        <p class="subtitle">欢迎回来，开始聊天吧</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="loginForm.phone"
            placeholder="请输入手机号"
            :prefix-icon="Phone"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </el-form>

      <!-- 底部链接 -->
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, toRefs, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotSquare, Phone, Lock, WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'

// 路由和store
const router = useRouter()
const userStore = useUserStore()

// 表单引用和数据
const loginFormRef = ref()
const isLoading = ref(false)
const errorMessage = ref('')

// 登录表单数据
const loginForm = reactive({
  phone: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号格式',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 清除之前的错误信息
    errorMessage.value = ''
    
    // 验证表单
    await loginFormRef.value.validate()
    
    isLoading.value = true
    
    // 调用store登录方法
    const result = await userStore.login(loginForm)
    
    if (result.success) {
      ElMessage.success('登录成功')
      
      // 等待下一个tick确保状态更新完成
      await nextTick()
      
      // 使用Vue Router进行跳转
      router.replace('/chat')
    } else {
      errorMessage.value = result.message || '登录失败，请重试'
    }
  } catch (error) {
    console.error('登录错误:', error)
    if (error?.errorFields) {
      // 表单验证错误，不显示全局错误
      return
    }
    errorMessage.value = '登录失败，请检查网络连接'
  } finally {
    isLoading.value = false
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 清除错误信息当输入改变时
const clearError = () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

// 监听输入变化
const { phone, password } = toRefs(loginForm)
watch([phone, password], clearError)
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 400px;
  max-width: 90vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo {
    margin-bottom: 16px;
    
    .logo-icon {
      color: var(--primary-color);
    }
  }
  
  .title {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .el-input {
    :deep(.el-input__wrapper) {
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--border-lighter);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--primary-color);
      }
      
      &.is-focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }
  }
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary-color) 0%, #5dade2 100%);
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.is-loading {
    transform: none;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger-color);
  font-size: 14px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: 8px;
  
  .el-icon {
    flex-shrink: 0;
  }
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  font-size: 14px;
  color: var(--text-secondary);
  
  .el-link {
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
  }
  
  .circle-1 {
    width: 120px;
    height: 120px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  .circle-2 {
    width: 80px;
    height: 80px;
    top: 70%;
    right: 10%;
    animation-delay: 2s;
  }
  
  .circle-3 {
    width: 60px;
    height: 60px;
    top: 30%;
    right: 20%;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-card {
    padding: 24px;
    width: 100%;
    margin: 20px;
    
    .login-header .title {
      font-size: 24px;
    }
  }
}
</style>