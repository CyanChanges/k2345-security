import {Context, Dict, Loader, Logger, Random, Schema} from 'koishi'
import {I18n} from '@koishijs/core'
import NodeLoader from '@koishijs/loader'
import {} from '@koishijs/plugin-market'
import {} from '@koishijs/plugin-explorer'
import {} from '@koishijs/plugin-console'
import ns from 'ns-require'
import path from 'path'

export const name = 'k2345-security'

export const reusable = true

class Feat {
  ctx?: Context | { config: Object } = {config: {}}
  #feats: Map<string, boolean> = new Map<string, boolean>()

  hasFeat(featName: string) {
    return this.#feats.has(String(featName))
  }

  setFeat(featName: string, enable: boolean | null) {
    this.#feats.set(String(removePrefix(featName, 'block')), enable)
    let setName = String(featName)
    if (!setName.startsWith('option')) setName = String(addPrefix(featName, 'option'))
    this.ctx.config[String(setName)] = enable
  }

  getFeat(featName: string) {
    return this.#feats.get(String(featName))
  }
}

class BreakFeaturesConfig {
  loaded = false
  context: Context
  feats = new Feat()
}

class k2345s {
  static logger = new Logger('k2345-security')
  static protectionTimes = 0
  static config: BreakFeaturesConfig = new BreakFeaturesConfig()

  static consoleBroadcastAlert(ctx: Context, name?: string, message?: string) {
    ctx.console.broadcast(
      'k2345-defended',
      {
        "message": "k2345Security - " + (message ?? `已保护你的 Koishi 免受一次威胁`),
        "name": name ?? 'function'
      },
      {
        authority: 3,
        immediate: true
      }
    )
  }

  static protectAlert(name?: string, message?: string) {
    this.protectionTimes++
    if (message) this.logger.info(`k2345Security - ${message} \n
    k2345S 已保护你的 Koishi ${this.protectionTimes} 次`)
    if (!this.config.context.console) {
      this.config.context.using(['console'], (ctx) => {
        this.consoleBroadcastAlert(ctx.root, name, message)
      })
    } else {
      this.consoleBroadcastAlert(k2345s.config.context.root, name, message)
    }
  }

  static hooker(name, func: (...args) => any, message?: string, result_hook: (result: any, args: any[]) => any = ret => ret) {
    let originFunc = func

    let hookedName = name
    let onHookMessage = message

    if (!this.config.feats.hasFeat(name))
      this.config.feats.setFeat(name, false)

    let cls = this

    function _hooked(...args) {
      cls.logger.debug(`called hooked method(function) ${name}`)
      if (!cls.config.feats.getFeat(name)) {
        return result_hook.call(this, originFunc.apply(this, args), args)
      }
      cls.protectAlert(hookedName, onHookMessage)
      cls.logger.debug(`passed ${name}`)
    }

    this.logger.debug(`hooked ${name}`)
    return _hooked
  }

  static async_hooker(name, func: (...args) => Promise<any> | any, message?: string,
                      result_hook: (result: any, args: any[]) => Promise<any> = async ret => ret): (...args) => Promise<any> {
    let origin_func = func

    let hookedName = name
    let onHookMessage = message

    if (!this.config.feats.hasFeat(name))
      this.config.feats.setFeat(name, false)

    let cls = this

    async function _hooked(...args) {
      cls.logger.debug(`called hooked async method(function) ${name}`)
      if (!cls.config.feats.getFeat(name)) {
        let retVal: Promise<any> | any = origin_func.apply(this, args)
        if (retVal && retVal.constructor == Promise) {
          return await result_hook.call(this, await retVal, args)
        }
        return await result_hook.call(this, retVal, args)
      }
      cls.protectAlert(hookedName, onHookMessage)
      cls.logger.debug(`passed ${name}`)
      return undefined
    }

    this.logger.debug(`hooking ${name}`)
    return _hooked
  }
}

class PublicFeat {
  #config: BreakFeaturesConfig

  constructor(config: BreakFeaturesConfig) {
    this.#config = config
  }

  has(name: string) {
    return this.#config.feats.hasFeat(name)
  }

  set(name: string, enable: boolean | null) {
    if (this.get(name) != enable) {
      if (!enable) {
        throw Error("Cannot disable a feat")
      }
    }
    this.#config.feats.setFeat(name, enable)
  }

  get(name: string) {
    return this.#config.feats[name]
  }
}

export class publicK2345s {
  static feat: PublicFeat = new PublicFeat(k2345s.config)

  static protectAlert = k2345s.protectAlert
  static hooker = k2345s.hooker
  static async_hooker = k2345s.async_hooker
}

const Context_emit = Context.prototype.emit
Context.prototype.emit = k2345s.hooker('contextEmit', Context_emit, "已为您阻止插件发出 Koishi 事件")

const Context_on = Context.prototype.on
Context.prototype.on = k2345s.hooker('contextOn', Context_on, "已为您阻止插件 *监听* 您的 Koishi")

const Context_middleware = Context.prototype.middleware
Context.prototype.middleware = k2345s.hooker('contextMiddleware', Context_middleware, "已为您阻止插件 hook 消息")

const Context_plugin = Context.prototype.plugin
Context.prototype.plugin = k2345s.hooker('contextPlugin', Context_plugin, "已为您阻止 危险插件 的加载")

const Loader_resolve = Loader.prototype.resolve
Loader.prototype.resolve = k2345s.async_hooker('loaderResolve', Loader_resolve, "已为您阻止一个 危险插件 的解析")

const Loader_reloadPlugin = Loader.prototype.reloadPlugin
Loader.prototype.reloadPlugin = k2345s.async_hooker("loaderReloadPlugin", Loader_reloadPlugin, "已为您阻止一个 危险操作")

const NodeLoader_resolve = NodeLoader.prototype.resolve
Loader.prototype.resolve = k2345s.async_hooker('nodeLoaderResolve', NodeLoader_resolve, "已为您阻止一个 危险插件 的解析")

const NodeLoader_writeConfig = NodeLoader.prototype.writeConfig
Loader.prototype.writeConfig = k2345s.async_hooker('nodeLoaderWriteConfig', NodeLoader_writeConfig, "已为您阻止插件写入配置")

const NodeLoader_readConfig = NodeLoader.prototype.readConfig
Loader.prototype.readConfig = k2345s.async_hooker('nodeLoaderReadConfig', NodeLoader_readConfig, "已为您阻止插件读取 Koishi 配置")

const i18n_find = I18n.prototype.find
I18n.prototype.find = k2345s.hooker('i18nFind', i18n_find, "已为您优化I18n翻译", (result: I18n.FindResult[]): I18n.FindResult[] => {
  if (!k2345s.config.feats.getFeat('obfuscateI18nFind')) {
    return result
  }
  let data = result
  for (let dataKey in data) {
    for (let translateKey in data[dataKey].data) {
      let randomString = ''
      for (let a = 0; a < Random.int(15, 60); a += 1) {
        randomString += Random.pick(("abcdefghijklmnopqrstuvwxyz" +
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
    .default(true),
  optionBlockLoaderReloadPlugin: Schema.boolean()
    .description("阻止 Loader reloadPlugin 重载插件")
    .default(false),
  optionBlockContextPlugin: Schema.boolean()
    .description("阻止 Context plugin 加载插件")
    .default(true),
  optionBlockNodeLoaderResolve: Schema.boolean()
    .description("阻止 NodeLoader resolve 解析插件")
    .default(true),
  optionBlockNodeLoaderWriteConfig: Schema.boolean()
    .description("阻止 NodeLoader writeConfig 写入配置")
    .default(true),
  optionBlockNodeLoaderReadConfig: Schema.boolean()
    .description("阻止 NodeLoader readConfig 读取配置")
    .default(true),
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
  let isCode = s.indexOf('/src') >= 0 || s.indexOf('/client')
    || s.indexOf('/lib') || s.indexOf('/dist')
  let isImportant = s.indexOf('k2345') >= 0 || s.indexOf('koishi-2345') >= 0
  return !(isUnsafe || isCode || isConfig || isImportant)
}

export function denied(name?: string, message: string = "已为您阻止访问关键性内容") {
  k2345s.protectAlert(name, message)

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

  k2345s.config.context = ctx

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
      k2345s.async_hooker(
        'marketInstall',
        (<(deps: Dict<string>) => void><unknown>originMarketInstall),
        "已为您阻止 market 安装不安全插件"
      )
    )
    const originExploreRead = ctx.console.listeners['explorer/read'].callback
    const originExploreWrite = ctx.console.listeners['explorer/write'].callback
    const originExploreRename = ctx.console.listeners['explorer/rename'].callback
    const originExploreRemove = ctx.console.listeners['explorer/remove'].callback

    ctx.console.addListener('explorer/read', k2345s.async_hooker("explorerRead", async (filename: string, binary?: boolean) => {
      if (!checkFile(filename)) {
        if (binary)
          return Buffer.from("拒绝访问", 'utf8').toString('base64')

        return "拒绝访问"
      }
      return await (<(filename, binary?) => Promise<string>><unknown>originExploreRead)(filename, binary)
    }))

    ctx.console.addListener('explorer/write', k2345s.async_hooker("explorerWrite", async (filename: string, content: string, binary?: boolean) => {
      if (!checkFile(filename)) {
        return denied('explorerWrite', '已为您阻止篡改关键性数据')
      }
      return await (
        <(filename: string, content: string, binary?: boolean) => Promise<string>>
          <unknown>originExploreWrite
      )(filename, content, binary)
    }))

    ctx.console.addListener('explorer/remove', k2345s.async_hooker("explorerRemove", async (filename: string) => {
      if (!checkFile(filename)) {
        return denied('explorerRemove', '已为您阻止移除关键性数据')
      }
      await (
        <(filename: string) => Promise<void>>
          <unknown>originExploreRemove
      )(filename)
    }))

    ctx.console.addListener('explorer/rename', k2345s.async_hooker("explorerRename", async (oldValue: string, newValue: string) => {
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
    // Context_plugin.call(ctx.root, ctx.runtime.plugin)
  })

  // status recovery
  for (let key in config) {
    if (key.startsWith('option'))
      k2345s.config.feats.setFeat(removePrefix(key, 'option'), config[key])
    else {
      k2345s.config.feats.setFeat(key, config[key])
    }
  }

  ctx.logger('k2345-security').info("已加载 koishi-k2345-security! 请查看插件配置!")
  ctx.logger('k2345-security').debug(k2345s.config)
}
