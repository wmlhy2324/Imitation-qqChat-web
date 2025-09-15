import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'

// 导入路由模块
import authRoutes from './modules/auth'
import chatRoutes from './modules/chat'
import socialRoutes from './modules/social'

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  // 认证相关路由
  ...authRoutes,
  // 聊天相关路由
  ...chatRoutes,
  // 社交相关路由
  ...socialRoutes,
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Common/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  // 需要认证的路由
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 认证页面（登录、注册）
  const isAuthPage = to.matched.some(record => record.meta.isAuthPage)

  if (requiresAuth && !isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login')
  } else if (isAuthPage && isAuthenticated) {
    // 已登录用户访问认证页面，跳转到聊天页面
    next('/chat')
  } else {
    next()
  }
})

// 路由后置守卫
router.afterEach((to) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Easy Chat` : 'Easy Chat'
})

export default router