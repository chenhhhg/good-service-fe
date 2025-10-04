import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.userType === 'admin', // 假设用户信息中有 userType 字段
  },
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
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
})
