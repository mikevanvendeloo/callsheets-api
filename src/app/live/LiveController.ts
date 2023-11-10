import { type Request, type Response } from 'express'
import logger from '../logging/logger'
import LiveService from './LiveService'
import { type ActiveCallSheet } from '../types'
import { DateTime } from 'luxon'

class LiveController {
  private readonly liveService = new LiveService()

  activate = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info(req.body)
      const activationRequest = req.body
      this.liveService
        .activateCallSheet(
          activationRequest.callSheetFileName,
          activationRequest.currentScheduleItem,
        )
        .then((callsheet: ActiveCallSheet) => {
          res.status(200).json({
            result: 'OK',
            activationTimestamp: callsheet.callSheetActivationTimestamp,
          })
        })
        .catch(error => {
          console.log(error)
        })
    } catch (err) {
      const error = err as Error
      res.status(500).json({
        message: 'Could not activate callsheet.' + error.message + req.body,
      })
    }
  }

  setActiveItem = async (req: Request, res: Response): Promise<void> => {
    const activateItemRequest = req.body
    this.liveService
      .updateActiveCallSheet(
        activateItemRequest.itemNumber,
        DateTime.now().toISO() ?? '',
      )
      .then(result => {
        res.status(200).json({ status: 'OK' })
      })
      .catch(err => {
        const error = err as Error
        logger.error(error)
        res.status(500).json({
          message: 'Could not activate item. Error: ' + error.message,
        })
      })
  }

  timer = async (req: Request, res: Response): Promise<void> => {
    try {
      this.liveService
        .getActiveTimer()
        .then(contents => {
          res.status(200).json(contents)
        })
        .catch(error => {
          console.log(error)
          res.status(500).json({
            message: error,
          })
        })
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  vmix = async (req: Request, res: Response): Promise<void> => {
    try {
      this.liveService
        .getActiveTimer()
        .then(activeTimer => {
          if (activeTimer == null) {
            res.status(400).json({ message: 'No active callsheet found' })
          } else {
            res.status(200).json([
              {
                matchTimer:
                  DateTime.fromISO(activeTimer.matchStartTime).toFormat(
                    '{0:tt',
                  ) + '|mm:ss}',
                callSheetItemTimer: {
                  vmixTimerValue:
                    DateTime.fromISO(
                      activeTimer.itemTimer.endTimestamp,
                    ).toFormat('{0:tt') + '|mm:ss}',
                  activeItem: activeTimer.activeItem?.title,
                  nextItem: activeTimer.nextItem?.title,
                  color: activeTimer.itemTimer.timerColor,
                  formattedTimerValue: activeTimer.itemTimer.timerValue,
                },
              },
            ])
          }
        })
        .catch(error => res.status(500).json({ message: error }))
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  retrieve = async (req: Request, res: Response): Promise<void> => {
    try {
      this.liveService
        .readActiveCallSheet()
        .then(contents => res.status(200).json(contents))
        .catch(error => res.status(500).json({ message: error }))
    } catch (err) {
      logger.error(err)
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }
}

export default LiveController
