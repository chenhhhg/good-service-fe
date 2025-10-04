<template>
  <div v-loading="loading" class="detail-container">
    <el-card v-if="requestDetail">
      <!-- Part 1: Request Detail -->
      <template #header>
        <h1>{{ requestDetail.title }}</h1>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="服务类型">{{
          requestDetail.serviceType
        }}</el-descriptions-item>
        <el-descriptions-item label="发布者">{{
          requestDetail.user.username
        }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{
          new Date(requestDetail.createdAt).toLocaleString()
        }}</el-descriptions-item>
        <el-descriptions-item label="地域">{{
          regionStore.getRegionNameById(requestDetail.regionId)
        }}</el-descriptions-item>
      </el-descriptions>
      <p class="description-text">{{ requestDetail.description }}</p>
      <!-- TODO: Display images/videos -->

      <!-- Part 2: Action Buttons -->
      <div
        class="action-buttons"
        v-if="userStore.isLoggedIn && requestDetail.user.id !== userStore.userInfo?.id"
      >
        <el-button type="primary" @click="showResponseDialog = true">我服务</el-button>
      </div>

      <!-- Part 3: Response List (for owner) -->
      <div
        v-if="userStore.isLoggedIn && requestDetail.user.id === userStore.userInfo?.id"
        class="response-section"
      >
        <el-divider />
        <h2>收到的响应</h2>
        <el-table :data="responses" stripe>
          <el-table-column prop="user.name" label="响应者" />
          <el-table-column prop="description" label="响应描述" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <div v-if="row.status === 0">
                <!-- 待接受 -->
                <el-button size="small" type="success" @click="handleStatusUpdate(row.id, 1)"
                  >接受</el-button
                >
                <el-button size="small" type="danger" @click="handleStatusUpdate(row.id, 2)"
                  >拒绝</el-button
                >
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <el-empty v-else-if="!loading" description="服务请求不存在" />

    <!-- Part 4: Submit Response Dialog -->
    <el-dialog v-model="showResponseDialog" title="提交服务响应">
      <el-form
        ref="responseFormRef"
        :model="responseForm"
        :rules="responseRules"
        label-width="80px"
      >
        <el-form-item label="响应描述" prop="description">
          <el-input v-model="responseForm.description" type="textarea" rows="4" />
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
        <el-button @click="showResponseDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResponse">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { getServiceRequestById } from '@/api/request'
import {
  getResponsesByRequestId,
  createServiceResponse,
  updateResponseStatus,
} from '@/api/response'
import { useUserStore } from '@/store/user'
import { useRegionStore } from '@/store/region'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  id: { type: String, required: true },
})

const userStore = useUserStore()
const regionStore = useRegionStore()
const loading = ref(true)
const requestDetail = ref<any>(null)
const responses = ref<any[]>([])
const resCnt = ref()

const showResponseDialog = ref(false)
const responseFormRef = ref<FormInstance>()
const responseForm = reactive({
  requestId: parseInt(props.id, 10),
  description: '',
  imageFiles: '',
  videoFile: '',
})
const responseRules = reactive<FormRules>({
  description: [{ required: true, message: '请输入响应描述', trigger: 'blur' }],
})

const imageList = ref<UploadUserFile[]>([])
const videoList = ref<UploadUserFile[]>([])

const isOwner = computed(() => {
  if (!userStore.isLoggedIn || !requestDetail.value) return false
  return userStore.userInfo?.id === requestDetail.value.user.id
})

const statusText = (status: number) => ({ 0: '待接受', 1: '已同意', 2: '已拒绝' })[status] || '未知'
const statusTagType = (status: number) =>
  ({ 0: 'warning', 1: 'success', 2: 'danger' })[status] || 'info'

const fetchData = async () => {
  loading.value = true
  try {
    requestDetail.value = await getServiceRequestById(props.id)
    if (isOwner.value) {
      const res = await getResponsesByRequestId(props.id, {})
      resCnt.value = res.total
      responses.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const submitResponse = async () => {
  if (!responseFormRef.value) return
  await responseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const payload = { ...responseForm, userId: userStore.userInfo.id }
        await createServiceResponse(payload)
        ElMessage.success('响应成功！')
        showResponseDialog.value = false
        // Optionally, refetch data or update UI
      } catch (error) {
        ElMessage.error('响应失败')
      }
    }
  })
}

const handleStatusUpdate = async (responseId: number, status: number) => {
  const actionText = status === 1 ? '接受' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定要${actionText}这个服务响应吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await updateResponseStatus(responseId, { rId: requestDetail.value.id, ts: status })
    ElMessage.success('操作成功')
    const index = responses.value.findIndex((r) => r.id === responseId)
    if (index !== -1) {
      responses.value[index].status = status
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const resetResponseForm = () => {
  responseForm.description = ''
  responseForm.imageFiles = ''
  responseForm.videoFile = ''
  imageList.value = []
  videoList.value = []
}

const handleImageSuccess = (response: any) => {
  const currentImages = responseForm.imageFiles ? responseForm.imageFiles.split(',') : []
  currentImages.push(response.fileName)
  responseForm.imageFiles = currentImages.join(',')
}

const handleImageRemove = (file: any) => {
  const fileNameToRemove = file.response.fileName
  const currentImages = responseForm.imageFiles.split(',')
  responseForm.imageFiles = currentImages.filter((name) => name !== fileNameToRemove).join(',')
}

const handleVideoSuccess = (response: any) => {
  responseForm.videoFile = response.fileName
}

const handleVideoRemove = () => {
  responseForm.videoFile = ''
}

onMounted(() => {
  fetchData()
  regionStore.fetchRegionsIfNeeded()
})
</script>

<style scoped>
.description-text {
  margin-top: 20px;
  line-height: 1.6;
}
.action-buttons {
  margin-top: 20px;
  text-align: right;
}
.response-section {
  margin-top: 30px;
}
</style>
