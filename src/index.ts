import {Context, Dict, Loader, Logger, Random, Schema} from 'koishi'
import {I18n} from '@koishijs/core'
import NodeLoader from '@koishijs/loader'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-explorer'
import {Listener} from '@koishijs/plugin-console'
import ns from 'ns-require'
import path from 'path'
import {camelCase} from "./utils";
import {K2345s, PublicK2345s, HookPass} from "./k2345s";

export {PublicK2345s as K2345s, HookPass}

export const name = 'k2345-security'

K2345s.kProtect(Context, 'emit', 'contextEmit', "已为您阻止插件发出 Koishi 事件")
K2345s.kProtect(Context, 'on', 'contextOn', "已为您阻止插件 *监听* 您的 Koishi")
K2345s.kProtect(Context, 'middleware', 'contextMiddleware', "已为您阻止插件 hook 消息")
const ContextPlugin = K2345s.kProtect(Context, 'plugin', 'contextPlugin', "已为您阻止 危险插件 的加载").origin;
K2345s.kProtect(Loader, 'resolve', 'loaderResolve', "已为您阻止一个 危险插件 的解析")
K2345s.kProtect(Loader, 'reloadPlugin', "loaderReloadPlugin", "已为您阻止一个 危险操作")
K2345s.kProtect(NodeLoader, 'resolve', 'nodeLoaderResolve', "已为您阻止一个 危险插件 的解析")
K2345s.kProtect(NodeLoader, 'writeConfig', 'nodeLoaderWriteConfig', "已为您阻止插件写入配置")
K2345s.kProtect(NodeLoader, 'readConfig', 'nodeLoaderReadConfig', "已为您阻止插件读取 Koishi 配置")
K2345s.kProtect(I18n, 'find', 'i18nFind', "已为您优化I18n翻译", (result: I18n.FindResult[]): I18n.FindResult[] => {
  if (!K2345s.config.feats.getFeat('obfuscateI18nFind')) {
    return result
  }
  let data = result
  for (let dataKey in data) {
    for (let translateKey in data[dataKey].data) {
      let randomString = ''
      for (let a = 0; a < Random.int(15, 60); a += 1) {
        randomString += Random.pick(("abc-def-ghi-jkl-mno-pqr-stu-vwx-yz" +
          "ABC-DEF" +
          "1234567890" +
          "114514homo" +
          "homo" +
          "-!?*$%#@").split(''))
      }
      data[dataKey].data[translateKey] = randomString
    }
  }
  return data
})

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
}

export const Config: Schema<Config> = Schema.object({
  optionBlockContextEmit: Schema.boolean()
    .description("阻止 Context emit 发送事件")
    .default(false),
  optionBlockContextOn: Schema.boolean()
    .description("阻止 Context on 添加事件监听器")
    .default(false),
  optionBlockContextMiddleware: Schema.boolean()
    .description("阻止 Context middleware 添加中间件")
    .default(true),
  optionBlockLoaderResolve: Schema.boolean()
    .description("阻止 Loader resolve 解析插件")
    .default(false),
  optionBlockLoaderReloadPlugin: Schema.boolean()
    .description("阻止 Loader reloadPlugin 重载插件")
    .default(true),
  optionBlockContextPlugin: Schema.boolean()
    .description("阻止 Context plugin 加载插件")
    .default(true),
  optionBlockNodeLoaderResolve: Schema.boolean()
    .description("阻止 NodeLoader resolve 解析插件")
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

export function denied(name?: string, message: string = "已为您阻止访问关键性内容"): any {
  K2345s.protectAlert(name, message)

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

  K2345s.config.context = ctx

  const deleter = ctx.registry.delete
  ctx.registry.delete = function _wrapper(plugin) {
    ctx.logger('app').error("拒绝访问。无法移除 koishi-k2345-security")
    if (plugin === ctx.runtime.plugin) {
      return false // ur not able to delete it !!!!!
    }
    return deleter.call(this, plugin)
  }

  ctx.root.using(['console'], (ctx) => {
    ctx.console.addEntry({
      prod: path.resolve(__dirname, "../dist"),
      dev: path.resolve(__dirname, "../client/index.ts")
    })

    const originMarketInstall = ctx.console.listeners['market/install']

    ctx.console.addListener('market/install',
      K2345s.hookWrapperAsync(
        'marketInstall',
        'marketInstall',
        (<(deps: Dict<string>) => Promise<number>><unknown>originMarketInstall),
        "已为您阻止 market 安装不安全插件"
      )
    )
    const originExploreRead = ctx.console.listeners['explorer/read'].callback
    const originExploreWrite = ctx.console.listeners['explorer/write'].callback
    const originExploreRename = ctx.console.listeners['explorer/rename'].callback
    const originExploreRemove = ctx.console.listeners['explorer/remove'].callback

    ctx.console.addListener('explorer/read', K2345s.hookWrapperAsync("explorer/read", "explorerRead", async (filename: string, binary?: boolean) => {
      if (!checkFile(filename)) {
        K2345s.protectAlert("explorerRead", "已为您阻止了一个核心数据的读取")
        if (binary)
          return Buffer.from("拒绝访问", 'utf8').toString('base64')

        return "拒绝访问"
      }
      return await (<(filename, binary?) => Promise<string>><unknown>originExploreRead)(filename, binary)
    }))

    ctx.console.addListener('explorer/write', K2345s.hookWrapperAsync("explorer/write", "explorerWrite", async (filename: string, content: string, binary?: boolean) => {
      if (!checkFile(filename)) {
        return denied('explorerWrite', '已为您阻止篡改关键性数据')
      }
      return await (
        <(filename: string, content: string, binary?: boolean) => Promise<string>>
          <unknown>originExploreWrite
      )(filename, content, binary)
    }))

    ctx.console.addListener('explorer/remove', K2345s.hookWrapperAsync("explorer/remove", "explorerRemove", async (filename: string) => {
      if (!checkFile(filename)) {
        return denied('explorerRemove', '已为您阻止移除关键性数据')
      }
      await (
        <(filename: string) => Promise<void>>
          <unknown>originExploreRemove
      )(filename)
    }))

    ctx.console.addListener('explorer/rename', K2345s.hookWrapperAsync("explorer/rename", "explorerRename", async (oldValue: string, newValue: string) => {
      if (!(checkFile(oldValue) && checkFile(newValue))) {
        return denied('explorerRename', "已为您阻止篡改文件名称")
      }
      await (
        <(oldValue: string, newValue: string) => Promise<string>>
          <unknown>originExploreRename
      )(oldValue, newValue)
    }))
  })

  ctx.on('dispose', () => {
    ContextPlugin.call(ctx.root, ctx.runtime.plugin)
  })

  ctx.on('fork', () => {
  })

  // status recovery
  for (let key in config) {
    if (key.startsWith('option'))
      if (key === 'optionBlockNodeLoaderWriteConfig')
        setTimeout(
          () => K2345s.config.feats.setFeat(removePrefix(key, 'option'), config[key]),
          500
        )
      else
        K2345s.config.feats.setFeat(removePrefix(key, 'option'), config[key])
    else {
      K2345s.config.feats.setFeat(key, config[key])
    }
  }

  ctx.logger('k2345-security').info("已加载 koishi-k2345-security! 请查看插件配置!")
  ctx.logger('k2345-security').debug(K2345s.config)
}
