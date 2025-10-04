<template>
  <el-card>
    <template #header> 我提供的服务 </template>

    <el-table v-loading="loading" :data="responses">
      <el-table-column prop="request.title" label="服务主题" />
      <el-table-column prop="description" label="我的响应" />
      <el-table-column prop="createTime" label="响应时间">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <div v-if="row.status === 0">
            <!-- 待接受 -->
            <el-button size="small" @click="openDialog(row)">修改</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog for editing -->
    <el-dialog v-model="dialogVisible" title="修改我的响应" width="50%">
      <el-form
        ref="responseFormRef"
        :model="responseForm"
        :rules="responseRules"
        label-width="80px"
      >
        <el-form-item label="响应描述" prop="description">
          <el-input v-model="responseForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            v-model:file-list="imageList"
            list-type="picture-card"
            multiple
            :on-success="handleImageSuccess"
            :on-remove="handleImageRemove"
            :http-request="handleUpload"
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
            :http-request="handleUpload"
            :before-upload="beforeVideoUpload"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
          <div class="el-upload__tip">视频大小不能超过 50MB</div>
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
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getResponsesByUserId, updateServiceResponse, deleteServiceResponse } from '@/api/response'
import { uploadFile, downloadFile } from '@/api/file'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  FormInstance,
  FormRules,
  UploadUserFile,
  UploadProps,
  UploadRequestOptions,
} from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const responses = ref<any[]>([])
const loading = ref(true)

const dialogVisible = ref(false)
const responseFormRef = ref<FormInstance>()
const responseForm = reactive({
  id: null,
  description: '',
  imageFiles: '',
  videoFile: '',
})
const responseRules = reactive<FormRules>({
  description: [{ required: true, message: '请输入响应描述', trigger: 'blur' }],
})

const imageList = ref<UploadUserFile[]>([])
const videoList = ref<UploadUserFile[]>([])

const blobUrls = ref<string[]>([])

const revokeBlobUrls = () => {
  blobUrls.value.forEach(URL.revokeObjectURL)
  blobUrls.value = []
}

watch(dialogVisible, (isVisible) => {
  if (!isVisible) {
    revokeBlobUrls()
  }
})

onUnmounted(revokeBlobUrls)

const statusText = (status: number) => ({ 0: '待接受', 1: '已同意', 2: '已拒绝' })[status] || '未知'
const statusTagType = (status: number) =>
  ({ 0: 'warning', 1: 'success', 2: 'danger' })[status] || 'info'

const fetchMyResponses = async () => {
  loading.value = true
  if (!userStore.userInfo?.id) {
    await userStore.fetchUserInfo()
  }
  try {
    const res = await getResponsesByUserId(userStore.userInfo.id, {})
    responses.value = res.data || []
  } catch (error) {
    ElMessage.error('获取我的服务列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  responseForm.id = null
  responseForm.description = ''
  responseForm.imageFiles = ''
  responseForm.videoFile = ''
  imageList.value = []
  videoList.value = []
  revokeBlobUrls()
}

const openDialog = async (data: any) => {
  resetForm()
  responseForm.id = data.id
  responseForm.description = data.description
  responseForm.imageFiles = data.imageFiles || ''
  responseForm.videoFile = data.videoFile || ''

  if (data.imageFiles) {
    const imageFiles = data.imageFiles.split(',').filter(Boolean)
    imageList.value = imageFiles.map((fileName: string) => ({
      name: fileName,
      url: '',
      status: 'uploading',
      percentage: 0,
      response: { fileName },
    }))

    imageList.value.forEach(async (file, index) => {
      try {
        const blob = await downloadFile(file.name)
        const url = URL.createObjectURL(blob)
        blobUrls.value.push(url)
        imageList.value[index] = { ...file, url, status: 'success', percentage: 100 }
      } catch (error) {
        console.error('Failed to load image:', file.name, error)
        imageList.value[index] = { ...file, status: 'fail' }
      }
    })
  }
  if (data.videoFile) {
    videoList.value = [
      {
        name: data.videoFile,
        url: '',
        status: 'uploading',
        percentage: 0,
        response: { fileName: data.videoFile },
      },
    ]

    try {
      const blob = await downloadFile(data.videoFile)
      const url = URL.createObjectURL(blob)
      blobUrls.value.push(url)
      videoList.value[0] = { ...videoList.value[0], url, status: 'success', percentage: 100 }
    } catch (error) {
      console.error('Failed to load video:', data.videoFile, error)
      videoList.value[0] = { ...videoList.value[0], status: 'fail' }
    }
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!responseFormRef.value) return
  await responseFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await updateServiceResponse(responseForm.id, responseForm)
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchMyResponses()
      } catch (error) {
        ElMessage.error('修改失败')
      }
    }
  })
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个响应吗？', '提示', {
      type: 'warning',
    })
    await deleteServiceResponse(id)
    ElMessage.success('删除成功')
    fetchMyResponses()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
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

const handleUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadFile(options.file)
    options.onSuccess(res)
  } catch (error) {
    options.onError(error as any)
  }
}

const handleImageSuccess = (response: any, file: any) => {
  file.response = response
  const currentImages = responseForm.imageFiles ? responseForm.imageFiles.split(',').filter(Boolean) : []
  currentImages.push(response.fileName)
  responseForm.imageFiles = currentImages.join(',')
}

const handleImageRemove = (file: any) => {
  const fileNameToRemove = file.response?.fileName
  if (fileNameToRemove) {
    if (file.url?.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }
    const currentImages = responseForm.imageFiles.split(',')
    responseForm.imageFiles = currentImages.filter((name) => name !== fileNameToRemove).join(',')
  }
}

const handleVideoSuccess = (response: any, file: any) => {
  file.response = response
  responseForm.videoFile = response.fileName
}

const handleVideoRemove = (file: any) => {
  if (file.url?.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }
  responseForm.videoFile = ''
}

onMounted(fetchMyResponses)
</script>
