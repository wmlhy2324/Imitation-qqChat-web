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
    },
    children: [
      {
        path: '',
        name: 'ChatHome',
        component: () => import('@/views/Chat/ChatHome.vue'),
        meta: {
          title: '聊天首页'
        }
      },
      {
        path: 'conversation/:id',
        name: 'ChatConversation',
        component: () => import('@/views/Chat/ChatConversation.vue'),
        meta: {
          title: '对话'
        }
      }
    ]
  }
]