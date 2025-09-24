<template>
  <div class="register-container">
    <div class="register-card">
      <!-- 头部logo和标题 -->
      <div class="register-header">
        <div class="logo">
          <el-icon :size="40" class="logo-icon">
            <ChatDotSquare />
          </el-icon>
        </div>
        <h1 class="title">创建账号</h1>
        <p class="subtitle">加入Easy Chat，开始你的聊天之旅</p>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        size="large"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="手机号"
            :prefix-icon="Phone"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="昵称"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="sex">
          <el-radio-group v-model="registerForm.sex" class="sex-radio-group">
            <el-radio :label="1" size="large">
              <el-icon><Male /></el-icon>
              <span>男</span>
            </el-radio>
            <el-radio :label="2" size="large">
              <el-icon><Female /></el-icon>
              <span>女</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="isLoading"
            @click="handleRegister"
          >
            {{ isLoading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </el-form>

      <!-- 底部链接 -->
      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goToLogin">立即登录</el-link>
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
import { ChatDotSquare, Phone, Lock, User, Male, Female, WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'

// 路由和store
const router = useRouter()
const userStore = useUserStore()

// 表单引用和数据
const registerFormRef = ref()
const isLoading = ref(false)
const errorMessage = ref('')

// 注册表单数据
const registerForm = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  sex: 1 // 默认男性
})

// 自定义验证器
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules = {
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
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
      message: '密码必须包含字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度2-20位', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/,
      message: '昵称只能包含中文、英文和数字',
      trigger: 'blur'
    }
  ],
  sex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 清除之前的错误信息
    errorMessage.value = ''
    
    // 验证表单
    await registerFormRef.value.validate()
    
    isLoading.value = true
    
    // 准备注册数据
    const registerData = {
      phone: registerForm.phone,
      password: registerForm.password,
      nickname: registerForm.nickname,
      sex: registerForm.sex
    }
    
    // 调用store注册方法
    const result = await userStore.register(registerData)
    
    if (result.success) {
      ElMessage.success('注册成功！正在为您登录...')
      // 强制跳转，避免路由守卫干扰
      await nextTick()
      // 使用window.location强制跳转
      window.location.href = '/chat'
    } else {
      errorMessage.value = result.message || '注册失败，请重试'
    }
  } catch (error) {
    console.error('注册错误:', error)
    if (error?.errorFields) {
      // 表单验证错误，不显示全局错误
      return
    }
    errorMessage.value = '注册失败，请检查网络连接'
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 清除错误信息当输入改变时
const clearError = () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

// 监听输入变化
const { phone, password, confirmPassword, nickname } = toRefs(registerForm)
watch([phone, password, confirmPassword, nickname], clearError)

// 当密码改变时，重新验证确认密码
watch(() => registerForm.password, () => {
  if (registerForm.confirmPassword && registerFormRef.value) {
    registerFormRef.value.validateField('confirmPassword')
  }
})
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px 0;
}

.register-card {
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

.register-header {
  text-align: center;
  margin-bottom: 32px;
  
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

.register-form {
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
  
  .sex-radio-group {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 40px;
    
    .el-radio {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 0;
      
      :deep(.el-radio__label) {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 16px;
      }
      
      .el-icon {
        font-size: 18px;
      }
    }
  }
}

.register-button {
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

.register-footer {
  text-align: center;
  margin-top: 24px;
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
    top: 15%;
    left: 15%;
    animation-delay: 0s;
  }
  
  .circle-2 {
    width: 80px;
    height: 80px;
    bottom: 20%;
    right: 15%;
    animation-delay: 2s;
  }
  
  .circle-3 {
    width: 60px;
    height: 60px;
    top: 40%;
    right: 25%;
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
  .register-container {
    padding: 10px 0;
  }
  
  .register-card {
    padding: 24px;
    width: 100%;
    margin: 10px;
    
    .register-header .title {
      font-size: 24px;
    }
    
    .sex-radio-group {
      gap: 30px;
    }
  }
}
</style>