<script setup lang="ts">
import type { k2sEvent } from '../shared'
import { reactive } from 'vue'
import { receive } from "@koishijs/client";
import { ElTimeline, ElTimelineItem, ElCard, ElScrollbar } from 'element-plus'

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

const props = defineProps({
  height: { type: String, default: '10rem' }
})

const activities = reactive<k2sEvent[]>([])

receive("k2345-defended", (data: k2sEvent) => {
  data.timestamp = data.timestamp ?? Date.now()
  activities.push(data)
  console.log(data)
})
</script>

<template>
  <el-scrollbar :max-height="props.height" class="k2s-sub">
    <el-timeline>
      <el-timeline-item
        center placement="top"
        v-for="(activity, index) in activities"
        :key="index"
        :timestamp="new Date(activity.timestamp).toString()">
        <el-card :body-style="{ padding: '10px', paddingLeft: '14px', paddingBottom: '14px' }">
          <h4>{{ activity.title ?? t('history.default-title') }}</h4>
          <p>
            {{ activity.message }}
          </p>
          <p>
            {{ t('history.analyze', [activity.hookedName, activity.registryName]) }}
          </p>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </el-scrollbar>
</template>

<style scoped lang="scss">
.k2s-sub {
  --el-text-color-secondary: var(--el-text-color-primary);
}
</style>
