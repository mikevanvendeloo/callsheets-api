import path from 'path'
import { callSheetDirectory, dataDirectory } from '..'
import fs from 'fs'
import logger from '../logging/logger'
import { DateTime, Duration } from 'luxon'
import {
  type StreamFunction,
  type ActiveCallSheet,
  type ActiveCallSheetTimer,
  type CallSheet,
} from '../types'

const activeCallSheetFileName = 'activeCallSheet.json'
const activeFunctionsFileName = 'activeFunctions.json'

class LiveService {
  readCallSheet = async (callSheetFileName: string): Promise<CallSheet> => {
    const sheetFile = path.join(callSheetDirectory, callSheetFileName)
    if (fs.existsSync(sheetFile)) {
      return JSON.parse(fs.readFileSync(sheetFile, 'utf-8'))
    } else {
      throw Error("Could not find callsheet '" + sheetFile + "'")
    }
  }

  readActiveCallSheet = async (): Promise<ActiveCallSheet | null> => {
    if (dataDirectory == null) throw Error('No directory found')

    const sheetFile = path.join(dataDirectory, activeCallSheetFileName)
    if (fs.existsSync(sheetFile)) {
      return JSON.parse(fs.readFileSync(sheetFile, 'utf-8'))
    } else {
      return null
    }
  }

  readActiveFunctions = async (): Promise<StreamFunction[] | []> => {
    if (dataDirectory == null) throw Error('No directory found')

    const sheetFile = path.join(dataDirectory, activeFunctionsFileName)
    if (fs.existsSync(sheetFile)) {
      return JSON.parse(fs.readFileSync(sheetFile, 'utf-8'))
    } else {
      return []
    }
  }

  activateCallSheet = async (
    callSheetFileName: string,
    currentScheduleItem: number,
  ): Promise<ActiveCallSheet> => {
    console.log("Activating callsheet '" + callSheetFileName + "'")
    return await this.readCallSheet(callSheetFileName)
      .then(callSheet => {
        const matchDate = DateTime.fromFormat(
          callSheet.matchInfo.date,
          'dd-MM-yyyy',
          { locale: 'nl-NL' },
        )
        let callSheetStartTime = DateTime.fromISO(
          callSheet?.schedule.items[0].timeStart,
        )
        callSheetStartTime = callSheetStartTime.set({
          day: matchDate.day,
          month: matchDate.month,
          year: matchDate.year,
        })

        const durationInMilliseconds = Math.abs(
          callSheetStartTime.diffNow('milliseconds').milliseconds,
        )
        const deadline = DateTime.now().plus({
          milliseconds: durationInMilliseconds,
        })
        const activeCallSheet = {
          activeCallSheetFile: callSheetFileName,
          callSheetActivationTimestamp: DateTime.now().toISO() ?? 'unknown',
          activeItem: currentScheduleItem,
          itemStartedTimestamp: DateTime.now().toISO() ?? 'unknown',
          itemDeadlineTimestamp: deadline.toISO(),
          callSheet,
        }

        const activeSheetFile = path.join(
          dataDirectory,
          activeCallSheetFileName,
        )
        fs.writeFileSync(activeSheetFile, JSON.stringify(activeCallSheet))
        console.log("Activated callsheet '" + callSheetFileName + "'")

        const activeFunctionsFile = path.join(
          dataDirectory,
          activeFunctionsFileName,
        )
        fs.copyFile(
          path.join(
            dataDirectory,
            callSheetFileName.replace('.json', '-functions.json'),
          ),
          activeFunctionsFile,
          fs.constants.COPYFILE_FICLONE,
          err => {
            if (err != null) {
              console.log('Error Found:', err)
            }
          },
        )

        return activeCallSheet
      })
      .catch(err => {
        logger.error(
          'Error Reading the callsheet from ' +
            callSheetFileName +
            '. Error message: ' +
            err,
        )
        throw err
      })
  }

  nextItem = async (): Promise<void> => {
    this.readActiveCallSheet()
      .then(contents => {
        if (contents?.callSheet == null) return
        this.updateActiveCallSheet(
          contents.activeItem + 1,
          DateTime.now().toISO() ?? '',
        ).catch(err => {
          logger.error('Error going to next callsheet item' + err)
          throw err
        })
      })
      .catch(err => {
        logger.error('Err going to next callsheet item' + err)
        throw err
      })
  }

  previousItem = async (): Promise<void> => {
    this.readActiveCallSheet()
      .then(contents => {
        if (contents?.callSheet == null) return

        this.updateActiveCallSheet(
          contents.activeItem - 1,
          DateTime.now().toISO() ?? '',
        ).catch(err => {
          logger.error('Error going to next callsheet item' + err)
          throw err
        })
      })
      .catch(err => {
        logger.error('Err going to next callsheet item' + err)
        throw err
      })
  }

  updateActiveCallSheet = async (
    currentScheduleItem: number,
    itemActivatedTimestamp: string,
  ): Promise<void> => {
    this.readActiveCallSheet()
      .then(contents => {
        if (contents?.callSheet == null) return
        if (currentScheduleItem > contents.callSheet.schedule.items.length) {
          logger.error('No more scheduled items left!')
          return
        }
        const currentIndex =
          currentScheduleItem > 1 ? currentScheduleItem - 1 : 1
        const matchDate = DateTime.fromFormat(
          contents.callSheet.matchInfo.date,
          'dd-MM-yyyy',
          { locale: 'nl-NL' },
        )
        let callSheetItemStartTime =
          currentIndex > 0
            ? DateTime.now()
            : DateTime.fromISO(
                contents.callSheet.schedule.items[0].timeStart ??
                  contents.callSheet.matchInfo.startTime,
              )
        console.log(currentIndex)
        console.log(
          currentIndex +
            1 +
            ':' +
            `${contents.callSheet.schedule.items[currentIndex].title}`,
        )

        callSheetItemStartTime = callSheetItemStartTime.set({
          day: matchDate.day,
          month: matchDate.month,
          year: matchDate.year,
        })
        callSheetItemStartTime = DateTime.fromISO(itemActivatedTimestamp)

        const durationInMilliseconds =
          currentIndex > 0
            ? contents.callSheet.schedule.items[currentIndex]
                .durationInMinutes *
              60 *
              1000
            : callSheetItemStartTime.diffNow('milliseconds').milliseconds

        const deadline = callSheetItemStartTime.plus({
          milliseconds: durationInMilliseconds,
        })
        contents.activeItem = currentScheduleItem >= 0 ? currentScheduleItem : 0
        contents.itemStartedTimestamp = itemActivatedTimestamp
        contents.itemDeadlineTimestamp = deadline.toISO()
        const activeSheetFile = path.join(
          dataDirectory,
          activeCallSheetFileName,
        )
        fs.writeFileSync(activeSheetFile, JSON.stringify(contents))
        console.log(
          'Activated call sheet item ' +
            currentScheduleItem +
            ': ' +
            (currentIndex >= 0
              ? contents.callSheet.schedule.items[currentIndex].title
              : ''),
        )
      })
      .catch(err => {
        logger.error(
          'Error updating the active callsheet to item ' +
            currentScheduleItem +
            '. Error message: ' +
            err,
        )
        throw err
      })
  }

  getActiveTimer = async (
    delta: number | 0,
  ): Promise<ActiveCallSheetTimer | null> => {
    return await this.readActiveCallSheet()
      .then(contents => {
        if (contents == null) return null
        const maxIndex =
          contents.callSheet?.schedule != null
            ? contents.callSheet?.schedule.items.length - 1
            : 0
        const itemNumber =
          contents.activeItem - 1 + delta <= maxIndex
            ? contents.activeItem - 1 + delta
            : maxIndex
        const activeItem =
          itemNumber >= 0
            ? contents.callSheet?.schedule.items[itemNumber]
            : null
        const nextItem =
          itemNumber < maxIndex
            ? contents.callSheet?.schedule.items[itemNumber + 1]
            : null

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
        let callSheetStartTime = DateTime.fromISO(
          contents.callSheet?.schedule.items[0].timeStart,
        )
        callSheetStartTime = callSheetStartTime.set({
          day: matchDate.day,
          month: matchDate.month,
          year: matchDate.year,
        })
        const itemStartTimestamp =
          itemNumber === 0
            ? callSheetStartTime
            : DateTime.fromISO(contents.itemStartedTimestamp, {
                locale: 'nl-NL',
              })
        const minutesToCallSheetStart = DateTime.fromISO(
          contents.callSheet.schedule.items[0].timeStart,
        ).diffNow('minutes').minutes
        const durationInMilliseconds = Duration.fromMillis(
          activeItem != null && itemNumber > 0
            ? activeItem?.durationInMinutes * 60 * 1000
            : minutesToCallSheetStart * 60 * 1000,
        )
        const deadline = itemStartTimestamp.plus({
          milliseconds: durationInMilliseconds.milliseconds,
        })
        const timer = deadline.diffNow()
        const minutes =
          timer.milliseconds >= 0
            ? timer.toFormat('mm:ss')
            : timer.negate().toFormat('-mm:ss')
        const color =
          timer.milliseconds >= 30000
            ? '#000000'
            : timer.milliseconds <= 15000
            ? '#ff0000'
            : '#ffac1c'

        return {
          matchStartTime: matchStartTime.toISO() ?? 'unknown',
          callSheetStartTime: callSheetStartTime.toISO(),
          activeItem,
          nextItem,
          itemTimer: {
            timerValue: minutes,
            timerColor: color,
            startTimestamp: contents.itemStartedTimestamp,
            endTimestamp: deadline.toISO() ?? 'unknown',
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
