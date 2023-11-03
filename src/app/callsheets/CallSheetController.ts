import { Request, Response } from 'express'
import { readCallSheet } from './CallSheetService'
import * as path from 'path'
import fs from 'fs'
import logger from '../logging/logger'
import { callSheetDirectory } from '../index'

type CallSheetInfo = {
  matchDate: string
  league: string
  matchTitle: string
  fileName: string
}

function toCallSheetInfo(filenames: string[] | undefined): CallSheetInfo[] {
  if (!filenames) return []

  return filenames.map(fileName => {
    const fileNameParts = fileName.split('__')
    const matchDate = fileNameParts[0]
    const league = fileNameParts[1]
    const matchTitle = fileNameParts[2].replace('.json', '')
    return {
      fileName: fileName,
      matchDate: matchDate,
      league: league,
      matchTitle: matchTitle,
    } as CallSheetInfo
  })
}

export default class CallSheetsController {
  async upload(req: Request, res: Response) {
    try {
      const file = req.file

      if (!file) {
        return res.status(400).json({
          status: 'failed',
          code: '400',
          message: 'Please upload file',
        })
      }

      const result = readCallSheet(file.path)
      result.then(callsheets => {
        res.status(201).json(callsheets)
      })
    } catch (err) {
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  async list(req: Request, res: Response) {
    try {
      fs.readdir(callSheetDirectory, (err, filenames) => {
        const result = toCallSheetInfo(filenames)
        res.status(200).json(result)
      })
    } catch (err) {
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }

  async callsheet(req: Request, res: Response) {
    try {
      console.log(req.params)
      const sheetFile = path.join(callSheetDirectory, req.params.fileName)
      logger.info('Reading callsheet')
      const contents = fs.readFileSync(sheetFile, 'utf-8')
      const jsonContents = JSON.parse(contents)
      res.status(200).json(jsonContents)
    } catch (err) {
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }
}
