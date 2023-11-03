import { Router } from 'express'
import CallSheetController from './CallSheetController'
import upload from '../upload/upload'
class CallSheetRoutes {
  router = Router()
  controller = new CallSheetController()

  constructor() {
    this.intializeRoutes()
  }

  intializeRoutes() {
    // Uploada new CallSheet
    this.router.post('/', upload.single('file'), this.controller.upload)

    // Retrieve all CallSheets
    this.router.get('/', this.controller.list)

    // Retrieve a single CallSheet with id
    this.router.get('/:fileName', this.controller.callsheet)

    //   // Update a CallSheet with id
    //   this.router.put("/:id", this.controller.update);

    //   // Delete a CallSheet with id
    //   this.router.delete("/:id", this.controller.delete);
  }
}

export default new CallSheetRoutes().router
