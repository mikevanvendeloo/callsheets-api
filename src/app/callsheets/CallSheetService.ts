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
  type StreamFunction,
  type Role,
} from '../types'

dotenv.config()
Settings.defaultZone = 'Europe/Amsterdam'

function callSheetMathInfoToFileName(matchInfo: MatchInfo): string {
  return (
    matchInfo.date +
    '__' +
    matchInfo.startTime +
    '__' +
    matchInfo.league +
    '__' +
    matchInfo.title?.replace(/[&\\/\\#,+()$~%.'":*?<>{}]/g, '-')
  )
}

export const readCallSheet = async (fileName: string): Promise<CallSheet[]> => {
  const workbook = new Excel.Workbook()

  const callSheetExcelWorkbook = await workbook.xlsx.readFile(
    path.resolve(fileName),
  )

  const callSheets = await parseSheets(callSheetExcelWorkbook)

  const homeClub =
    callSheets.length > 0
      ? callSheets[callSheets.length - 1].matchInfo.homeClub
      : 'home'
  const awayClub =
    callSheets.length > 0
      ? callSheets[callSheets.length - 1].matchInfo.awayClub
      : 'away'
  const functionsFileName = callSheetMathInfoToFileName(
    callSheets[callSheets.length - 1].matchInfo,
  )

  callSheetExcelWorkbook.worksheets
    .filter(sheet => sheet.name.startsWith('_Rolindeling'))
    .map(async (sheet: Excel.Worksheet) => {
      await parseFunctions(sheet, homeClub, awayClub)
        .then((functions: StreamFunction[]) => {
          writeStreamFunctionsToJSON(functions, functionsFileName)
        })
        .catch(e => {
          console.error(e)
        })
    })

  return callSheets
}

const parseSheets = async (content: Excel.Workbook): Promise<CallSheet[]> => {
  const sheets: CallSheet[] = []
  content.worksheets
    .filter(sheet => !sheet.name.startsWith('_'))
    .map(async (sheet: Excel.Worksheet) => {
      if (sheet === undefined) return null
      return await callSheetParser(sheet)
        .then((callsheet: CallSheet | undefined) => {
          if (callsheet === undefined) return null
          writeCallSheetToJSON(callsheet)
          sheets.push(callsheet)

          return callsheet
        })
        .catch(e => {
          console.error(e)
        })
    })

  return sheets
}

function writeCallSheetToJSON(sheet: CallSheet): void {
  if (sheet != null) {
    fs.writeFile(
      path.join(
        __dirname,
        '../../data/callsheets/',
        callSheetMathInfoToFileName(sheet.matchInfo) + '.json',
      ),
      JSON.stringify(sheet),
      err => {
        if (err != null) {
          console.log('Error writing JSON result file for sheet', err)
        }
      },
    )
  }
}

function writeStreamFunctionsToJSON(
  functions: StreamFunction[],
  fileName: string,
): void {
  fs.writeFile(
    path.join(__dirname, '../../data/', fileName + '-functions.json'),
    JSON.stringify(functions),
    err => {
      if (err != null) {
        console.log('Error writing JSON result file for sheet', err)
      }
    },
  )
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
const getCellFormulaValue = (row: Excel.Row, cellIndex: number): string => {
  const value = row.getCell(cellIndex).value as Excel.CellFormulaValue

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return value.result != null ? value.result.toString() : ''
}

const readSchedule = (rows: Excel.Row[] | undefined): Schedule => {
  if (rows === undefined) return { items: [] }

  const filtered = rows.filter(
    value =>
      !value.getCell(1).isMerged && !(value.getCell(1).font?.strike ?? false),
  )

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
        description: row.getCell(5).text ?? '',
        vMixId: row.getCell(6).text ?? null,
        vMixTitle: row.getCell(7).text ?? null,
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

  const clubs = sheet.getRow(1).getCell(4).value?.toString().split('-') ?? [
    'thuis',
    'uit',
  ]
  const matchInfo: MatchInfo = {
    league: sheet.name,
    title: sheet.getRow(1).getCell(4).value?.toString() ?? '??????',
    date: DateTime.fromJSDate(matchDate.value as Date).toFormat('dd-MM-yyyy'),
    startTime: matchTimeValue.toFormat('HH:mm'),
    homeClub: clubs[0] ?? '??',
    awayClub: clubs[1] ?? '??',
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

const parseFunctions = async (
  sheet: Excel.Worksheet,
  homeTeam: string,
  awayTeam: string,
): Promise<StreamFunction[]> => {
  if (sheet == null || sheet === undefined) throw Error('No functions found')
  const rows = sheet.getRows(2, sheet.rowCount - 1)
  const roles: Role[] = []
  rows?.forEach(row => {
    const role: Role = {
      code: row.getCell(1)?.text,
      displayName: row.getCell(2)?.text,
      personName: row.getCell(5)?.text,
    }
    roles.push(role)
  })
  const rolesMap = roles.reduce((group: Record<string, Role[]>, item) => {
    if (group[item.code] == null) {
      group[item.code] = []
    }
    group[item.code].push(item)
    return group
  }, {})

  const comments = {
    FUNCTION: rolesMap.COMMENTS[0]?.displayName ?? 'Commentaar',
    NAME: rolesMap.COMMENTS.map(item => item.personName).join(' & '),
  }

  const presentation = rolesMap.PRESENTATION.concat(rolesMap.ANALYSIS)

  const presentationFunction = {
    FUNCTION: presentation.map(item => item.displayName).join(' & '),
    NAME: presentation.map(item => item.personName).join(' & '),
  }
  const coachHome = {
    FUNCTION: 'Coach ' + homeTeam.trim(),
    NAME: rolesMap.COACH_HOME.pop()?.personName ?? '',
  }

  const coachAwayMap = rolesMap.COACH_AWAY.pop()
  const coachAway = {
    FUNCTION: coachAwayMap?.displayName + ' ' + awayTeam.trim(),
    NAME: coachAwayMap?.personName ?? '',
  }
  const playerHomeMap = rolesMap.PLAYER_HOME.pop()
  const playerHome = {
    FUNCTION: playerHomeMap?.displayName + ' ' + homeTeam.trim(),
    NAME: playerHomeMap?.personName ?? '',
  }

  const playerAwayMap = rolesMap.PLAYER_AWAY.pop()
  const playerAway = {
    FUNCTION: playerAwayMap?.displayName + ' ' + awayTeam.trim(),
    NAME: playerAwayMap?.personName ?? '',
  }

  // const streamFunctions = rolesMap.map((key: string, personRoles: Role[]) => {
  //   const func: StreamFunction = {
  //     FUNCTION: personRoles[0].displayName,
  //     NAME: personRoles.map(role => role.personName).join(' & '),
  //   }
  //   return func
  // })

  // return roles.map(roleValue => {
  //   const func: StreamFunction = {
  //     FUNCTION: roleValue.displayName,
  //     NAME: roleValue.personName,
  //   }
  //   return func
  // })
  const functions: StreamFunction[] = []
  functions.push(
    comments,
    presentationFunction,
    coachAway,
    playerAway,
    coachHome,
    playerHome,
  )
  console.log(functions)
  return functions
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp')
    .replace(/'/g, '&apos')
    .replace(/"/g, '&quot')
    .replace(/>/g, '&gt')
    .replace(/</g, '&lt')
    .replace(/\//g, '/')
}

// The opposite function:
function htmlUnescape(str: string): string {
  return str
    .replace(/&amp/g, '&')
    .replace(/&apos/g, "'")
    .replace(/&quot/g, '"')
    .replace(/&gt/g, '>')
    .replace(/&lt/g, '<')
}
