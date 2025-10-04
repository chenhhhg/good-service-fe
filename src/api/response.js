import request from '@/utils/request'

// 根据请求ID获取响应列表
export function getResponsesByRequestId(requestId, params) {
  return request({
    url: `/responses/request/${requestId}`,
    method: 'get',
    params,
  })
}

// 创建一个新的服务响应
export function createServiceResponse(data) {
  return request({
    url: '/responses',
    method: 'post',
    data,
  })
}

// 更新响应状态 (接受/拒绝)
export function updateResponseStatus(responseId, params) {
  return request({
    url: `/responses/${responseId}/status`,
    method: 'patch',
    params,
  })
}

// 根据用户ID获取响应列表
export function getResponsesByUserId(userId, params) {
  return request({
    url: `/responses/user/${userId}`,
    method: 'get',
    params,
  })
}

// 更新服务响应
export function updateServiceResponse(id, data) {
  return request({
    url: `/responses/${id}`,
    method: 'put',
    data,
  })
}

// 删除服务响应
export function deleteServiceResponse(id) {
  return request({
    url: `/responses/${id}`,
    method: 'delete',
  })
}
