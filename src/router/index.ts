import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Welcome.vue'),
    },
    // 我需求
    {
      path: '/requests',
      component: () => import('@/views/request/RequestLayout.vue'),
      children: [
        { path: '', redirect: '/requests/all' },
        {
          path: 'all',
          name: 'all-requests',
          component: () => import('@/views/request/AllRequests.vue'),
        },
        {
          path: 'my',
          name: 'my-requests',
          component: () => import('@/views/request/MyRequests.vue'),
          meta: { requiresAuth: true },
        },
      ],
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

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (requiresAuth) {
    if (isLoggedIn) {
      // 已登录
      if (userStore.userInfo) {
        // 有用户信息，检查管理员权限
        if (requiresAdmin && !userStore.isAdmin) {
          next({ name: 'home' }) // 或跳转到无权限页面
        } else {
          next()
        }
      } else {
        // 没有用户信息，尝试获取
        try {
          await userStore.fetchUserInfo()
          // 再次检查管理员权限
          if (requiresAdmin && !userStore.isAdmin) {
            next({ name: 'home' }) // 或跳转到无权限页面
          } else {
            next()
          }
        } catch (error) {
          // 获取用户信息失败，可能是 token 失效
          userStore.logout()
          next({ name: 'login', query: { redirect: to.fullPath } })
        }
      }
    } else {
      // 未登录
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    // 不需要认证的页面，直接放行
    next()
  }
})

export default router
