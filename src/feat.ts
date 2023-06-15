import { Context } from "koishi";
import { addPrefix, removePrefix } from "./index";


export class BreakFeaturesConfig {
  loaded = false
  context: Context
  feats = new Feat()
}

export class Feat {
  ctx?: Context | { config: Object } = { config: {} }
  #feats: Map<string, boolean> = new Map<string, boolean>()

  /* @deprecated use `feat.has` instead */
  hasFeat(featName: string) {
    return this.#feats.has(String(featName))
  }

  has(featName: string) {
    return this.hasFeat(featName)
  }

  set(featName: string) {
    this.setFeat(featName, true)
  }

  unset(featName: string) {
    this.setFeat(featName, false)
  }

  clear(featName: string) {
    this.setFeat(featName, null)
  }

  get(featName: string) {
    return this.#feats.get(String(featName))
  }


  private setFeat(featName: string, enable: boolean | null) {
    this.#feats.set(String(removePrefix(featName, 'block')), enable)
    let setName = String(featName)
    if (!setName.startsWith('option')) setName = String(addPrefix(featName, 'option'))
    this.ctx.config[String(setName)] = enable
  }

  /* @deprecated use `feat.get` instead */
  getFeat(featName: string) {
    return this.#feats.get(String(featName))
  }
}


export class PublicFeat {
  #config: BreakFeaturesConfig

  constructor(config: BreakFeaturesConfig) {
    this.#config = config
  }

  has(name: string) {
    return this.#config.feats.hasFeat(name)
  }

  set(name: string) {
    this.#config.feats.set(name)
  }

  unset(name: string, prompt: string = "Give me error when disable it") {
    if (prompt === 'Pass the check') {
      throw Error("Unable to unset a feat")
    }

    this.#config.feats.unset(name)
  }

  clear(name: string, prompt: string = "Give me error when clear it") {
    if (prompt === 'Pass the check') {
      throw Error("Unable to clear a feat")
    }

    this.#config.feats.clear(name)
  }


  get(name: string) {
    return this.#config.feats[name]
  }
}
