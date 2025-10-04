<template>
  <el-card>
    <template #header> 个人资料 </template>
    <div v-if="userStore.userInfo">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{
          userStore.userInfo.username
        }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ userStore.userInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userStore.userInfo.phone }}</el-descriptions-item>
        <el-descriptions-item label="简介">{{ userStore.userInfo.profile }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h3>修改资料</h3>
      <el-form
        ref="updateFormRef"
        :model="updateForm"
        :rules="updateRules"
        label-width="80px"
        style="max-width: 500px"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="updateForm.phone" />
        </el-form-item>
        <el-form-item label="简介" prop="profile">
          <el-input v-model="updateForm.profile" type="textarea" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="updateForm.password"
            type="password"
            placeholder="留空则不修改"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdate">更新资料</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { updateCurrentUser } from '@/api/user'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const updateFormRef = ref<FormInstance>()

const updateForm = reactive({
  phone: '',
  profile: '',
  password: '',
})

const updateRules = reactive<FormRules>({
  // Add validation rules if needed, e.g., for phone number format
})

const populateForm = () => {
  if (userStore.userInfo) {
    updateForm.phone = userStore.userInfo.phone
    updateForm.profile = userStore.userInfo.profile
  }
}

const handleUpdate = async () => {
  if (!updateFormRef.value) return
  await updateFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const dataToUpdate: any = {
          phone: updateForm.phone,
          profile: updateForm.profile,
        }
        if (updateForm.password) {
          dataToUpdate.password = updateForm.password
        }

        const res = await updateCurrentUser(dataToUpdate)
        userStore.setUserInfo(res) // Update user info in store
        ElMessage.success('更新成功')
        updateForm.password = '' // Clear password field after update
      } catch (error) {
        ElMessage.error('更新失败')
      }
    }
  })
}

onMounted(() => {
  // if userInfo is not loaded, fetch it
  if (!userStore.userInfo) {
    userStore.fetchUserInfo().then(() => {
      populateForm()
    })
  } else {
    populateForm()
  }
})
</script>
