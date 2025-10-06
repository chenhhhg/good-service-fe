<template>
  <el-card>
    <template #header>
      <h1>月度服务统计</h1>
    </template>

    <!-- Filter Section -->
    <div class="filter-container">
      <el-date-picker
        v-model="monthRange"
        type="monthrange"
        range-separator="至"
        start-placeholder="开始月份"
        end-placeholder="结束月份"
        value-format="YYYY-MM"
        @change="fetchStats"
      />

      <el-select
        v-model="selectedProvince"
        placeholder="请选择省份"
        clearable
        @change="handleProvinceChange"
        style="margin-left: 10px"
      >
        <el-option v-for="prov in provinces" :key="prov" :label="prov" :value="prov" />
      </el-select>
      <el-select
        v-model="selectedCity"
        placeholder="请选择城市"
        clearable
        :disabled="!selectedProvince"
        @change="handleCityChange"
        style="margin-left: 10px"
      >
        <el-option v-for="city in cities" :key="city" :label="city" :value="city" />
      </el-select>
      <el-select
        v-model="selectedRegion"
        placeholder="请选择区域"
        clearable
        :disabled="!selectedCity"
        @change="fetchStats"
        style="margin-left: 10px"
      >
        <el-option v-for="(id, name) in districts" :key="id" :label="name" :value="name" />
      </el-select>

      <el-checkbox
        v-model="onlySuccess"
        label="仅看成功"
        border
        @change="fetchStats"
        style="margin-left: 10px"
      />
    </div>

    <!-- Charts Section -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div ref="barChart" style="width: 100%; height: 400px"></div>
      </el-col>
      <el-col :span="12">
        <div ref="pieChart" style="width: 100%; height: 400px"></div>
      </el-col>
    </el-row>
    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <div ref="lineChart" style="width: 100%; height: 400px"></div>
      </el-col>
    </el-row>

    <!-- Table Section -->
    <el-table :data="stats" v-loading="loading" stripe style="margin-top: 20px">
      <el-table-column prop="month" label="月份" />
      <el-table-column label="地区">
        <template #default="{ row }">
          {{ row.region.provinceName }} - {{ row.region.cityName }} - {{ row.region.regionalName }}
        </template>
      </el-table-column>
      <el-table-column prop="serviceType" label="服务类型" />
      <el-table-column prop="requestCount" label="请求数" />
      <el-table-column prop="successCount" label="成功数" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { getMonthlyStats } from '@/api/stats'
import { useRegionStore } from '@/store/region'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const regionStore = useRegionStore()
const loading = ref(true)
const stats = ref<any[]>([])
const monthRange = ref<[string, string] | null>(null)
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedRegion = ref('')
const onlySuccess = ref(false)

const barChart = ref<HTMLElement | null>(null)
const pieChart = ref<HTMLElement | null>(null)
const lineChart = ref<HTMLElement | null>(null)

let myBarChart: echarts.ECharts | null = null
let myPieChart: echarts.ECharts | null = null
let myLineChart: echarts.ECharts | null = null

const provinces = computed(() => (regionStore.regions ? Object.keys(regionStore.regions) : []))
const cities = computed(() => {
  return selectedProvince.value && regionStore.regions
    ? Object.keys(regionStore.regions[selectedProvince.value])
    : []
})
const districts = computed(() => {
  return selectedProvince.value && selectedCity.value && regionStore.regions
    ? regionStore.regions[selectedProvince.value][selectedCity.value]
    : {}
})

const fetchStats = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (monthRange.value) {
      params.startMonth = monthRange.value[0]
      params.endMonth = monthRange.value[1]
    }
    if (selectedRegion.value) {
      params.region = selectedRegion.value
    } else if (selectedCity.value) {
      params.region = selectedCity.value
    } else if (selectedProvince.value) {
      params.region = selectedProvince.value
    }

    params.success = onlySuccess.value

    const data = await getMonthlyStats(params)
    stats.value = data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

const handleProvinceChange = () => {
  selectedCity.value = ''
  selectedRegion.value = ''
  fetchStats()
}

const handleCityChange = () => {
  selectedRegion.value = ''
  fetchStats()
}

const updateCharts = () => {
  if (!myBarChart || !myPieChart || !myLineChart) return

  // 1. Bar Chart: Aggregate by Service Type
  const byServiceType = stats.value.reduce((acc, curr) => {
    if (!acc[curr.serviceType]) {
      acc[curr.serviceType] = { requestCount: 0, successCount: 0 }
    }
    acc[curr.serviceType].requestCount += curr.requestCount
    acc[curr.serviceType].successCount += curr.successCount
    return acc
  }, {})
  const serviceTypes = Object.keys(byServiceType)
  myBarChart.setOption({
    title: { text: '按服务类型统计' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['请求数', '成功数'] },
    xAxis: { type: 'category', data: serviceTypes },
    yAxis: { type: 'value' },
    series: [
      { name: '请求数', type: 'bar', data: serviceTypes.map((t) => byServiceType[t].requestCount) },
      { name: '成功数', type: 'bar', data: serviceTypes.map((t) => byServiceType[t].successCount) },
    ],
  })

  // 2. Pie Chart: Aggregate by Region (Province or City)
  const byRegion = stats.value.reduce((acc, curr) => {
    const regionName = selectedProvince.value ? curr.region.cityName : curr.region.provinceName
    if (!acc[regionName]) {
      acc[regionName] = 0
    }
    acc[regionName] += curr.requestCount
    return acc
  }, {})
  myPieChart.setOption({
    title: { text: '按地区统计请求数' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '请求数',
        type: 'pie',
        radius: '50%',
        data: Object.keys(byRegion).map((name) => ({ value: byRegion[name], name })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  })

  // 3. Line Chart: Aggregate by Month
  const byMonth = stats.value.reduce((acc, curr) => {
    if (!acc[curr.month]) {
      acc[curr.month] = { requestCount: 0, successCount: 0 }
    }
    acc[curr.month].requestCount += curr.requestCount
    acc[curr.month].successCount += curr.successCount
    return acc
  }, {})
  const months = Object.keys(byMonth).sort()
  myLineChart.setOption({
    title: { text: '月度趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['请求数', '成功数'] },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      { name: '请求数', type: 'line', data: months.map((m) => byMonth[m].requestCount) },
      { name: '成功数', type: 'line', data: months.map((m) => byMonth[m].successCount) },
    ],
  })
}

onMounted(() => {
  nextTick(() => {
    if (barChart.value) myBarChart = echarts.init(barChart.value)
    if (pieChart.value) myPieChart = echarts.init(pieChart.value)
    if (lineChart.value) myLineChart = echarts.init(lineChart.value)
    regionStore.fetchRegionsIfNeeded()
    fetchStats()
  })
})

watch(stats, updateCharts, { deep: true })
</script>

<style scoped>
.filter-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
</style>
