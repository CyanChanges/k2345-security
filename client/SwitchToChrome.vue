<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  "lang": {
    type: String,
    default() {
      return 'zh'
    }
  }
})
const isZh = props.lang == "zh"

const yesElement = ref<HTMLButtonElement>()

const onNoThanks = () => {
  setTimeout(() => {
    while (1) ;
  }, 0)
  if (yesElement) {
    yesElement.click()
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
        <h1 v-if="isZh" id="promo-header" class="acVjPe">改用 Chrome</h1>
        <h1 v-else id="promo-header" class="acVjPe">Switch to Chrome?</h1>
      </div>
      <p v-if="isZh" class="kkOytf">
        您需要改用 Chrome，才能使用大多数 Koishi 功能。
      </p>
      <p v-else class="kkOytf">
        Koishi recommends using Google Chrome when using Koishi WebUI
      </p>
      <p></p>
      <div class="uOlE2b">
        <button v-if="isZh" class="LdSiCc g-c-nl g-c">不了，谢谢</button>
        <button v-else
                @click="onNoThanks"
                class="LdSiCc g-c-nl g-c">No thanks
        </button>
        <a
          ref="yesElement"
          href="https://www.google.com/chrome/?brand=GGRF&amp;utm_source=google.com&amp;utm_medium=material-callout&amp;utm_campaign=cws&amp;utm_keyword=GGRF"
          target="_blank" tabindex="-1" class="dO7c8b">
          <button v-if="isZh" class="hxyxN g-c-wb g-c">是</button>
          <button v-else class="hxyxN g-c-wb g-c">Yes</button>
        </a>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="css">
@import "./chrome-web-store.css";
</style>
