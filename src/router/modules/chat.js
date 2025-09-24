// 聊天相关路由
export default [
  {
    path: '/chat',
    name: 'ChatLayout',
    component: () => import('@/views/Chat/ChatLayout.vue'),
    meta: {
      title: '聊天',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/chat-welcome',
    name: 'ChatWelcome',
    component: () => import('@/views/Chat/ChatHome.vue'),
    meta: {
      title: '聊天欢迎页',
      requiresAuth: true
    }
  }
]