<script setup lang="ts">
import K2sNotice from "./k2sNotice.vue";
import K2sHistory from "./k2sHistory.vue";

import { watch, watchEffect } from 'vue'
import { i18n, message, root } from '@koishijs/client'
import { useI18n } from "vue-i18n";
import { k2Context } from './utils'

import zhCN from "./k2s.zh-CN.yml";
import enUS from "./k2s.en-US.yml";

declare module '@koishijs/client' {
  interface Context {
    k2s?: k2Context
  }
}


if (!root.k2s) {
  root.k2s = { injected: false }
}

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('./k2s.zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('./k2s.en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
}

watchEffect(() => {
  if (root.k2s && !root.k2s.injected) {
    setTimeout(() => {
      message.info({
        message: t('messages.protect-under', [t('messages.safe-browsing')])
      })
      message.success({ message: t('messages.protection-notice') })
    })

    root.k2s.injected = true
  }
}, { "flush": 'post' })

</script>

<template>
  <k2s-notice>
    <h3>k2345-Security</h3>
    {{ t('box.notice', [t('name')]) }}
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
