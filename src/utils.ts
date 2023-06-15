import {camelCase as underScore2CamelCase} from "cosmokit";

export function camelCase(...args: string[]){
  return underScore2CamelCase(args.join('_'))
}

export function isPromise<T>(v: any | Promise<T>): v is Promise<T> {
  return v && v.constructor == Promise
}
