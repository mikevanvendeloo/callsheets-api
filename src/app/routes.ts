import { type Application } from 'express'
import callSheetRoutes from './callsheets/CallSheetRoutes'
import healthRoutes from './health/HealthRoutes'
import liveRoutes from './live/LiveRoutes'
import { invalidPathHandler } from './error-handling'

export default class Routes {
  constructor(app: Application) {
    app.use('/health', healthRoutes)
    app.use('/api/live', liveRoutes)
    app.use('/api/callsheets', callSheetRoutes)
    app.use(invalidPathHandler)
  }
}
