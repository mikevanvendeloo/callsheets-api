import { DateTime } from 'luxon'
import logger from '../logging/logger'
import { type Request, type Response } from 'express'
import VMixService from './VMixService'
import { type TimerRequest } from '../types'

class VMixController {
  private readonly vmixService = new VMixService()
  setTimer = async (req: Request, res: Response): Promise<void> => {
    const timerRequest = req.body as unknown as TimerRequest
    this.vmixService
      .setTimer(timerRequest, DateTime.now().toISO() ?? '')
      .then(result => {
        res.status(200).json({ status: 'OK' })
      })
      .catch(err => {
        const error = err as Error
        logger.error(error)
        res.status(500).json({
          message: 'Could not set vmix timer. Error: ' + error.message,
        })
      })
  }

  getTimer = async (req: Request, res: Response): Promise<void> => {
    this.vmixService
      .getTimer()
      .then(contents => {
        res.status(200).json(contents)
      })
      .catch(error => {
        console.log(error)
        res.status(500).json({
          message: error,
        })
      })
  }
}

export default VMixController
