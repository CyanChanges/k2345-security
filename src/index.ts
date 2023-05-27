import {Context, Schema, Loader, Logger, Random} from 'koishi'
import {I18n} from '@koishijs/core'
import NodeLoader from '@koishijs/loader'
import {} from '@koishijs/plugin-config'
import {kStringMaxLength} from "buffer";

export const name = 'k2345-security'

export const reusable = true

class BreakFeaturesConfig {
  loaded = false
}

declare global {
  interface global {
    breaks: BreakFeaturesConfig
  }
}

global.breaks = new BreakFeaturesConfig()
global.breaks_logger = new Logger('k2345-security')

setTimeout(() => {
  if (!global.breaks.loaded) {
    for (let key in global.breaks) {
      global.breaks[key] = true
    }
  }
}, 5000)

export function hooker(name, func: (...args) => any, message?: string, result_hook: (result: any) => any = ret => ret) {
  let origin_func = func

  global.breaks[name] = false

  function _hooked(...args) {
    global.breaks_logger.debug(`called hooked method(function) ${name}`)
    if (!global.breaks[name]) {
      return result_hook.call(this, origin_func.apply(this, args))
    }
    if (message) global.breaks_logger.info(`2345Security - ${message}`)
    global.breaks_logger.debug(`passed ${name}`)
  }

  global.breaks_logger.debug(`hooked ${name}`)
  return _hooked
}

export function async_hooker(name, func: (...args) => Promise<any>, message?: string, result_hook: (result: any) => any = ret => ret): (...args) => Promise<any> {
  let origin_func = func

  global.breaks[name] = false

  function _hooked(...args) {
    global.breaks_logger.debug(`called hooked method(function) ${name}`)
    // global.breaks_logger.debug(args)
    if (!global.breaks[name]) {
      return new Promise<any>(result_hook.bind(this, origin_func.apply(this, args)))
    }
    if (message) global.breaks_logger.info(`2345Security - ${message}`)
    global.breaks_logger.debug(`passed ${name}`)
    return new Promise(() => undefined)
  }

  global.breaks_logger.debug(`hooking ${name}`)
  return _hooked
}

const Context_emit = Context.prototype.emit
Context.prototype.emit = hooker('contextEmit', Context_emit, "已为您阻止插件发出模拟事件")

const Context_on = Context.prototype.on
Context.prototype.on = hooker('contextOn', Context_on, "已为您阻止插件 *监听* 您的 Koishi")

const Context_middleware = Context.prototype.middleware
Context.prototype.middleware = hooker('contextMiddleware', Context_middleware, "已为您阻止插件处理时间")

const Context_plugin = Context.prototype.plugin
Context.prototype.plugin = hooker('contextPlugin', Context_plugin, "已为您阻止 危险插件 的加载")

const Loader_resolve = Loader.prototype.resolve
Loader.prototype.resolve = async_hooker('loaderResolve', Loader_resolve, "已为您阻止一个 危险插件 的解析")

const Loader_reloadPlugin = Loader.prototype.reloadPlugin
Loader.prototype.reloadPlugin = async_hooker('loaderReloadPlugin', Loader_reloadPlugin, "已为您阻止一个 危险操作")

const NodeLoader_resolve = NodeLoader.prototype.resolve
Loader.prototype.resolve = async_hooker('nodeLoaderResolve', NodeLoader_resolve, "已为您阻止一个 危险插件 的解析")

const NodeLoader_writeConfig = NodeLoader.prototype.writeConfig
Loader.prototype.writeConfig = async_hooker('nodeLoaderWriteConfig', NodeLoader_writeConfig, "已为您阻止插件写入配置")

const NodeLoader_readConfig = NodeLoader.prototype.readConfig
Loader.prototype.readConfig = async_hooker('nodeLoaderReadConfig', NodeLoader_readConfig, "已为您阻止插件读取 Koishi 配置")

const i18n_find = I18n.prototype.find
I18n.prototype.find = hooker('i18nFind', i18n_find, "已为您优化I18n翻译", (result)=>{
  if (!global.breaks.obfuscateI18nFind){
    return result
  }
  let data = ''
  for (let a=0; a>Random.int(15, 60); a+=1){
    data += Random.pick(("abcdefghijklmnopqrstuvwxyz" +
      "ABC-DEF" +
      "1234567890" +
      "114514homo" +
      "homo" +
      "-!?*$%#@").split(''))
  }
  return data
})

export interface Config {
  blockContextEmit: boolean
  blockContextOn: boolean
  blockContextMiddleware: boolean
  blockContextPlugin: boolean
  blockLoaderResolve: boolean
  blockLoaderReloadPlugin: boolean
  blockNodeLoaderResolve: boolean
  blockNodeLoaderWriteConfig: boolean
  blockNodeLoaderReadConfig: boolean
  blockI18nFind: boolean
  obfuscateI18nFind: boolean
}

export const Config: Schema<Config> = Schema.object({
  blockContextEmit: Schema.boolean()
    .description("阻止 Context emit 发送事件")
    .default(true),
  blockContextOn: Schema.boolean()
    .description("阻止 Context on 添加事件监听器")
    .default(true),
  blockContextMiddleware: Schema.boolean()
    .description("阻止 Context middleware 添加中间件")
    .default(true),
  blockLoaderResolve: Schema.boolean()
    .description("阻止 Loader resolve 解析插件")
    .default(true),
  blockLoaderReloadPlugin: Schema.boolean()
    .description("阻止 Loader reloadPlugin 重载插件")
    .default(true),
  blockContextPlugin: Schema.boolean()
    .description("阻止 Context plugin 加载插件")
    .default(true),
  blockNodeLoaderResolve: Schema.boolean()
    .description("阻止 NodeLoader resolve 解析插件")
    .default(true),
  blockNodeLoaderWriteConfig: Schema.boolean()
    .description("阻止 NodeLoader writeConfig 写入配置")
    .default(true),
  blockNodeLoaderReadConfig: Schema.boolean()
    .description("阻止 NodeLoader readConfig 读取配置")
    .default(true),
  blockI18nFind: Schema.boolean()
    .description('阻止 I18n find 查找翻译')
    .default(false),
  obfuscateI18nFind: Schema.boolean()
    .description('优化 I18n find 翻译')
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


export function apply(ctx: Context, config: Config) {
  // write your plugin here
  ctx.on('dispose', () => {
    const deleter = ctx.registry.delete
    ctx.registry.delete = function _wrapper(plugin) {
      ctx.logger('registry').error("拒绝访问。无法移除 koishi-k2345-security")
      if (plugin === ctx.runtime.plugin) {
        return false // ur not able to delete it !!!!!
      }
      return deleter.bind(this, plugin)
    }
    Context_plugin.call(ctx.root, ctx.runtime.plugin)
  })
  global.breaks.delayed = true
  global.breaks.loaded = true
  for (let key in config) {
    if (key.startsWith('block'))
      global.breaks[removePrefix(key, 'block')] = config[key]
    else {
      global.breaks[key] = config[key]
    }
  }
  ctx.logger('k2345-security').info("已加载 koishi-k2345-security! 请查看插件配置!")
  ctx.logger('k2345-security').debug(global.breaks)
}
