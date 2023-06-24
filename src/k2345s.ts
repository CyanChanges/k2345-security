import { Context, Dict, Loader, Logger, Random, Service } from "koishi";
import { camelCase, isPromise } from "./utils";
import { BreakFeaturesConfig, PublicFeat } from "./feat";
import { register } from "yakumo";
import NodeLoader from "@koishijs/loader";
import { ConfigWriter } from "@koishijs/plugin-config";
import { I18n } from "@koishijs/core";
import path from "path";
import { checkFile, denied } from "./index";

type HookObject = {
  prototype?: any
  name?: string
}

// noinspection JSUnusedLocalSymbols
export class HookPass {
  static #placeholder = 'pass'
}

export const name = 'k2s'

declare module 'koishi' {
  interface Context {
    k2s: PublicK2345s
  }
}

export class K2345s {
  static logger = new Logger('k2345-security')
  static protectionTimes = 0
  static config: BreakFeaturesConfig = new BreakFeaturesConfig()

  static consoleAlert(ctx: Context, registryName: string, hookedName: string = registryName, message?: string) {
    ctx.console.broadcast(
      'k2345-defended',
      {
        message: "k2345Security - " + (message ?? `已保护你的 Koishi 免受一次威胁`),
        registryName: registryName,
        hookedName: hookedName ?? 'unknown',
        timestamp: Date.now()
      },
      {
        authority: 3,
        immediate: true
      }
    )
  }

  static hook<T extends HookObject | typeof Object, K extends keyof T['prototype']>(hookClass: T, hookFuncName: K,
                                                                                    hookProc: {
                                                                                      beforeHook?: (args: any[]) => any | HookPass,
                                                                                      afterHook?: <V>(result: V, args: any[]) => V
                                                                                    }) {
    const originFunc = Object.getPrototypeOf(hookClass)[hookFuncName]

    function _hooked(...args) {
      let ret = hookProc.beforeHook?.(args)
      if (ret && (ret == HookPass || (ret.name === HookPass.name && ret.prototype == HookPass.prototype))) return ret

      ret = originFunc.apply(this, args)

      if (hookProc.afterHook)
        return hookProc.afterHook.call(this, ret, args)

      return ret
    }

    return <typeof originFunc><unknown>_hooked
  }

  static hookAsync<T extends HookObject | typeof Object, K extends keyof T['prototype']>(hookClass: T, hookFuncName: K,
                                                                                         hookProc: {
                                                                                           beforeHook?: (args: any[]) => Promise<any> | HookPass,
                                                                                           afterHook?: <V>(result: V, args: any[]) => Promise<V>
                                                                                         }) {
    const originFunc = Object.getPrototypeOf(hookClass)[hookFuncName]

    async function _hooked(...args) {
      let ret = await hookProc.beforeHook?.(args)
      if (ret && (ret == HookPass || (ret.name === HookPass.name && ret.prototype == HookPass.prototype))) return ret

      ret = originFunc.apply(this, args)

      let result2ret: any = ret

      if (isPromise(ret))
        result2ret = await ret


      if (hookProc.afterHook)
        return hookProc.afterHook.call(this, result2ret, args)

      return result2ret
    }

    return <typeof originFunc><unknown>_hooked
  }

  static hookWrapper<T extends (...args) => any>
  (hookedName: string, registeredName: string = hookedName,
   func: T, message: string = "已为您阻止了一个危险操作", resultHook: <T>(result: T, args: any[]) => T = ret => ret): T {
    const originFunc = func
    const onHookMessage = message

    let cls = this

    function _hooked(...args) {
      cls.logger.debug(`called hooked method(function) ${hookedName}`)

      if (!cls.config.feats.get(registeredName)) {
        return resultHook.call(this, originFunc.apply(this, args), args)
      }

      cls.protectAlert(registeredName, hookedName, onHookMessage)
      cls.logger.debug(`patched ${hookedName}`)

      return resultHook.call(this, undefined, args)
    }

    return <typeof originFunc><unknown>_hooked
  }

  static hookWrapperAsync<T extends (...args) => Promise<any>>
  (hookedName: string, registeredName: string = hookedName,
   func: T, message: string = "已为您阻止了一个危险操作", resultHook: <K>(result: K, args: any[]) => Promise<K> = async ret => ret): T {
    const originFunc = func
    const onHookMessage = message

    let cls = this

    async function _hooked(...args) {
      cls.logger.debug(`called hooked method(function) ${hookedName}`)

      if (!cls.config.feats.get(registeredName)) {
        let retVal: Promise<any> | any = originFunc.apply(this, args)
        if (retVal && retVal.constructor == Promise) {
          return await resultHook.call(this, await retVal, args)
        }
        return await resultHook.call(this, retVal, args)
      }

      cls.protectAlert(registeredName, hookedName, onHookMessage)
      cls.logger.debug(`patched ${hookedName}`)

      return await resultHook.call(this, undefined, args)
    }

    return <typeof originFunc><unknown>_hooked
  }

  static protectAlert(registeredName: string, hookedName: string = registeredName, message?: string) {
    this.protectionTimes++
    if (message) this.logger.info(`k2345Security - ${message} \n
    k2345S 已保护你的 Koishi ${this.protectionTimes} 次`)
    if (!this.config.context.console) {
      this.config.context.using(['console'], (ctx) => {
        this.consoleAlert(ctx.root, registeredName, hookedName, message)
      })
    } else {
      this.consoleAlert(K2345s.config.context.root, registeredName, hookedName, message)
    }
  }

  static kProtect<T extends HookObject | typeof Object, K extends keyof T['prototype']>
  (hookClass: T, hookFuncName: K, registryName?: string | Symbol, message?: string,
   resultHook?: (result, args?: any) => any):
    { origin: T['prototype'][K], hooked: T['prototype'][K] } {
    const originFunc = Object.getPrototypeOf(hookClass)[hookFuncName]

    let registeredName = registryName ?? camelCase(hookClass.name, String(hookFuncName))
    let onHookMessage = message

    if (!this.config.feats.has(registeredName))
      this.config.feats.reset(registeredName)

    let hookedFunc = this.hookWrapper(`${hookClass.name}.${String(hookFuncName)}`, String(registeredName),
      originFunc, onHookMessage, resultHook ?? (ret => ret))

    Object.getPrototypeOf(hookClass)[hookFuncName] = hookedFunc

    this.logger.debug(`hooked ${hookClass.name}.${String(hookFuncName)} as ${registeredName}`)

    return { origin: originFunc, hooked: hookedFunc }
  }

  static kProtectAsync<T extends HookObject | typeof Object, K extends keyof T['prototype']>
  (hookClass: T, hookFuncName: keyof (T['prototype']), registryName: string | Symbol, message?: string,
   resultHook?: <K>(result: K, args: any[]) => Promise<K>):
    { origin: T['prototype'][K], hooked: T['prototype'][K] } {
    const originFunc = Object.getPrototypeOf(hookClass)[hookFuncName]

    let registeredName = registryName ?? camelCase(hookClass.name, String(hookFuncName))
    let onHookMessage = message

    if (!this.config.feats.hasFeat(registeredName))
      this.config.feats.reset(registeredName)

    let hooked = this.hookWrapperAsync(`${hookClass.name}.${String(hookFuncName)}`, String(registeredName),
      originFunc, onHookMessage, resultHook ?? (async ret => ret))

    this.logger.debug(`hooked ${hookClass.name}.${String(hookFuncName)} as ${registeredName}`)

    return { origin: originFunc, hooked: hooked }
  }
}


export class PublicK2345s extends Service {
  static feat: PublicFeat = new PublicFeat(K2345s.config)
  private readonly ContextPlugin: typeof Context.prototype.plugin

  constructor(protected ctx: Context) {
    super(ctx, 'k2s', true);

    K2345s.config.context = ctx
    K2345s.config.feats.ctx = ctx

    // Backend Features
    K2345s.kProtect(Context, 'emit', 'contextEmit', "已为您阻止插件发出 Koishi 事件")
    K2345s.kProtect(Context, 'on', 'contextOn', "已为您阻止插件 *监听* 您的 Koishi")
    K2345s.kProtect(Context, 'middleware', 'contextMiddleware', "已为您阻止插件 hook 消息")
    this.ContextPlugin = K2345s.kProtect(Context, 'plugin', 'contextPlugin', "已为您阻止 危险插件 的加载").origin;
    K2345s.kProtect(Loader, 'resolve', 'loaderResolve', "已为您阻止一个 危险插件 的解析")
    K2345s.kProtect(Loader, 'reloadPlugin', "loaderReloadPlugin", "已为您阻止一个 危险操作")
    K2345s.kProtect(NodeLoader, 'resolve', 'nodeLoaderResolve', "已为您阻止一个 危险插件 的解析")
    K2345s.kProtect(NodeLoader, 'writeConfig', 'nodeLoaderWriteConfig', "已为您阻止插件写入配置")
    K2345s.kProtect(NodeLoader, 'readConfig', 'nodeLoaderReadConfig', "已为您阻止插件读取 Koishi 配置")
    K2345s.kProtect(Object(ctx.loader), "unloadPlugin", "ctxLoaderUnloadPlugin", "已为您阻止意外的插件卸载")
    K2345s.kProtect(ConfigWriter, 'unload', 'configWriterUnload', "已为您阻止意外的插件卸载")
    K2345s.kProtect(ConfigWriter, 'remove', 'configWriterRemove', "已为您阻止意外的插件移除")
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

    // Console Features
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
          K2345s.protectAlert("explorerRead", "explorer/read", "已为您阻止了一个核心数据的读取")
          if (binary)
            return Buffer.from("拒绝访问", 'utf8').toString('base64')

          return "拒绝访问"
        }
        return await (<(filename, binary?) => Promise<string>><unknown>originExploreRead)(filename, binary)
      }))

      ctx.console.addListener('explorer/write', K2345s.hookWrapperAsync("explorer/write", "explorerWrite", async (filename: string, content: string, binary?: boolean) => {
        if (!checkFile(filename)) {
          return denied('explorerWrite', 'explorer/write', '已为您阻止篡改关键性数据')
        }
        return await (
          <(filename: string, content: string, binary?: boolean) => Promise<string>>
            <unknown>originExploreWrite
        )(filename, content, binary)
      }))

      ctx.console.addListener('explorer/remove', K2345s.hookWrapperAsync("explorer/remove", "explorerRemove", async (filename: string) => {
        if (!checkFile(filename)) {
          return denied('explorerRemove', 'explorer/remove', '已为您阻止移除关键性数据')
        }
        await (
          <(filename: string) => Promise<void>>
            <unknown>originExploreRemove
        )(filename)
      }))

      ctx.console.addListener('explorer/rename', K2345s.hookWrapperAsync("explorer/rename", "explorerRename", async (oldValue: string, newValue: string) => {
        if (!(checkFile(oldValue) && checkFile(newValue))) {
          return denied('explorerRename', 'explorer/rename', "已为您阻止篡改文件名称")
        }
        await (
          <(oldValue: string, newValue: string) => Promise<string>>
            <unknown>originExploreRename
        )(oldValue, newValue)
      }))
    })

    // Protections

    // Parent-Protection
    ctx.runtime.parent.on('dispose', () => {
      this.ContextPlugin.call(ctx.root, ctx.runtime.parent.runtime.plugin)
      denied('unloadProtect', "unload", "已为您阻止意外操作")
    })

    // Caller-Protection
    this.protectCaller()

    // Self-Protection
    ctx.on('dispose', () => {
      this.ContextPlugin.call(ctx.root, ctx.runtime.plugin)
      denied('unloadProtect', "unload", "已为您阻止意外操作")
    })
  }

  protected protectCaller() {
    const caller1 = this.caller
    if (caller1) {
      (() => {
        const caller = caller1

        caller.on('dispose', () => {
          if (this.ContextPlugin)
            this.ContextPlugin.call(this.ctx.root, caller.runtime.plugin)
          denied('unloadProtect', "unload", "已为您阻止意外操作")
        })

        const deleter = caller.registry.delete
        caller.registry.delete = function _wrapper(plugin) {
          caller.logger('app').error('failed to unload %c access denied', caller.runtime.name)
          if (plugin === caller.runtime.plugin) {
            denied('unloadProtect', "unload", "已为您阻止意外操作")
            return false // ur not able to delete it !!!!!
          }
          return deleter.call(this, plugin)
        }
      })()
    }
  }

  protectMe = this.protectCaller

  static protectAlert = K2345s.protectAlert
  static hookWrapper = K2345s.hookWrapper
  static hookWrapperAsync = K2345s.hookWrapperAsync
  static hooker = this.hookWrapper
  static asyncHooker = this.hookWrapperAsync
  static kProtect = K2345s.kProtect
  static kProtectAsync = K2345s.kProtectAsync
  static hook = K2345s.hook
  static hookAsync = K2345s.hookAsync
}

Context.service('k2s', { prototype: Object.getPrototypeOf(K2345s) })
