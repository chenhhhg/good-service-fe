<template>
  <el-header class="main-header">
    <div class="header-content">
      <div class="logo-container">
        <router-link to="/">Good-Service</router-link>
      </div>
      <el-menu mode="horizontal" :router="true" :default-active="$route.path" class="main-nav">
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/requests/all">我需求</el-menu-item>
        <el-menu-item index="/responses/my">我服务</el-menu-item>
        <!-- You can add more navigation items here -->
      </el-menu>
      <div class="user-info-container">
        <div v-if="userStore.isLoggedIn">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              欢迎, {{ userStore.userInfo?.name || userStore.userInfo?.username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin"
                  >管理后台</el-dropdown-item
                >
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div v-else>
          <el-button text @click="router.push('/login')">登录</el-button>
          <el-button text @click="router.push('/register')">注册</el-button>
        </div>
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = (command: string | number | object) => {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #dcdfe6;
  padding: 0;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #ffffff;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px; /* Or your preferred max-width */
  padding: 0 20px;
}
.logo-container {
  font-size: 20px;
  font-weight: bold;
}
.logo-container a {
  text-decoration: none;
  color: var(--el-color-primary);
}
.main-nav {
  flex-grow: 1;
  border-bottom: none;
  margin-left: 20px;
}
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
