import { Router } from 'express'
import HealthController from './HealthController'

class HealthRoutes {
  router = Router()
  controller = new HealthController()

  constructor() {
    this.intializeRoutes()
  }

  intializeRoutes() {
    // Retrieve all CallSheets
    this.router.get('/', this.controller.health)
  }
}

export default new HealthRoutes().router
