import { Application } from 'express'
import callSheetRoutes from './callsheets/CallSheetRoutes'
import healthRoutes from './health/HealthRoutes'
import liveRoutes from './live/LiveRoutes'

export default class Routes {
  constructor(app: Application) {
    app.use('/health', healthRoutes)
    app.use('/api/live', liveRoutes)
    app.use('/api/callsheets', callSheetRoutes)
  }
}
