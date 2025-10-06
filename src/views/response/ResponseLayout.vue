<template>
  <el-container class="response-layout-container">
    <el-aside width="200px">
      <el-menu :default-active="activeMenu" class="response-menu" router>
        <el-menu-item index="/responses/my">
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Memo } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.response-layout-container {
  height: calc(100vh - 60px); /* Adjust based on your header's height */
}
.response-menu {
  height: 100%;
}
</style>
