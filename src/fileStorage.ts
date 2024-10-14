import { S3Client } from "@aws-sdk/client-s3"
import multer from "multer"

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
})

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})
