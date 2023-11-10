import { type Request, type Response, type NextFunction } from 'express'
import type AppError from './api-error'
import { HttpStatusCode } from './api-error'

export const errorLogger = (
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  console.log(`error ${error.message}`)
  next(error) // calling next middleware
}

// Error handling Middleware function reads the error message
// and sends back a response in JSON format
export const errorResponder = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  response.header('Content-Type', 'application/json')

  const status = error.statusCode ?? HttpStatusCode.BAD_REQUEST
  response.status(status).send(error.message)
}

// Fallback Middleware function for returning
// 404 error for undefined paths
export const invalidPathHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  response.status(404)
  response.send('invalid path')
}
