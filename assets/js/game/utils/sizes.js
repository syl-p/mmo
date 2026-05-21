import EventEmitter from "./event_emitter"

export default class Sizes extends EventEmitter {
  width = 0
  height = 0
  pixelRatio = Math.min(window.devicePixelRatio, 2)

  constructor() {
    super()
    this.width = window.innerWidth
    this.height = window.innerHeight

    // Resize event
    window.addEventListener('resize', () =>
    {
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.pixelRatio = Math.min(window.devicePixelRatio, 2)

      this.emit('resize')
    })
  }
}
