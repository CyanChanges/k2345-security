import { h, render } from "vue";
import { Context, store } from "@koishijs/client";
import type { } from "@koishijs/plugin-market";
import type { } from "@koishijs/plugin-config";
import k2sBox from "./k2sBox.vue";

export function inject(ctx: Context) {
  let k2sHolder = document.createElement("div")

  k2sHolder.className = "k2s-holder"
  document.body.appendChild(k2sHolder)
  render(h(k2sBox), k2sHolder)

  ctx.on('dispose', ()=>{
    document.body.removeChild(k2sHolder)
  })
}

export function hide(ctx: Context) {
  delete store.packages['koishi-plugin-k2345-security']
}
