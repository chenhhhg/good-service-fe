import request from '@/utils/request'

export function getMonthlyStats(params) {
  return request({
    url: '/admin/stats/monthly',
    method: 'get',
    params,
  })
}
