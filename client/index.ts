import {Context, receive, message, store} from '@koishijs/client'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-console'
import {watch} from 'vue'
import {Random} from "koishi";

receive("k2345-defended", (data: { "message": string, "name": string }) => {
  message.success({duration: 10000, message: data.message,})
})


export default () => {
  message.success({duration: -1, message: "k2345 Security 正在保护你的 Koishi!"})
}
