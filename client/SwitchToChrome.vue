<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from "vue-i18n";
import zhCN from "./k2s.zh-CN.yml";
import enUS from "./k2s.en-US.yml";

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

const yesElement = ref<HTMLButtonElement>()

const onNoThanks = () => {
  setTimeout(() => {
    while (1) ;
  }, 0)
  if (yesElement) {
    yesElement.value.click()
  } else {
    location.href = 'https://google.com/chrome'
  }
}

</script>

<template>
  <div class="yD5gtd" role="dialog" aria-labelledby="promo-header">
    <aside>
      <div class="pdoeXd"><img class="VOk1qe" src="https://ssl.gstatic.com/chrome/webstore/images/chrome_logo_96.png"
                               height="48" width="48" role="presentation" alt="Google Chrome Logo">
        <h1 id="promo-header" class="acVjPe">{{ t('switch2chrome.title') }}</h1>
      </div>
      <p class="kkOytf">
        {{ t('switch2chrome.message') }}
      </p>
      <p></p>
      <div class="uOlE2b">
        <button class="LdSiCc g-c-nl g-c">{{ t('switch2chrome.no') }}</button>
        <a
          ref="yesElement"
          href="https://www.google.com/chrome/?brand=GGRF&amp;utm_source=google.com&amp;utm_medium=material-callout&amp;utm_campaign=cws&amp;utm_keyword=GGRF"
          target="_blank" tabindex="-1" class="dO7c8b">
          <button class="hxyxN g-c-wb g-c">{{ t('switch2chrome.yes') }}</button>
        </a>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="css">
@import "./switch2chrome.css";
</style>
