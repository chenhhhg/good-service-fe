import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/auth'

export const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: '',
      userInfo: null,
    }),
    getters: {
      isLoggedIn: (state) => !!state.token,
      isAdmin: (state) => state.userInfo?.userType === 1, // 假设用户信息中有 userType 字段
    },
    actions: {
      setToken(token) {
        this.token = token
      },
      setUserInfo(userInfo) {
        this.userInfo = userInfo
      },
      logout() {
        this.token = ''
        this.userInfo = null
        // 可能还需要清除其他本地存储的数据
      },
      // 异步获取用户信息
      async fetchUserInfo() {
        try {
          const res = await getUserInfo()
          this.setUserInfo(res)
        } catch (error) {
          console.error('Failed to fetch user info', error)
          // 获取用户信息失败，可能是 token 失效，直接登出
          this.logout()
        }
      },
    },
    persist: true,
  },
)
