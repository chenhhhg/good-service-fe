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

      <div class="media-section">
        <div v-if="mainImageInfo.length" class="image-gallery">
          <h3>图片资料</h3>
          <div class="image-list-container">
            <template v-for="img in mainImageInfo" :key="img.name">
              <div
                v-if="img.status === 'loading'"
                class="image-slot"
                style="width: 100px; height: 100px; margin-right: 10px"
              >
                <el-icon><Loading /></el-icon>
              </div>
              <el-image
                v-else
                :src="img.url"
                :preview-src-list="mainImageInfo.map((i) => i.url).filter(Boolean)"
                fit="cover"
                style="width: 100px; height: 100px; margin-right: 10px"
                :initial-index="200000"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </template>
          </div>
        </div>
        <div v-if="mainVideoInfo" class="video-player">
          <h3>视频资料</h3>
          <div
            v-if="mainVideoInfo.status === 'loading'"
            class="video-placeholder image-slot"
            style="width: 100%; max-width: 500px; height: 281px"
          >
            <el-icon><Loading /></el-icon>
          </div>
          <video
            v-else-if="mainVideoInfo.status === 'success'"
            :src="mainVideoInfo.url"
            controls
            style="width: 100%; max-width: 500px"
          ></video>
          <div
            v-else
            class="video-placeholder image-slot"
            style="width: 100%; max-width: 500px; height: 281px"
          >
            <el-icon><Picture /></el-icon>
          </div>
        </div>
      </div>

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
          <el-table-column label="图片">
            <template #default="{ row }">
              <div v-if="row.imageInfo && row.imageInfo.length > 0">
                <div
                  v-if="row.imageInfo[0].status === 'loading'"
                  class="image-slot"
                  style="width: 50px; height: 50px"
                >
                  <el-icon><Loading /></el-icon>
                </div>
                <el-image
                  v-else
                  :src="row.imageInfo[0].url"
                  :preview-src-list="row.imageInfo.map((i: any) => i.url).filter(Boolean)"
                  style="width: 50px; height: 50px"
                  fit="cover"
                  :initial-index="200000"
                >
                  <template #error>
                    <div class="image-slot">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <span v-else>无</span>
            </template>
          </el-table-column>
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
            list-type="picture-card"
            multiple
            :on-success="handleImageSuccess"
            :on-remove="handleImageRemove"
            :http-request="handleResponseImageUpload"
            :before-upload="beforeImageUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">单张图片大小不能超过 1MB</div>
        </el-form-item>
        <el-form-item label="视频">
          <el-upload
            v-model:file-list="videoList"
            :limit="1"
            :on-success="handleVideoSuccess"
            :on-remove="handleVideoRemove"
            :http-request="handleResponseVideoUpload"
            :before-upload="beforeVideoUpload"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
          <div class="el-upload__tip">视频大小不能超过 50MB</div>
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
import { ref, onMounted, computed, reactive, watch, onUnmounted } from 'vue'
import { getServiceRequestById } from '@/api/request'
import {
  getResponsesByRequestId,
  createServiceResponse,
  updateResponseStatus,
} from '@/api/response'
import { downloadFile, uploadFile } from '@/api/file'
import { useUserStore } from '@/store/user'
import { useRegionStore } from '@/store/region'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  FormInstance,
  FormRules,
  UploadUserFile,
  UploadRequestOptions,
  UploadProps,
} from 'element-plus'
import { Plus, Loading, Picture } from '@element-plus/icons-vue'

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

const mainImageInfo =
  ref<{ name: string; url: string; status: 'loading' | 'success' | 'fail' }[]>([])
const mainVideoInfo = ref<{
  name: string
  url: string
  status: 'loading' | 'success' | 'fail'
} | null>(null)

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
      const fetchedResponses = res.data || []

      // Clean up old blob urls before processing new ones
      responses.value.forEach((response) => {
        if (response.imageInfo) {
          response.imageInfo.forEach((img: any) => {
            if (img.url) URL.revokeObjectURL(img.url)
          })
        }
      })

      // Process new responses
      for (const response of fetchedResponses) {
        response.imageInfo = []
        if (response.imageFiles) {
          const imageFiles = response.imageFiles.split(',').filter(Boolean)
          response.imageInfo = imageFiles.map((fileName: string) => ({
            name: fileName,
            url: '',
            status: 'loading',
          }))

          response.imageInfo.forEach(async (img: any) => {
            try {
              const blob = await downloadFile(img.name)
              img.url = URL.createObjectURL(blob)
              img.status = 'success'
            } catch (error) {
              console.error(`Failed to download image ${img.name}`, error)
              img.status = 'fail'
            }
          })
        }
      }
      responses.value = fetchedResponses
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => requestDetail.value,
  async (newDetail) => {
    // Revoke previous blob URLs
    mainImageInfo.value.forEach((img) => {
      if (img.url) URL.revokeObjectURL(img.url)
    })
    if (mainVideoInfo.value?.url) {
      URL.revokeObjectURL(mainVideoInfo.value.url)
    }
    mainImageInfo.value = []
    mainVideoInfo.value = null

    if (newDetail) {
      if (newDetail.imageFiles) {
        const imageFiles = newDetail.imageFiles.split(',').filter(Boolean)
        mainImageInfo.value = imageFiles.map((fileName: string) => ({
          name: fileName,
          url: '',
          status: 'loading',
        }))

        mainImageInfo.value.forEach(async (img) => {
          try {
            const blob = await downloadFile(img.name)
            img.url = URL.createObjectURL(blob)
            img.status = 'success'
          } catch (error) {
            console.error(`Failed to download image ${img.name}`, error)
            img.status = 'fail'
          }
        })
      }

      if (newDetail.videoFile) {
        mainVideoInfo.value = {
          name: newDetail.videoFile,
          url: '',
          status: 'loading',
        }
        try {
          const blob = await downloadFile(newDetail.videoFile)
          mainVideoInfo.value.url = URL.createObjectURL(blob)
          mainVideoInfo.value.status = 'success'
        } catch (error) {
          console.error(`Failed to download video ${newDetail.videoFile}`, error)
          mainVideoInfo.value.status = 'fail'
        }
      }
    }
  },
  { deep: true },
)

onUnmounted(() => {
  mainImageInfo.value.forEach((img) => {
    if (img.url) URL.revokeObjectURL(img.url)
  })
  if (mainVideoInfo.value?.url) {
    URL.revokeObjectURL(mainVideoInfo.value.url)
  }
  responses.value.forEach((response) => {
    if (response.imageInfo) {
      response.imageInfo.forEach((img: any) => {
        if (img.url) URL.revokeObjectURL(img.url)
      })
    }
  })
})

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

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type.indexOf('image') < 0) {
    ElMessage.error('请上传图片文件')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 1) {
    ElMessage.error('图片大小不能超过 1MB!')
    return false
  }
  return true
}

const beforeVideoUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type.indexOf('video') < 0) {
    ElMessage.error('请上传视频文件')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 50) {
    ElMessage.error('视频大小不能超过 50MB!')
    return false
  }
  return true
}

const handleResponseImageUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadFile(options.file)
    options.onSuccess(res)
  } catch (error) {
    options.onError(error as any)
  }
}

const handleResponseVideoUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadFile(options.file)
    options.onSuccess(res)
  } catch (error) {
    options.onError(error as any)
  }
}

const resetResponseForm = () => {
  responseForm.description = ''
  responseForm.imageFiles = ''
  responseForm.videoFile = ''
  imageList.value = []
  videoList.value = []
}

const handleImageSuccess = (response: any, file: any) => {
  file.response = response
  const currentImages = responseForm.imageFiles ? responseForm.imageFiles.split(',') : []
  currentImages.push(response.fileName)
  responseForm.imageFiles = currentImages.join(',')
}

const handleImageRemove = (file: any) => {
  const fileNameToRemove = file.response?.fileName
  if (fileNameToRemove) {
    const currentImages = responseForm.imageFiles.split(',')
    responseForm.imageFiles = currentImages.filter((name) => name !== fileNameToRemove).join(',')
  }
}

const handleVideoSuccess = (response: any, file: any) => {
  file.response = response
  responseForm.videoFile = response.fileName
}

const handleVideoRemove = (file: any) => {
  responseForm.videoFile = ''
}

onMounted(() => {
  fetchData()
  regionStore.fetchRegionsIfNeeded()
})
</script>

<style scoped>
.media-section {
  margin-top: 20px;
}
.image-gallery,
.video-player {
  margin-bottom: 20px;
}
.image-list-container {
  display: flex;
  flex-wrap: wrap;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.image-slot .el-icon {
  font-size: 24px;
}
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
