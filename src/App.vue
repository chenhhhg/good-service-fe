<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/Header.vue'

const route = useRoute()
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/register')
</script>

<template>
  <el-container class="app-container">
    <template v-if="!isAuthRoute">
      <AppHeader />
    </template>
    <el-main :class="{ 'content-with-header': !isAuthRoute }">
      <router-view />
    </el-main>
  </el-container>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family:
    'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.app-container {
  min-height: 100vh;
}

.el-main {
  padding: 20px;
}

.content-with-header {
  margin-top: 60px; /* Height of the fixed header */
}
</style>
