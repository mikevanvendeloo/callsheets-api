import { Router } from 'express'
import VMixController from './VMixController'

class VMixRoutes {
  router = Router()
  controller = new VMixController()

  constructor() {
    this.intializeRoutes()
  }

  intializeRoutes(): void {
    this.router.get('/timer', this.controller.getTimer)
    this.router.post('/timer', this.controller.setTimer)
  }
}

export default new VMixRoutes().router
