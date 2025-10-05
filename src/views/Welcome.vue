<template>
  <div class="welcome-container">
    <el-card>
      <template #header>
        <h1>欢迎使用 "好服务" 平台</h1>
      </template>
      <div class="content">
        <p>在这里，您可以轻松发布您的服务需求，或者响应他人的需求来提供帮助。</p>
        <p>我们的目标是构建一个互帮互助、高效便捷的社区服务平台。</p>
        <div class="actions">
          <el-button type="primary" size="large" @click="goToRequests">浏览需求广场</el-button>
          <el-button v-if="!userStore.isLoggedIn" type="success" size="large" @click="goToLogin">登录/注册</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user';

const router = useRouter()
const userStore = useUserStore()

const goToRequests = () => {
  router.push('/requests/all')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.welcome-container {
  padding: 40px;
  max-width: 800px;
  margin: 40px auto;
}
.content {
  line-height: 1.8;
  font-size: 16px;
  text-align: center;
}
.actions {
  margin-top: 40px;
}
p {
  margin-bottom: 20px;
}
</style>
