import request from '@/utils/request'

// 更新当前用户信息
export function updateCurrentUser(data) {
  return request({
    url: '/users/me',
    method: 'put',
    data,
  })
}
