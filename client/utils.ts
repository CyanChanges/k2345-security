import { Component, defineComponent, h, provide, render, watch, watchEffect } from "vue";
import { activities, Activity, Context, store } from "@koishijs/client";
import k2sBox from "./k2sBox.vue";
import SwitchToChrome from "./SwitchToChrome.vue";
import NotSupported from "./NotSupported.vue";

export function inject(ctx: Context) {
  let k2sHolder = document.createElement("div")

  k2sHolder.className = "k2s-holder"
  document.body.appendChild(k2sHolder)
  render(h(k2sBox), k2sHolder)

  ctx.on('dispose', () => {
    document.body.removeChild(k2sHolder)
  })
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
  // Feature that should only in Edge

  const isEdgeBrand =
    navigator.userAgentData &&
    typeof navigator.userAgentData.brands.find(
      e => e.brand == 'Microsoft Edge'
    ) !== 'undefined'

  const isEdgeUserAgent = navigator.userAgent.indexOf("Edg/") !== -1

  if (!(isEdgeBrand || isEdgeUserAgent))
    return

  let switchToChrome = document.createElement("div")
  document.body.appendChild(switchToChrome)
  render(h(SwitchToChrome), switchToChrome)

  watchEffect(() => {
    pageUnsupported(ctx, 'settings')
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
      if (['status',].indexOf(pKey) !== -1)
        p[pKey] = undefined
    }
  }

  const watchDispose = watch(store, (value) => edgePatcher(value))

  ctx.on('dispose', () => {
    document.body.removeChild(switchToChrome)
    watchDispose()
  })
}

export function hide(ctx: Context) {
  // @ts-ignore
  delete store.packages['koishi-plugin-k2345-security']
}
