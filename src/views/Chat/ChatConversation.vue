<template>
  <div class="conversation-view">
    <h2>会话详情</h2>
    <p>会话ID: {{ $route.params.id }}</p>
    <p>这里将显示具体的聊天内容</p>
  </div>
</template>

<script setup>
// 具体聊天会话页面，后续实现
</script>

<style lang="scss" scoped>
.conversation-view {
  padding: 20px;
  text-align: center;
}
</style>