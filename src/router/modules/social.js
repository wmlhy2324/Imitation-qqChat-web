// 社交相关路由
export default [
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('@/views/Social/Friends.vue'),
    meta: {
      title: '好友',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: () => import('@/views/Social/Groups.vue'),
    meta: {
      title: '群组',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/User/Profile.vue'),
    meta: {
      title: '个人资料',
      requiresAuth: true,
      keepAlive: false
    }
  }
]