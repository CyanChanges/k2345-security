<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps({
  name: { type: String, default: () => "此页面" },
  id: { type: String, default: () => undefined }
})
</script>

<template>
  <div class="k-empty">
    <k-card>
      您的浏览器与 {{ props.name }}{{ props.id ? `(${props.id})` : ''}} 不兼容
    </k-card>
  </div>
</template>

<style scoped lang="scss">
.k-card {
  color: red
}
</style>
