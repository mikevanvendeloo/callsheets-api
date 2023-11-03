import { Request, Response } from 'express'

export default class HealthController {
  async health(req: Request, res: Response) {
    try {
      res.status(200).json({ status: 'OK' })
    } catch (err) {
      res.status(500).json({
        message: 'Internal Server Error!',
      })
    }
  }
}
