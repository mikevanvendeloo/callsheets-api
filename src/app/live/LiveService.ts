import path from 'path'
import { dataDirectory } from '..'
import fs from 'fs'
import logger from '../logging/logger'
import { DateTime, Duration } from 'luxon'
import CallSheet, { ActiveCallSheet, ActiveCallSheetTimer } from '../types'

const activeCallSheetFileName = 'activeCallSheet.json'


class LiveService {
  constructor() {}

  readCallSheet = async (callSheetFileName: string): Promise<CallSheet>  => {
    const sheetFile = path.join(dataDirectory, 'callsheets', callSheetFileName)
    return JSON.parse(fs.readFileSync(sheetFile, 'utf-8'))
  }

  readActiveCallSheet = async (): Promise<ActiveCallSheet>  => {
    const sheetFile = path.join(dataDirectory, activeCallSheetFileName)
    return JSON.parse(fs.readFileSync(sheetFile, 'utf-8'))
  }

  activateCallSheet = async (callSheetFileName: string): Promise<ActiveCallSheet> => {
    return this.readCallSheet(callSheetFileName).then(callsheet => {
      const activeCallSheet = {
        activeCallSheet: callSheetFileName,
        activeItem: 1,
        activationTimestamp: DateTime.now().toISO() ?? "unknown",
        itemStartTimestamp: DateTime.now().toISO() ?? "unknown",
        callSheet: callsheet,
      }

      const activeSheetFile = path.join(dataDirectory, activeCallSheetFileName)
      fs.writeFileSync(activeSheetFile, JSON.stringify(activeCallSheet))
      return activeCallSheet;
    }).catch(err => {
        logger.error(
          'Error Reading the callsheet from ' + callSheetFileName + '. Error message: ' + err,
        )
        throw err
      })
  }

  updateActiveCallSheet = async (
    currentScheduleItem: number,
    itemActivatedTimestamp: string,
  ) => {
    this.readActiveCallSheet().then(contents => {
      contents.activeItem = currentScheduleItem
      contents.itemStartTimestamp = itemActivatedTimestamp
      const activeSheetFile = path.join(dataDirectory, activeCallSheetFileName)
      fs.writeFileSync(activeSheetFile, JSON.stringify(contents))
    }).catch(err => {
        logger.error(
          'Error updating the active callsheet to item ' + currentScheduleItem + '. Error message: ' + err,
        )
        throw err
      })
  }

  getActiveTimer = async (): Promise<ActiveCallSheetTimer> => {
    return this.readActiveCallSheet()
      .then(contents => {
        const itemNumber = contents.activeItem
        const activeItem = contents.callSheet?.schedule.items[itemNumber]
        const nextItem = contents.callSheet?.schedule.items[itemNumber + 1]
        const durationInMilliseconds = Duration.fromMillis(
          activeItem.durationInMinutes * 60 * 1000,
        )
        const deadline = DateTime.fromISO(contents.itemStartTimestamp).plus({
          milliseconds: durationInMilliseconds.milliseconds,
        })
        const timer = deadline.diffNow()
        const minutes =
          timer.milliseconds >= 0
            ? timer.toFormat('mm:ss')
            : timer.negate().toFormat('-mm:ss')
        const color =
          timer.milliseconds >= 30000
            ? 'black'
            : timer.milliseconds <= 15000
            ? 'red'
            : 'orange'
        const matchDate = DateTime.fromFormat(
          contents.callSheet.matchInfo.date,
          'dd-MM-yyyy',
          { locale: 'nl-NL' },
        )
        let matchStartTime = DateTime.fromISO(
          contents.callSheet.matchInfo.startTime,
          { locale: 'nl-NL' },
        )
        matchStartTime = matchStartTime.set({
          day: matchDate.day,
          month: matchDate.month,
          year: matchDate.year,
        })
        return {
          matchStartTime: matchStartTime.toISO() ?? "unknown",
          activeItem: activeItem,
          nextItem: nextItem,
          itemTimer: {
            timerValue: minutes,
            timerColor: color,
            startTimestamp: contents.itemStartTimestamp,
            endTimestamp: deadline.toISO() ?? "unknown",
          },
        }
      })
      .catch(err => {
        logger.error(
          'Error getting the active timer information. Error message: ' + err,
        )
        throw err
      })
  }
}

export default LiveService
