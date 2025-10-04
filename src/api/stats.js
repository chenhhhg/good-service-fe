import request from '@/utils/request'

// 获取月度统计数据
export function getMonthlyStats(params) {
  return request({
    url: '/admin/stats/monthly',
    method: 'get',
    params,
  })
}
