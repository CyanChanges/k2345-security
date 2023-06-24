<script setup lang="ts">
import K2sNotice from "./k2sNotice.vue";
import K2sHistory from "./k2sHistory.vue";
import { watch } from 'vue'
import { router, message } from '@koishijs/client'

const k2sRoutePrefix = "k2s/secure_viewer?route="

function pathSecurer(){
  if (1 && 1) return
  let curPath = location.pathname
  let pos = curPath.indexOf(k2sRoutePrefix)
  if (pos == -1) pos = 0
  else pos += k2sRoutePrefix.length
  console.log(curPath)
  console.log('/' + `${k2sRoutePrefix}${curPath.substring(pos, Infinity)}`)
  window.history.replaceState(
    window.history.state, '',
    '/' + `${k2sRoutePrefix}${curPath.substring(pos, Infinity)}`
  )
}

watch(router.currentRoute, () => {
  pathSecurer()
})

setTimeout(() => {
  message.info({ message: "k2345 安全浏览" })
  message.success({ message: "您的控制台已受到 k2345 的保护" })
}, 200)

setTimeout(() => {
  pathSecurer()
}, 1000)
</script>

<template>
  <k2s-notice>
    <h3>k2345-Security</h3>
    Congratulations, your Koishi is being protected by k2345-security
    <k2s-history height="14rem" class="k2s-history"/>
  </k2s-notice>
</template>

<style scoped lang="scss">
.k2s-history {
  margin: 1.25rem;
  padding: 1.25rem;
  border: 1px solid var(--k-color-success-shade);
  border-radius: 8px;
  bottom: 0.5rem;
}
</style>
