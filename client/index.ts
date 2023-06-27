import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-console'
import { watch, render, h } from 'vue'
import k2sBox from './k2sBox.vue'
import { patchEdge, hide, inject } from "./utils";


export default (ctx: Context) => {
  patchEdge(ctx)
  inject(ctx)
  hide(ctx)
}
