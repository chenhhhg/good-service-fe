import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://47.93.170.211:8888/api', // API 的 base_url
  // baseURL: 'http://localhost:8080/api', // API 的 base_url
  timeout: 5000, // 请求超时时间
})
export const baseURL = service.defaults.baseURL

// request 拦截器
service.interceptors.request.use(
  (config) => {
    // Pinia store 必须在 Vue app 创建后才能使用，
    // 所以我们需要在拦截器函数内部获取 store 实例
    const userStore = useUserStore()
    if (userStore.isLoggedIn && userStore.token) {
      config.headers['Authorization'] = 'Bearer ' + userStore.token
    }
    return config
  },
  (error) => {
    console.log(error) // for debug
    return Promise.reject(error)
  },
)

// response 拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 假设后端接口返回的数据结构总是 { success: boolean, data: any, message: string }
    // 并且 code !== 200/201 等也算业务失败
    if (response.status >= 200 && response.status < 300) {
      return res
    } else {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000,
      })
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error) => {
    console.log('err' + error) // for debug
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      // 跳转到登录页，并携带当前页面路径作为重定向地址
      window.location.href = `/login?redirect=${window.location.pathname}`
      ElMessage.error('登录状态已过期，请重新登录')
      return Promise.reject(new Error('登录状态已过期，请重新登录'))
    }

    let message = '请求发生错误'
    if (error.response && error.response.data && error.response.data.message) {
      // 后端返回了具体的错误信息
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  },
)

export default service
