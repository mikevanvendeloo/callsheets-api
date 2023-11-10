import { Router } from 'express'
import LiveController from './LiveController'

class LiveRoutes {
  router = Router()
  controller = new LiveController()

  constructor() {
    this.intializeRoutes()
  }

  intializeRoutes(): void {
    this.router.post('/', this.controller.activate)
    this.router.get('/', this.controller.retrieve)
    this.router.get('/timer', this.controller.timer)
    this.router.get('/vmix', this.controller.vmix)
    this.router.post('/item', this.controller.setActiveItem)
  }
}

export default new LiveRoutes().router
