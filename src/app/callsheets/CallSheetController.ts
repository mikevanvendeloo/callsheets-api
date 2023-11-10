/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express'
import { readCallSheet } from './CallSheetService'
import * as path from 'path'
import fs from 'fs'
import { callSheetDirectory } from '../index'
import { type CallSheetInfo } from '../types'

function toCallSheetInfo(filenames: string[] | undefined): CallSheetInfo[] {
  if (filenames == null || filenames === undefined) return []

  return filenames.map(fileName => {
    const fileNameParts = fileName.split('__')
    const matchDate = fileNameParts[0]
    const league = fileNameParts[1]
    const matchTitle = fileNameParts[2].replace('.json', '')
    const matchTime = ''
    const callSheetInfo: CallSheetInfo = {
      matchDate,
      matchTime,
      fileName,
      league,
      matchTitle,
    }
    return callSheetInfo
  })
}

export default class CallSheetsController {
  async upload(req: Request, res: Response) {
    const file = req.file
    console.log(req.body)
    if (file === undefined || file == null) {
      res.status(400).json({
        status: 'failed',
        code: '400',
        message: 'Please upload file',
      })
    } else {
      readCallSheet(file.path)
        .then(callsheets => {
          res.status(201).json(callsheets)
        })
        .catch(err => {
          res.status(500).json({
            message:
              'Could not read ' +
              file.path +
              ' or convert the excel sheet to JSON format. Error: ' +
              err,
          })
        })
    }
  }

  async list(req: Request, res: Response) {
    if (callSheetDirectory === undefined || callSheetDirectory == null) {
      throw Error('Callsheet directory is not correctly configured')
    } else {
      try {
        fs.readdir(callSheetDirectory, (err, filenames) => {
          if (err != null) throw err
          const result = toCallSheetInfo(filenames)
          res.status(200).json(result)
        })
      } catch (err: unknown) {
        res.status(500).json({
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Oops, could not read the callsheets. Error: ${err}`,
        })
      }
    }
  }

  async callsheet(req: Request, res: Response) {
    try {
      const sheetFile = path.join(callSheetDirectory, req.params.fileName)
      console.log('Reading callsheet ' + sheetFile)
      const contents = fs.readFileSync(sheetFile, 'utf-8')
      const jsonContents = JSON.parse(contents)
      res.status(200).json(jsonContents)
    } catch (err) {
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  async reindex(req: Request, res: Response) {
    if (callSheetDirectory === undefined || callSheetDirectory == null) {
      throw Error('Callsheet directory is not correctly configured')
    } else {
      try {
        fs.readdir(callSheetDirectory, (err, filenames) => {
          if (err != null) throw err
          const index: CallSheetInfo[] =
            filenames.map(fileName => {
              const sheetFile = path.join(callSheetDirectory, fileName)
              console.log('Reading callsheet ' + sheetFile)
              const contents = fs.readFileSync(sheetFile, 'utf-8')
              const jsonContents = JSON.parse(contents)
              return {
                fileName,
                matchDate: jsonContents.matchInfo.date,
                matchTime: jsonContents.matchInfo.startTime,
                matchTitle: jsonContents.matchInfo.title,
                league: jsonContents.matchInfo.league,
              }
            }) ?? []

          res.status(200).json(index)
        })
      } catch (err: unknown) {
        res.status(500).json({
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Oops, could not read the callsheets. Error: ${err}`,
        })
      }
    }
  }
}
