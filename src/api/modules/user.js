import request from '@/utils/request'

// 用户相关API
export const userApi = {
  // 用户登录
  login: (credentials) => {
    return request.post('/v1/user/login', {
      phone: credentials.phone,
      password: credentials.password
    })
  },

  // 用户注册
  register: (userData) => {
    return request.post('/v1/user/register', {
      phone: userData.phone,
      password: userData.password,
      nickname: userData.nickname,
      sex: userData.sex || 1, // 1:男 2:女
      avatar: userData.avatar || ''
    })
  },

  // 获取用户信息
  getUserInfo: () => {
    return request.get('/v1/user/user')
  },

  // 更新用户信息
  updateUserInfo: (userData) => {
    return request.put('/v1/user/user', userData)
  },

  // 上传头像
  uploadAvatar: (formData) => {
    return request.post('/v1/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}