// 认证相关路由
export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: {
      title: '登录',
      isAuthPage: true,
      keepAlive: false
    }
  },
  {
    path: '/register',
    name: 'Register', 
    component: () => import('@/views/Auth/Register.vue'),
    meta: {
      title: '注册',
      isAuthPage: true,
      keepAlive: false
    }
  }
]