<template>
  <el-container class="admin-layout-container">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/admin/stats">
          <el-icon><DataLine /></el-icon>
          <span>统计分析</span>
        </el-menu-item>
        <!-- Add more admin links here -->
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { DataLine } from '@element-plus/icons-vue'
</script>

<style scoped>
.admin-layout-container {
  height: calc(100vh - 61px); /* Full height minus header */
}
.el-aside {
  border-right: 1px solid #dcdfe6;
}
.el-menu {
  border-right: none;
}
</style>
