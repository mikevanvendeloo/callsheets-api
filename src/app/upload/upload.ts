import multer from 'multer'
import { uploadDirectory } from '..'

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    },
  }),
})

export default upload
