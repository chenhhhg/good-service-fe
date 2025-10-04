<template>
  <el-container class="user-center-container">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/user/profile">
          <el-icon><User /></el-icon>
          <span>我的资料</span>
        </el-menu-item>
        <el-menu-item index="/user/requests">
          <el-icon><Document /></el-icon>
          <span>我的需求</span>
        </el-menu-item>
        <el-menu-item index="/user/responses">
          <el-icon><Memo /></el-icon>
          <span>我的服务</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { User, Document, Memo } from '@element-plus/icons-vue'
</script>

<style scoped>
.user-center-container {
  height: calc(100vh - 61px); /* Full height minus header */
}
.el-aside {
  border-right: 1px solid #dcdfe6;
}
.el-menu {
  border-right: none;
}
</style>
