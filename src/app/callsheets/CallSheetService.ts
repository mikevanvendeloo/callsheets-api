import Excel from 'exceljs'
import { DateTime, Settings } from 'luxon'
import dotenv from 'dotenv'
import * as path from 'path'
import fs from 'fs'
import {
  type CallSheet,
  type Schedule,
  type ScheduleItem,
  type MatchInfo,
} from '../types'

dotenv.config()
Settings.defaultZone = 'Europe/Amsterdam'

export const readCallSheet = async (fileName: string): Promise<CallSheet[]> => {
  const workbook = new Excel.Workbook()
  const content = await workbook.xlsx.readFile(path.resolve(fileName))
  const sheets: CallSheet[] = []

  content.worksheets.forEach(async callsheet => {
    callSheetParser(callsheet).then(sheet => {
      if (sheet != null) {
        sheets.push(sheet)
        fs.writeFile(
          path.join(
            __dirname,
            '../../data/callsheets/',
            sheet.matchInfo.date +
              '__' +
              sheet.matchInfo.startTime +
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
            if (err != null) {
              console.log('Error writing JSON result file for sheet', err)
            }
          },
        )
      }
    })
  })

  return sheets
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
  const cellDateTime2 = DateTime.utc(
    today.year,
    today.month,
    today.day,
    dateObj.getUTCHours(),
    dateObj.getUTCMinutes(),
  )

  return cellDateTime2
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCellFormulaValue = (row: Excel.Row, cellIndex: number) => {
  const value = row.getCell(cellIndex).value as Excel.CellFormulaValue

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return value.result != null ? value.result.toString() : ''
}

const readSchedule = (rows: Excel.Row[] | undefined): Schedule => {
  if (rows === undefined) return { items: [] }

  const filtered = rows.filter(value => !value.getCell(1).isMerged)

  const scheduleItems: ScheduleItem[] = []
  filtered.forEach((row, index) => {
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
    }
  })

  return { items: scheduleItems }
}

const getCellDateValue = (cell: Excel.Cell): Date => {
  return cell.formulaType === 0 ? (cell.value as Date) : (cell.result as Date)
}

const callSheetParser = async (
  sheet: Excel.Worksheet,
): Promise<CallSheet | undefined> => {
  if (sheet == null || sheet === undefined) return undefined
  const matchDate = sheet.getRow(1).getCell(1)
  const matchTimeCell = sheet.getRow(3).getCell(1)

  const matchTimeValue = getTimeValue(matchTimeCell.value)

  const matchInfo: MatchInfo = {
    league: sheet.name,
    title: sheet.getRow(1).getCell(4).value?.toString() ?? '??????',
    date: DateTime.fromJSDate(matchDate.value as Date).toFormat('dd-MM-yyyy'),
    startTime: matchTimeValue.toFormat('HH:mm'),
  }

  const scheduleRowStartIndex = 5
  const numberOfRows = sheet.rowCount - 3

  const rows = sheet.getRows(scheduleRowStartIndex, numberOfRows) ?? []
  const schedule = readSchedule(rows)

  const callsheet: CallSheet = {
    matchInfo,
    schedule,
  }

  return callsheet
}
