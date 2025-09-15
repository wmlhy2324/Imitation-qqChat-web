<template>
  <div class="chat-layout">
    <router-view />
  </div>
</template>

<script setup>
// 聊天布局容器，现在先保持简单，后续可以扩展为完整的聊天界面
</script>

<style lang="scss" scoped>
.chat-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>