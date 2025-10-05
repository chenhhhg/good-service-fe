<template>
  <div class="home-container">
    <el-card>
      <div class="filter-container">
        <el-select
          v-model="filter.serviceType"
          placeholder="请选择服务类型"
          clearable
          @change="handleFilter"
        >
          <el-option v-for="type in serviceTypes" :key="type" :label="type" :value="type" />
        </el-select>
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
          v-model="filter.regionId"
          placeholder="请选择区域"
          clearable
          :disabled="!selectedCity"
          @change="handleFilter"
          style="margin-left: 10px"
        >
          <el-option v-for="(id, name) in districts" :key="id" :label="name" :value="id" />
        </el-select>
        <el-select
          v-model="filter.status"
          placeholder="请选择状态"
          clearable
          @change="handleFilter"
          style="margin-left: 10px"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div v-loading="listLoading" class="list-container">
        <el-row :gutter="20">
          <el-col :span="8" v-for="item in list" :key="item.id" class="list-item">
            <el-card shadow="hover" @click="goToDetail(item.id)">
              <template #header>
                <div class="card-header">
                  <span>{{ item.title }}</span>
                  <div>
                    <el-tag>{{ item.serviceType }}</el-tag>
                    <el-tag :type="statusTagType(item.status)" style="margin-left: 5px">
                      {{ statusText(item.status) }}
                    </el-tag>
                  </div>
                </div>
              </template>
              <div class="card-body">
                <p>{{ item.description }}</p>
                <div class="card-footer">
                  <span>发布者: {{ item.user?.username }}</span>
                  <span>{{ new Date(item.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="!list.length && !listLoading" description="暂无数据" />
      </div>

      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="filteredList.length"
        :page-size="pagination.size"
        :current-page="pagination.page"
        @current-change="handlePageChange"
        class="pagination-container"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getServiceRequests, getServiceTypes } from '@/api/request'
import { useRegionStore } from '@/store/region'

console.log('[AllRequests.vue] Setup script is running.')

const router = useRouter()
const regionStore = useRegionStore()

const sourceList = ref<any[]>([])
const serviceTypes = ref<string[]>([])
const listLoading = ref(true)

const filteredList = computed(() => {
  let items = sourceList.value

  // Filter by service type
  if (filter.serviceType) {
    items = items.filter((item) => item.serviceType === filter.serviceType)
  }

  // Filter by status
  if (filter.status !== null && filter.status !== '') {
    items = items.filter((item) => item.status === filter.status)
  }

  // Filter by region
  if (filter.regionId) {
    // A specific district is selected
    items = items.filter((item) => item.regionId === filter.regionId)
  } else if (selectedCity.value) {
    // A city is selected
    const cityIds = regionStore.getRegionIdsByCity(selectedProvince.value, selectedCity.value)
    const cityIdSet = new Set(cityIds)
    items = items.filter((item) => cityIdSet.has(item.regionId))
  } else if (selectedProvince.value) {
    // A province is selected
    const provinceIds = regionStore.getRegionIdsByProvince(selectedProvince.value)
    const provinceIdSet = new Set(provinceIds)
    items = items.filter((item) => provinceIdSet.has(item.regionId))
  }

  return items
})

const list = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredList.value.slice(start, end)
})

const pagination = reactive({
  page: 1,
  size: 9,
})

const filter = reactive({
  serviceType: '',
  regionId: null,
  status: null,
})

const selectedProvince = ref('')
const selectedCity = ref('')

const statusOptions = [
  { value: 0, label: '已发布' },
  { value: 1, label: '已完成' },
  { value: -1, label: '已取消' },
]

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

const fetchData = async () => {
  console.log('[AllRequests.vue] fetchData started.')
  listLoading.value = true
  try {
    const params: any = {
      page: 1,
      size: 10000, // Fetch all items
    }
    const res = await getServiceRequests(params)
    console.log('[AllRequests.vue] API response received:', res)
    sourceList.value = res.data || []
  } catch (error) {
    console.error('[AllRequests.vue] Failed to fetch service requests', error)
  } finally {
    listLoading.value = false
    console.log('[AllRequests.vue] fetchData finished.')
  }
}

const fetchServiceTypes = async () => {
  try {
    const res = await getServiceTypes()
    serviceTypes.value = res || []
  } catch (error) {
    console.error('Failed to fetch service types', error)
  }
}

const statusText = (status: number) => {
  switch (status) {
    case 0:
      return '已发布'
    case 1:
      return '已完成'
    case -1:
      return '已取消'
    default:
      return '未知'
  }
}

const statusTagType = (status: number) => {
  switch (status) {
    case 0:
      return 'success'
    case 1:
      return 'info'
    case -1:
      return 'warning'
    default:
      return 'info'
  }
}

const handleFilter = () => {
  pagination.page = 1
}

const handleProvinceChange = () => {
  selectedCity.value = ''
  filter.regionId = null
  pagination.page = 1
}

const handleCityChange = () => {
  filter.regionId = null
  pagination.page = 1
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

const goToDetail = (id: number) => {
  router.push(`/request/${id}`)
}

onMounted(() => {
  console.log('[AllRequests.vue] Component has been mounted.')
  fetchData()
  fetchServiceTypes()
  regionStore.fetchRegionsIfNeeded()
})
</script>

<style scoped>
.filter-container {
  display: flex;
  /* flex-wrap: wrap; */
  align-items: center;
  margin-bottom: 20px;
}
.list-item {
  margin-bottom: 20px;
  cursor: pointer;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-body p {
  color: #606266;
  font-size: 14px;
  min-height: 40px; /* Give a minimum height */
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
