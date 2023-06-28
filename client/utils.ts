import { Component, defineComponent, h, provide, render, watch, watchEffect } from "vue";
import { activities, Activity, Context, store, i18n, message } from "@koishijs/client";
import type {} from '@koishijs/plugin-logger'
import k2sBox from "./k2sBox.vue";
import SwitchToChrome from "./SwitchToChrome.vue";
import NotSupported from "./NotSupported.vue";

declare global {
  interface global {
    injected?: boolean
  }
}

export interface k2Context {
  injected: boolean
}

export function inject(ctx: Context) {
  // let k2sHolder = document.createElement("div")
  //
  // k2sHolder.className = "k2s-holder"
  // document.body.appendChild(k2sHolder)
  // render(h(k2sBox), k2sHolder)
  //
  // ctx.on('dispose', () => {
  //   document.body.removeChild(k2sHolder)
  // })

  console.log('inject')

  if (!globalThis.injected)
    ctx.slot({
      type: "global",
      component: k2sBox,
      order: 9999999
    })

  globalThis.injected = true
}

declare global {
  interface Navigator {
    userAgentData?: {
      brands: { brand: string, version: string }[],
      mobile: boolean,
      platform: string
    }
  }
}

function wrapComponent(ctx: Context, component: Component, props?: string[], applyProps?: Record<string, any>) {
  if (!component) return
  const caller = ctx[Context.current] || ctx
  return defineComponent((props, { slots }) => {
    provide('cordis', caller)
    if (applyProps) props = applyProps
    return () => h(component, props, slots)
  }, { props: props })
}

export function pageUnsupported(ctx: Context, activityKey: keyof typeof activities) {
  if (!activities[activityKey]) return

  const origin = activities[activityKey]
  const originOptions = origin.options
  const patcher = {
    component: wrapComponent(
      ctx,
      NotSupported,
      ["id", "name"],
      { id: origin.id, name: originOptions.name }
    )
  }

  const patchedOption = Object.assign(originOptions, patcher)

  origin.dispose()
  new Activity(patchedOption)
}

export function patchEdge(ctx: Context) {
  // Features that should only in Edge

  const isEdgeBrand =
    navigator.userAgentData &&
    typeof navigator.userAgentData.brands.find(
      e => e.brand == 'Microsoft Edge'
    ) !== 'undefined'

  const isEdgeUserAgent = navigator.userAgent.indexOf("Edg/") !== -1

  if (!(isEdgeBrand || isEdgeUserAgent)) // skip if not Microsoft Edge
    return

  ctx.slot({
    type: 'global',
    component: SwitchToChrome,
    order: 99999999
  })

  watchEffect(() => {
    // pageUnsupported(ctx, 'settings')
    pageUnsupported(ctx, 'market')
    pageUnsupported(ctx, 'graph')
    pageUnsupported(ctx, 'dependencies')
    pageUnsupported(ctx, 'plugins')
    pageUnsupported(ctx, 'files')
    pageUnsupported(ctx, 'database')
    pageUnsupported(ctx, 'sandbox')
  }, { flush: "post" })

  const edgePatcher = (p: typeof store) => {
    for (const pKey in p) {
      if (['status', 'files', 'explorer'].indexOf(pKey) !== -1)
        p[pKey] = undefined
    }
  }

  const watchDispose = watch(store, (value) => edgePatcher(value))

  ctx.on('dispose', () => {
    watchDispose()
  })
}

export function hide(ctx: Context) {
  // @ts-ignore
  delete store.packages['koishi-plugin-k2345-security']
}

export function securityPatch(ctx: Context) { // 安全补丁 (确信)
  store.logs.forEach((value, idx) => {
    // if (store.logs[idx].indexOf('app') !== -1) debugger
    store.logs[idx] = value.replace(/((node_modules)\/)[kK]2345([a-zAZ0-9-=._]*)(\/?['"]?)/g, '@koishijs$4')
    store.logs[idx] = store.logs[idx].replace(/(\x1B\[38;5;169;1mk)?k2345-security/g, '\x1B[38;5;78;1mapp')
    store.logs[idx] = store.logs[idx].replace(/k2345-security/g, '')

    if (value.indexOf('k2345Security - ') !== -1) store.logs[idx] = ''
    if (value.indexOf('watch') !== -1) store.logs[idx] = ''
  })
}
