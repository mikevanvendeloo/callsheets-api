import Excel from 'exceljs'
import { DateTime, Settings } from 'luxon'
import dotenv from 'dotenv'
import * as path from 'path'
import fs from 'fs'

dotenv.config()
Settings.defaultZone = 'Europe/Amsterdam'

export const readCallSheet = async (fileName: string): Promise<CallSheet[]> => {
  const workbook = new Excel.Workbook()
  const content = await workbook.xlsx.readFile(path.resolve(fileName))
  const sheets: CallSheet[] = []

  content.worksheets.forEach(sheet =>
    callSheetParser(sheet).then(sheet => {
      if (sheet) {
        sheets.push(sheet)
        fs.writeFile(
          path.join(
            __dirname,
            '../../data/',
            sheet.matchInfo.date +
              '__' +
              sheet.matchInfo.league +
              '__' +
              sheet.matchInfo.title?.replace(
                /[&\\/\\#,+()$~%.'":*?<>{}]/g,
                '-',
              ) +
              '.json',
          ),
          JSON.stringify(sheet),
          err => {
            if (err) {
              console.log('Error writing JSON result file for sheet', err)
            }
          },
        )
      }
    }),
  )
  return sheets
}

type MatchInfo = {
  league: string
  title: string | undefined
  date: string | undefined
  startTime: string | undefined
}

type CallSheet = {
  matchInfo: MatchInfo
  schedule: Schedule
}

type Schedule = {
  activeItem: number | null
  items: ScheduleItem[]
}

type ScheduleItem = {
  id: number
  title: string
  timeStart: string
  timeEnd: string
  durationInMinutes: number
}

function getTimeValue(
  value: Excel.CellValue | Excel.CellFormulaValue,
): DateTime {
  if (value === undefined) {
    console.log('ERROR => value is not defined!!')
    return DateTime.now()
  }
  const today = DateTime.now()
  const cellDateTime = value as Date
  const dateObj = new Date(cellDateTime)

  //  cellDateTime = new Date(Date.UTC(today.year, today.month - 1, today.day, cellDateTime.getUTCHours()), cellDateTime.getMinutes())
  const cellDateTime2 = DateTime.utc(
    today.year,
    today.month,
    today.day,
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
  )
  //let dateObject = { hours: cellDateTime.getHours, minutes:cellDateTime.getMinutes, offset: cellDateTime.getTimezoneOffset}
  //DateTime.fromObject(Date.now(), {zone: 'Europe/London'}).set({ hours: cellDateTime.getHours, minutes: cellDateTime.getMinutes})
  //console.log("Cell datetime: " + cellDateTime.toLocaleTimeString(["nl-NL"], { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute:'2-digit'}))
  // return DateTime.fromISO(cellDateTime.toISOString())

  return cellDateTime2
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCellFormulaValue = (row: Excel.Row, cellIndex: number) => {
  const value = row.getCell(cellIndex).value as Excel.CellFormulaValue

  return value.result ? value.result.toString() : ''
}

const readSchedule = (rows: Excel.Row[] | undefined): Schedule => {
  if (rows === undefined) return { activeItem: null, items: [] }

  const filtered = rows.filter(value => !value.getCell(1).isMerged)

  const scheduleItems: ScheduleItem[] = []
  filtered.map((row, index) => {
    if (row.hasValues) {
      const item = {
        id: index + 1,
        timeStart: getTimeValue(getCellDateValue(row.getCell(1))).toFormat(
          'HH:mm',
        ),
        durationInMinutes: row.getCell(2).value as number,
        timeEnd: getTimeValue(getCellDateValue(row.getCell(3))).toFormat(
          'HH:mm',
        ),
        title: row.getCell(4).text ?? '',
      }
      scheduleItems.push(item)
    } else {
      console.log('Skipping row index: ' + index)
      return null
    }
  })

  return { activeItem: null, items: scheduleItems }
}

const getCellDateValue = (cell: Excel.Cell): Date => {
  return cell.formulaType === 0 ? (cell.value as Date) : (cell.result as Date)
}

const callSheetParser = async (
  sheet: Excel.Worksheet,
): Promise<CallSheet | undefined> => {
  if (sheet == null || sheet == undefined) return undefined
  const matchDate = sheet.getRow(1).getCell(1)
  const matchTimeCell = sheet.getRow(3).getCell(1)

  const matchTimeValue = getTimeValue(matchTimeCell.value)

  const matchInfo: MatchInfo = {
    league: sheet.name,
    title: sheet.getRow(1).getCell(4).value?.toString(),
    date: DateTime.fromJSDate(matchDate.value as Date).toFormat('dd-MM-yyyy'),
    startTime: matchTimeValue.toFormat('HH:mm'),
  }

  const scheduleRowStartIndex = 5
  const numberOfRows = sheet.rowCount - 3

  const rows = sheet.getRows(scheduleRowStartIndex, numberOfRows) ?? []
  const schedule = readSchedule(rows)

  const callsheet: CallSheet = {
    matchInfo: matchInfo,
    schedule: schedule,
  }

  return callsheet
}
