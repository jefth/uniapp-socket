import { EventBus, json2params } from '@friendlyjesse/library'

import { Options } from '../typings'

/**
 * Socket 类
 * @author Jesse <jessexinyu@foxmail.com>
 * @extends EventBus
 */
class Socket extends EventBus {
  private instance: any = null
  private status = 'unconnected' // unconnected, connecting, connected, failed, closed, turnoff(主动关闭)
  private heartbeat: any = null // 心跳
  private heartbeatShut: any = null // 断线
  private url = ''
  private params = {}
  private reconnectCount = 0

  // options
  public reconnectMax = 10
  public reconnectTime = 3000
  public heartTimeout = 60000 // 心跳间隔
  public logger = true

  /**
   * 创建一个 socket 实例
   * @param url - url
   * @param params - params
   * @param params.type - type
   * @param params.token - token
   * @param options - 可配置项
   * @param {number} [options.reconnectMax = 10] - 最大重连数
   * @param {number} [options.reconnectTime = 3000] - 重连间隔
   * @param {number} [options.heartTimeout = 60000] - 心跳间隔
   * @param {boolean} [options.logger = true] - 是否开启日志
   */
  constructor (url: string, params: Object, options?: Options) {
    super()

    this.url = url
    this.params = params

    for (const key in options) { // 可配置化
      if (key in this) (this as any)[key] = options[key as keyof Options]
    }

    this.init()
  }

  /**
   * 发送消息
   * @param {Object/ArrayBuffer} data - 需要发送的内容
   * @param {Function=} success - 接口调用成功的回调函数
   * @param {Function=} fail - 接口调用失败的回调函数
   * @param {Function=} complete - 接口调用结束的回调函数（调用成功、失败都会执行）
   */
  public send <T> (data: Object | ArrayBuffer, ...handlers: T[]) {
    this.logger && data !== 'ping' && console.log('send: ', data)
    this.instance.send({
      data,
      ...handlers
    })
  }

  /**
   * 主动关闭 socket
   */
  public shut () { // 主动关闭
    this.instance.close({
      success: () => {
        this.status = 'turnoff'
      }
    })
  }

  private init () {
    // 不重复连接
    if (this.status === 'connecting' && 'connected') return

    // const protocol = location.protocol == 'http:' ? 'ws' : 'wss'
    const params = json2params(this.params)

    this.instance = uni.connectSocket({
      url: `${this.url}?${params}`,
      success: () => {
        this.status = 'connecting'
        this.complete()
      },
      fail: () => {
        this.status = 'failed'
        this.complete()
      }
    })
    this.instance.onOpen(this.onOpen.bind(this))
    this.instance.onClose(this.onClose.bind(this))
    // this.instance.onError(this.onError.bind(this))
    this.instance.onMessage(this.onMessage.bind(this))
  }

  private onOpen () {
    this.status = 'connected'
    this.complete()

    this.heartbeatReset()
    this.heartbeatCheck()
  }

  private onClose () {
    if (this.status !== 'turnoff') this.status = 'closed'
    this.complete()
    this.reconnect()
  }

  // onError () {
  //   console.log('------------------- error -------------------')
  //   this.status = 'error'
  // }

  private onMessage (message: any) {
    // 收到任何消息都表示没有断开
    this.heartbeatReset()
    this.heartbeatCheck()

    // 处理接收信息
    if (message.data === 'pong') return
    const data = JSON.parse(message.data)
    const content = data.content
    this.logger && console.log('message: ', data)
    this.emit(content.type, data)
  }

  private reconnect () {
    this.logger && console.log('reconnect: ' + this.reconnectCount)
    // reconnectMax: 0 不重连, 重连次数超出不重连, status: trunoff 主动关闭不重连
    if (this.reconnectMax === 0 || this.reconnectCount >= this.reconnectMax || this.status === 'turnoff') return
    this.reconnectCount++
    setTimeout(() => {
      this.init()
    }, this.reconnectTime)
  }

  private heartbeatCheck () { // 心跳检测
    this.heartbeat = setTimeout(() => {
      this.send('ping')
      this.heartbeatShut = setTimeout(() => {
        this.logger && console.log('heartbeat shut!!!!!!!!!!!!')
        this.instance.close()
      }, this.heartTimeout)
    }, this.heartTimeout)
  }

  private heartbeatReset () { // 重置心跳状态
    clearTimeout(this.heartbeat)
    clearTimeout(this.heartbeatShut)
  }

  private complete () {
    this.logger && console.log(`------------------- ${this.status} -------------------`)
  }
}

export default Socket
