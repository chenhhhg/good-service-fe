<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>我发布的需求</span>
        <el-button type="primary" @click="openDialog('create')">发布新需求</el-button>
      </div>
    </template>

    <el-table v-loading="loading" :data="requests">
      <el-table-column prop="title" label="主题" />
      <el-table-column prop="serviceType" label="类型" />
      <el-table-column label="地域">
        <template #default="{ row }">{{ regionStore.getRegionNameById(row.regionId) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="发布时间">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">{{
            row.status === 0 ? '已发布' : '已取消'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog('edit', row)">修改</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog for creating/editing -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%">
      <el-form ref="requestFormRef" :model="requestForm" :rules="requestRules" label-width="80px">
        <el-form-item label="主题" prop="title">
          <el-input v-model="requestForm.title" />
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-select v-model="requestForm.serviceType" placeholder="请选择服务类型">
            <el-option v-for="item in serviceTypes" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="地域" prop="regionId">
          <el-select
            v-model="selectedProvince"
            placeholder="请选择省份"
            clearable
            @change="selectedCity = ''"
          >
            <el-option v-for="prov in provinces" :key="prov" :label="prov" :value="prov" />
          </el-select>
          <el-select
            v-model="selectedCity"
            placeholder="请选择城市"
            clearable
            :disabled="!selectedProvince"
          >
            <el-option v-for="city in cities" :key="city" :label="city" :value="city" />
          </el-select>
          <el-select
            v-model="requestForm.regionId"
            placeholder="请选择区域"
            clearable
            :disabled="!selectedCity"
          >
            <el-option v-for="(id, name) in districts" :key="id" :label="name" :value="id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="requestForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            v-model:file-list="imageList"
            action="/api/files/upload"
            list-type="picture-card"
            multiple
            :on-success="handleImageSuccess"
            :on-remove="handleImageRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频">
          <el-upload
            v-model:file-list="videoList"
            action="/api/files/upload"
            :limit="1"
            :on-success="handleVideoSuccess"
            :on-remove="handleVideoRemove"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useRegionStore } from '@/store/region'
import {
  getServiceRequestsByUserId,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceTypes,
} from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const regionStore = useRegionStore()
const requests = ref<any[]>([])
const loading = ref(true)
const serviceTypes = ref<string[]>([])
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')

const dialogVisible = ref(false)
const dialogMode = ref('create')
const dialogTitle = computed(() => (dialogMode.value === 'create' ? '发布新需求' : '修改需求'))
const requestFormRef = ref<FormInstance>()
const requestForm = reactive({
  id: null,
  title: '',
  serviceType: '',
  regionId: null,
  description: '',
  imageFiles: '',
  videoFile: '',
})
const requestRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入主题', trigger: 'blur' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  regionId: [{ required: true, message: '请选择地域', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
})

const imageList = ref<UploadUserFile[]>([])
const videoList = ref<UploadUserFile[]>([])

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

const fetchServiceTypes = async () => {
  try {
    const types = await getServiceTypes()
    serviceTypes.value = types
  } catch (error) {
    ElMessage.error('获取服务类型失败')
  }
}

const fetchMyRequests = async () => {
  loading.value = true
  if (!userStore.userInfo?.id) {
    await userStore.fetchUserInfo()
  }
  try {
    const res = await getServiceRequestsByUserId(userStore.userInfo.id, {})
    requests.value = res.data || []
  } catch (error) {
    ElMessage.error('获取我的需求列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  requestForm.id = null
  requestForm.title = ''
  requestForm.serviceType = ''
  requestForm.regionId = null
  requestForm.description = ''
  selectedProvince.value = ''
  selectedCity.value = ''
  selectedDistrict.value = ''
  requestForm.imageFiles = ''
  requestForm.videoFile = ''
  imageList.value = []
  videoList.value = []
}

const openDialog = (mode: string, data?: any) => {
  resetForm()
  dialogMode.value = mode
  if (mode === 'edit' && data) {
    Object.assign(requestForm, data)
    const path = regionStore.getRegionPathById(data.regionId)
    if (path) {
      selectedProvince.value = path.province
      // A short delay to allow cities to be populated before setting the city
      setTimeout(() => {
        selectedCity.value = path.city
      }, 0)
    }

    if (data.imageFiles) {
      imageList.value = data.imageFiles.split(',').map((fileName: string) => ({
        name: fileName,
        url: `/api/files/download/${fileName}`,
        response: { fileName },
      }))
    }
    if (data.videoFile) {
      videoList.value = [
        {
          name: data.videoFile,
          url: `/api/files/download/${data.videoFile}`,
          response: { fileName: data.videoFile },
        },
      ]
    }
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!requestFormRef.value) return
  await requestFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogMode.value === 'create') {
          const payload = { ...requestForm, userId: userStore.userInfo.id }
          delete payload.id // No need to send null id
          await createServiceRequest(payload)
          ElMessage.success('发布成功')
        } else {
          await updateServiceRequest(requestForm.id, requestForm)
          ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        fetchMyRequests()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个需求吗？', '提示', {
      type: 'warning',
    })
    await deleteServiceRequest(id)
    ElMessage.success('删除成功')
    fetchMyRequests()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleImageSuccess = (response: any) => {
  const currentImages = requestForm.imageFiles ? requestForm.imageFiles.split(',') : []
  currentImages.push(response.fileName)
  requestForm.imageFiles = currentImages.join(',')
}

const handleImageRemove = (file: any) => {
  const fileNameToRemove = file.response.fileName
  const currentImages = requestForm.imageFiles.split(',')
  requestForm.imageFiles = currentImages.filter((name) => name !== fileNameToRemove).join(',')
}

const handleVideoSuccess = (response: any) => {
  requestForm.videoFile = response.fileName
}

const handleVideoRemove = () => {
  requestForm.videoFile = ''
}

onMounted(() => {
  fetchMyRequests()
  fetchServiceTypes()
  regionStore.fetchRegionsIfNeeded()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
