import { Context } from '@koishijs/client'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-console'
import { watch, render, h } from 'vue'
import k2sBox from './k2sBox.vue'
import { hide, inject } from "./utils";


export default (ctx: Context) => {
  inject(ctx)
  hide(ctx)
}
