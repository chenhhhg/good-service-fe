<template>
  <el-container class="request-layout-container">
    <el-aside width="200px">
      <el-menu
        :default-active="activeMenu"
        class="request-menu"
        router
      >
        <el-menu-item index="/requests/all">
          <el-icon><Tickets /></el-icon>
          <span>需求广场</span>
        </el-menu-item>
        <el-menu-item index="/requests/my">
          <el-icon><User /></el-icon>
          <span>我的发布</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Tickets, User } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.request-layout-container {
  height: calc(100vh - 60px); /* Adjust based on your header's height */
}
.request-menu {
  height: 100%;
}
</style>
