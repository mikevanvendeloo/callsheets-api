import express, { Application } from 'express'
import cors, { CorsOptions } from 'cors'
import Routes from './routes'
import requestLogging from './logging/requestLogging'
import path from 'path'

export const dataDirectory = path.join(__dirname, '../../data')
export const callSheetDirectory = path.join(dataDirectory, 'callsheets')

export default class Server {
  constructor(app: Application) {
    this.config(app)
    new Routes(app)
  }

  private config(app: Application): void {
    const corsOptions: CorsOptions = {
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
      exposedHeaders: [
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
  }
}
