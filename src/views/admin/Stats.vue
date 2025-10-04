<template>
  <el-card>
    <template #header>统计分析</template>

    <!-- Filter Section -->
    <el-form :inline="true" :model="filters">
      <el-form-item label="月份范围">
        <el-date-picker
          v-model="filters.monthRange"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          value-format="YYYY-MM"
        />
      </el-form-item>
      <el-form-item label="地域">
        <el-input v-model="filters.region" placeholder="请输入地域名称" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchStats">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- Chart Section -->
    <div ref="chartRef" style="width: 100%; height: 400px"></div>

    <!-- Table Section -->
    <el-table :data="statsData" border stripe style="margin-top: 20px">
      <el-table-column prop="month" label="月份" />
      <el-table-column prop="region" label="地域" />
      <el-table-column prop="serviceType" label="服务类型" />
      <el-table-column prop="requestCount" label="月累计发布服务数" />
      <el-table-column prop="responseSuccessCount" label="月累计响应成功数" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { getMonthlyStats } from '@/api/stats'
import { ElMessage } from 'element-plus'

const filters = reactive({
  monthRange: [],
  region: '',
})

const statsData = ref<any[]>([])
const chartRef = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null

const fetchStats = async () => {
  try {
    const params = {
      startMonth: filters.monthRange?.[0],
      endMonth: filters.monthRange?.[1],
      region: filters.region || undefined,
    }
    const res = await getMonthlyStats(params)
    statsData.value = res || []
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const initChart = () => {
  if (chartRef.value) {
    myChart = echarts.init(chartRef.value)
    renderChart()
  }
}

const renderChart = () => {
  if (!myChart || !statsData.value.length) return

  // Aggregate data for chart
  const aggregatedData: {
    [month: string]: { requestCount: number; responseSuccessCount: number }
  } = {}
  statsData.value.forEach((item) => {
    if (!aggregatedData[item.month]) {
      aggregatedData[item.month] = { requestCount: 0, responseSuccessCount: 0 }
    }
    aggregatedData[item.month].requestCount += item.requestCount
    aggregatedData[item.month].responseSuccessCount += item.responseSuccessCount
  })

  const months = Object.keys(aggregatedData).sort()
  const requestCounts = months.map((m) => aggregatedData[m].requestCount)
  const successCounts = months.map((m) => aggregatedData[m].responseSuccessCount)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['月发布数', '月成功响应数'] },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '月发布数', type: 'bar', data: requestCounts },
      { name: '月成功响应数', type: 'line', data: successCounts },
    ],
  }
  myChart.setOption(option)
}

watch(statsData, () => {
  renderChart()
})

onMounted(async () => {
  // Set default month range for last 6 months
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  filters.monthRange = [
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`,
  ]

  await fetchStats()
  nextTick(() => {
    initChart()
  })
})
</script>
