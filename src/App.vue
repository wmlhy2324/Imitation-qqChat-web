<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/modules/user'

// 应用初始化
const userStore = useUserStore()

onMounted(() => {
  // 初始化用户状态
  userStore.initUserState()
})
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100vw;
}
</style>