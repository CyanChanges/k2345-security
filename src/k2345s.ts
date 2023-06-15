import {Context, Logger} from "koishi";
import {camelCase, isPromise} from "./utils";
import {BreakFeaturesConfig, PublicFeat} from "./feat";

type HookObject<RegisteredName = undefined> = {
  prototype: any,
  name: RegisteredName extends undefined ? undefined | string : string
}

export class HookPass {
}

export class K2345s {
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

  static hook<T extends HookObject | typeof Object, K extends keyof T['prototype']>(hookClass: T, hookFuncName: K,
                                                                                    hookProc: {
                                                                                      beforeHook?: (args: any[]) => any | HookPass,
                                                                                      afterHook?: <V>(result: V, args: any[]) => V
                                                                                    }) {
    const originFunc = hookClass.prototype[hookFuncName]

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
    const originFunc = hookClass.prototype[hookFuncName]

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

      cls.protectAlert(registeredName, onHookMessage)
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

      cls.protectAlert(registeredName, onHookMessage)
      cls.logger.debug(`patched ${hookedName}`)

      return await resultHook.call(this, undefined, args)
    }

    return <typeof originFunc><unknown>_hooked
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
      this.consoleBroadcastAlert(K2345s.config.context.root, name, message)
    }
  }

  static kProtect<T extends HookObject<R> | typeof Object, K extends keyof T['prototype'], R extends string | undefined>
  (hookClass: T, hookFuncName: K, registryName: R, message?: string,
   resultHook?: (result, args?: any) => any):
    { origin: T['prototype'][K], hooked: T['prototype'][K] } {
    const originFunc = hookClass.prototype[hookFuncName]

    let registeredName = registryName ?? camelCase(hookClass.name, String(hookFuncName))
    let onHookMessage = message

    if (!this.config.feats.hasFeat(registeredName))
      this.config.feats.setFeat(registeredName, false)

    let hookedFunc = this.hookWrapper(`${hookClass.name}.${String(hookFuncName)}`, registeredName,
      originFunc, onHookMessage, resultHook ?? (ret => ret))

    hookClass.prototype[hookFuncName] = hookedFunc

    this.logger.debug(`hooked ${hookClass.name}.${String(hookFuncName)} as ${registeredName}`)

    return {origin: originFunc, hooked: hookedFunc}
  }

  static kProtectAsync<T extends HookObject<R> | typeof Object, K extends keyof T['prototype'], R extends string | undefined>
  (hookClass: T, hookFuncName: keyof (T['prototype']), registryName: R, message?: string,
   resultHook?: <K>(result: K, args: any[]) => Promise<K>):
    { origin: T['prototype'][K], hooked: T['prototype'][K] } {
    const originFunc = hookClass.prototype[hookFuncName]

    let registeredName = registryName ?? camelCase(hookClass.name, String(hookFuncName))
    let onHookMessage = message

    if (!this.config.feats.hasFeat(registeredName))
      this.config.feats.get(registeredName, false)

    let hooked = this.hookWrapperAsync(`${hookClass.name}.${String(hookFuncName)}`, registeredName,
      originFunc, onHookMessage, resultHook ?? (async ret => ret))

    this.logger.debug(`hooked ${hookClass.name}.${String(hookFuncName)} as ${registeredName}`)

    return {origin: originFunc, hooked: hooked}
  }
}


export class PublicK2345s {
  static feat: PublicFeat = new PublicFeat(K2345s.config)

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
