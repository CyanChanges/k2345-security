export type k2sEventType = 'protect' | 'notice'

export type k2sEvent = {
  type: k2sEventType,
  title?: string,
  message: string,
  registryName: string,
  hookedName: string,
  timestamp: number
}
