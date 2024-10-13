import { type Application } from 'express'
import callSheetRoutes from './callsheets/CallSheetRoutes'
import healthRoutes from './health/HealthRoutes'
import liveRoutes from './live/LiveRoutes'
import { invalidPathHandler } from './error-handling'
import vMixRoutes from './vmix/VMixRoutes'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Routes {
  constructor(app: Application) {
    app.use('/health', healthRoutes)
    app.use('/api/live', liveRoutes)
    app.use('/api/callsheets', callSheetRoutes)
    app.use('/api/vmix', vMixRoutes)
    app.use(invalidPathHandler)
  }
}
