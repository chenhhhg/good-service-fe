<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/Header.vue'

const route = useRoute()
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/register')
</script>

<template>
  <div class="app-wrapper">
    <AppHeader v-if="!isAuthRoute" />
    <div :class="{ 'main-content': !isAuthRoute }">
      <router-view />
    </div>
  </div>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family:
    'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.app-wrapper {
  min-height: 100vh;
}

.main-content {
  padding-top: 60px; /* Height of the fixed header */
  height: 100vh;
  box-sizing: border-box;
}
</style>
