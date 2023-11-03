import { Request, Response } from 'express'
import logger from '../logging/logger'
import LiveService from './LiveService'
import { ActiveCallSheet } from '../types'
import { DateTime } from 'luxon'

class LiveController {
  private liveService = new LiveService()
  constructor() {}

  activate = async (req: Request, res: Response) => {
    try {
      logger.info(req.body)
      const activationRequest = req.body
      this.liveService
        .activateCallSheet(activationRequest.callSheetFileName)
        .then( (callsheet: ActiveCallSheet) => {
          res
            .status(200)
            .json({
              result: 'OK',
              activationTimestamp: callsheet.activationTimestamp,
            })
        })
    } catch (err) {
      const error = err as Error
      logger.error(error)
      res.status(500).json({
        message: 'Internal Server Error!' + error + req.body,
      })
    }
  }

  setActiveItem = async (req: Request, res: Response) => {
    try {
      logger.info(req.body)
      this.liveService.updateActiveCallSheet(4, Date.now().toLocaleString())
      res.status(200).json({ status: 'OK' })
    } catch (err) {
      const error = err as Error
      logger.error(error)
      res.status(500).json({
        message: 'Internal Server Error!' + error,
      })
    }
  }

  timer = async (req: Request, res: Response) => {
    try {
      this.liveService.getActiveTimer().then(contents => {
        res.status(200).json(contents)
      })
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  vmix = async (req: Request, res: Response) => {
    try {
      this.liveService.getActiveTimer().then(activeTimer => {
        res.status(200).json([
          {
            matchTimer:
              DateTime.fromISO(activeTimer.matchStartTime).toFormat('{0:tt') + '|mm:ss}',
            callSheetItemTimer: {
              vmixTimerValue:
              DateTime.fromISO(activeTimer.itemTimer.endTimestamp).toFormat('{0:tt') +
                '|mm:ss}',
              activeItem: activeTimer.activeItem.title,
              nextItem: activeTimer.nextItem?.title,
              color: activeTimer.itemTimer.timerColor,
              value: activeTimer.itemTimer.timerValue,
            },
          },
        ])
      })
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  retrieve = async (req: Request, res: Response) => {
    try {
      this.liveService
        .readActiveCallSheet()
        .then(contents => res.status(200).json(contents))
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }
}

export default LiveController
