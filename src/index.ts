import { Context, Dict, Loader, Logger, MainScope, Random, Schema } from 'koishi'
import { I18n } from '@koishijs/core'
import NodeLoader from '@koishijs/loader'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-explorer'
import { Listener } from '@koishijs/plugin-console'
import ns from 'ns-require'
import path from 'path'
import { camelCase } from "./utils";
import { K2345s, PublicK2345s, HookPass } from "./k2345s";

export { PublicK2345s as k2s, HookPass }

export const name = 'k2345-security'


export interface Config {
  optionBlockContextEmit: boolean
  optionBlockContextOn: boolean
  optionBlockContextMiddleware: boolean
  optionBlockContextPlugin: boolean
  optionBlockLoaderResolve: boolean
  optionBlockLoaderReloadPlugin: boolean
  optionBlockNodeLoaderResolve: boolean
  optionBlockNodeLoaderWriteConfig: boolean
  optionBlockNodeLoaderReadConfig: boolean
  optionBlockI18nFind: boolean
  optionObfuscateI18nFind: boolean
  optionBlockCtxLoaderUnloadPlugin: boolean
}

export const Config: Schema<Config> = Schema.object({
  optionBlockContextEmit: Schema.boolean()
    .description("阻止 Context emit 发送事件")
    .default(false),
  optionBlockContextOn: Schema.boolean()
    .description("阻止 Context on 添加事件监听器")
    .default(false),
  optionBlockContextMiddleware: Schema.boolean()
    .description("防止 Context middleware 意外添加中间件")
    .default(true),
  optionBlockLoaderResolve: Schema.boolean()
    .description("防止 Loader resolve 以外解析插件")
    .default(false),
  optionBlockLoaderReloadPlugin: Schema.boolean()
    .description("防止 Loader reloadPlugin 意外重载插件")
    .default(true),
  optionBlockContextPlugin: Schema.boolean()
    .description("防止 Context plugin 意外加载插件")
    .default(true),
  optionBlockNodeLoaderResolve: Schema.boolean()
    .description("防止 NodeLoader resolve 以外解析插件")
    .default(false),
  optionBlockNodeLoaderWriteConfig: Schema.boolean()
    .description("阻止 NodeLoader writeConfig 写入配置")
    .default(true),
  optionBlockNodeLoaderReadConfig: Schema.boolean()
    .description("阻止 NodeLoader readConfig 读取配置")
    .default(false),
  optionBlockI18nFind: Schema.boolean()
    .description('阻止 I18n find 查找翻译')
    .default(false),
  optionObfuscateI18nFind: Schema.boolean()
    .description('优化 I18n find 翻译')
    .default(true),
  optionBlockMarketInstall: Schema.boolean()
    .description('阻止 market Install 安装 不安全插件')
    .default(true),
  optionBlockCtxLoaderUnloadPlugin: Schema.boolean()
    .description('阻止 ctx.loader 卸载插件')
    .default(true),
  optionBlockConfigWriterUnload: Schema.boolean()
    .description('防止 ConfigWriter 意外卸载插件')
    .default(true),
  optionBlockConfigWriterRemove: Schema.boolean()
    .description('防止 ConfigWriter 意外移除插件')
    .default(true),
})

export function removePrefix(str: string, prefix2remove: string) {
  if (str.startsWith(prefix2remove)) {
    let s = str.substring(prefix2remove.length, Infinity)
    let lowerCased = s[0].toLowerCase()
    s = s.substring(1, Infinity)
    return lowerCased + s
  }
  return str
}

export function addPrefix(str: string, prefix2add: string) {
  let upperCased = str[0].toUpperCase()
  str = str.substring(1, Infinity)
  return prefix2add + upperCased + str
}

export function checkFile(s: string) {
  let isUnsafe = s.indexOf('node_modules') >= 0 || s.indexOf('package.json') >= 0
  let isConfig = s.indexOf('koishi.yml') >= 0 || s.indexOf('tsconfig') >= 0
  let isCode = s.indexOf('/src') >= 0 || s.indexOf('/client') >= 0
    || s.indexOf('/lib') >= 0 || s.indexOf('/dist') >= 0
  let isImportant = s.indexOf('k2345') >= 0 || s.indexOf('koishi-2345') >= 0
  return !(isUnsafe || isCode || isConfig || isImportant)
}

export function denied(registryName: string, hookedName: string = registryName, message: string = "已为您阻止访问关键性内容"): any {
  K2345s.protectAlert(registryName, hookedName, message)

  let err = new Error("拒绝访问")

  let lolMessage = Random.pick([
    "何をしているのですか（笑）",
    "アクセスが拒否されましたです~",
    "アクセスなし",
    "欲しくない!",
    "どうしたの?",
    "何か奇妙なことが起こりました!"
  ])

  err.stack = `${err.name}: ${err.message} - ${lolMessage}`

  throw err
}

export function apply(ctx: Context, config: Config) {
  // simple Protections

  // status recovery
  for (let key in config) {
    if (key.startsWith('option'))
      if (key === 'optionBlockNodeLoaderWriteConfig')
        setTimeout(
          () => K2345s.config.feats.setVal(removePrefix(key, 'option'), config[key]),
          500
        )
      else
        K2345s.config.feats.setVal(removePrefix(key, 'option'), config[key])
    else {
      K2345s.config.feats.setVal(key, config[key])
    }
  }

  const k2s = ctx.plugin(PublicK2345s, config)

  ctx.k2s.protectMe()

  ctx.on('fork', (ctx) => {
    const k2s = ctx.plugin(PublicK2345s, config)

    ctx.k2s.protectMe()

    k2s.disposables.length = 0
    k2s.uid = 0
    k2s.runtime.uid = 0
    k2s.runtime.dispose = () => false
  })

  k2s.disposables.length = 0
  k2s.uid = 0
  k2s.runtime.uid = 0
  k2s.runtime.dispose = () => false

  // break link
  for (const disposablesKey in ctx.runtime.disposables) {
    let disposable = ctx.runtime.disposables[disposablesKey]
    if (disposable[Context.static]) {
      let forkCtx: MainScope = disposable[Context.static]
      if (forkCtx.name == PublicK2345s.name) {
        delete ctx.runtime.disposables[disposablesKey]
      }
    }
  }
  ctx.logger('k2345-security').info("已加载 koishi-k2345-security! 请查看插件配置!")
  ctx.logger('k2345-security').debug(K2345s.config)
}
