import express, { type Application } from 'express'
import cors, { type CorsOptions } from 'cors'
import Routes from './routes'
import requestLogging from './logging/requestLogging'
import path from 'path'
import 'express-async-errors' // <---------- apply async error patch
import { errorHandler } from './error-handling/ErrorHandling'

export const dataDirectory = path.join(__dirname, '../data')
export const callSheetDirectory = path.join(dataDirectory, 'callsheets')
export const uploadDirectory = path.join(dataDirectory, 'uploads')
export const loggingDirectory = path.join(dataDirectory, 'logs')

export default class Server {
  constructor(app: Application) {
    this.config(app)
    // eslint-disable-next-line no-new
    new Routes(app)
  }

  private config(app: Application): void {
    const corsOptions: CorsOptions = {
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
      exposedHeaders: [
        'Access-Control-Allow-Headers',
        'Content-Length',
        'origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
    }

    app.use(cors(corsOptions))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(requestLogging)
    app.use(errorHandler)

    console.log('Logging directory: ' + loggingDirectory)
    console.log('Data directory: ' + dataDirectory)
    console.log('Callsheet directory: ' + callSheetDirectory)
    console.log('Upload directory: ' + uploadDirectory)
  }
}
