interface Event {
  [name: string]: Function[]
}

interface Options {
  reconnectMax?: number
  reconnectTime?: number
  heartTimeout?: number
  logger?: Boolean
}

export {
  Event,
  Options
}