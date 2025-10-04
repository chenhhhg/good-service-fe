import request from '@/utils/request'

// 获取服务请求列表（分页、筛选）
export function getServiceRequests(params) {
  return request({
    url: '/requests',
    method: 'get',
    params,
  })
}

// 获取单个服务请求详情
export function getServiceRequestById(id) {
  return request({
    url: `/requests/${id}`,
    method: 'get',
  })
}

// 获取所有服务类型
export function getServiceTypes() {
  return request({
    url: '/requests/types',
    method: 'get',
  })
}

// 获取所有地域信息
export function getRegions() {
  return request({
    url: '/requests/regions',
    method: 'get',
  })
}

// 根据用户ID获取服务请求列表
export function getServiceRequestsByUserId(userId, params) {
  return request({
    url: `/requests/user/${userId}`,
    method: 'get',
    params,
  })
}

// 创建新的服务请求
export function createServiceRequest(data) {
  return request({
    url: '/requests',
    method: 'post',
    data,
  })
}

// 更新服务请求
export function updateServiceRequest(id, data) {
  return request({
    url: `/requests/${id}`,
    method: 'put',
    data,
  })
}

// 删除服务请求
export function deleteServiceRequest(id) {
  return request({
    url: `/requests/${id}`,
    method: 'delete',
  })
}
