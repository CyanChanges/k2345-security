import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-console'
import { watch, render, h } from 'vue'
import k2sBox from './k2sBox.vue'
import { hide, patchEdge, inject, securityPatch } from "./utils";


export default (ctx: Context) => {
  console.log('load')
  hide(ctx)
  patchEdge(ctx)
  inject(ctx)
  securityPatch(ctx)
}
