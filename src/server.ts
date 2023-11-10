import express, { type Application } from 'express'
import Server from './app/index'
import ip from 'ip'
import logger from './app/logging/logger'
const app: Application = express()
export const server: Server = new Server(app)
const PORT: number =
  process.env.PORT != null ? parseInt(process.env.PORT, 10) : 4000
const ipAddress = ip.address()

app
  .listen(PORT, '0.0.0.0', function () {
    logger.info(`Server is running on ${ipAddress}:${PORT}.`)
    console.log('App directory: ' + __dirname)
  })
  .on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Error: address already in use')
    } else {
      console.log(err)
    }
  })

export default app
