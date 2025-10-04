import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    // 认证
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/Register.vue'),
    },
    // 用户中心
    {
      path: '/user',
      component: () => import('@/views/user/UserLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/user/profile' },
        {
          path: 'profile',
          name: 'user-profile',
          component: () => import('@/views/user/Profile.vue'),
        },
        {
          path: 'requests',
          name: 'user-requests',
          component: () => import('@/views/user/MyRequests.vue'),
        },
        {
          path: 'responses',
          name: 'user-responses',
          component: () => import('@/views/user/MyResponses.vue'),
        },
      ],
    },
    // 管理员
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/stats' },
        { path: 'stats', name: 'admin-stats', component: () => import('@/views/admin/Stats.vue') },
        // ... 其他管理员页面
      ],
    },
    // 服务请求详情
    {
      path: '/request/:id',
      name: 'request-detail',
      component: () => import('@/views/ServiceRequestDetail.vue'),
      props: true,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (requiresAuth && !isLoggedIn) {
    // 需要认证但未登录
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !userStore.isAdmin) {
    // 需要管理员权限但当前用户不是
    // 这里可以跳转到一个 403 页面或首页
    next({ name: 'home' })
  } else {
    // 不需要权限或已满足权限要求
    next()
  }
})

export default router
