import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { Application, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { s3, upload } from "../fileStorage"
import { verifyAuthToken } from "../middlewares/verifyAuthToken"
import { UserStore } from "../models/user"
import {
  UserCreate,
  UserCredentials,
  UserResponse,
  UserUpdate,
} from "../types/user"
import { comparePassword, createUserResponse, isTheUser } from "../utils/user"
import { HandlerError } from "./helpers/handleError"

const store = new UserStore()

const show = async (
  req: Request,
  res: Response<UserResponse | { message: string }>
): Promise<void> => {
  const user_id = req.params.id
  try {
    const user = await store.show(user_id)
    const isTheOwnUser = isTheUser(
      parseInt(res.locals.token.id),
      parseInt(user_id)
    )
    if (!user) {
      throw new HandlerError(404, `We don't have that user`)
    }
    if (!isTheOwnUser) {
      throw new HandlerError(401, `You can't see another user`)
    }
    res.json(createUserResponse(user))
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const create = async (
  { body: user }: Request<{}, {}, UserCreate>,
  res: Response<{ id: number; token: string } | { message: string }>
): Promise<void> => {
  try {
    if (!user.email) {
      throw new HandlerError(400, `email is required`)
    }
    if (!user.firstName) {
      throw new HandlerError(400, `firstName is required`)
    }
    if (!user.lastName) {
      throw new HandlerError(400, `lastName is required`)
    }
    if (!user.password) {
      throw new HandlerError(400, `password is required`)
    }
    const userExists = await store.showByEmail(user.email)
    if (userExists) {
      throw new HandlerError(
        400,
        `User with email ${user.email} already exists`
      )
    }
    const createUser = await store.create(user)
    const token = jwt.sign({ user: createUser }, process.env.TOKEN_SECRET || "")
    res.json({ id: createUser.id, token })
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const authenticate = async (
  { body }: Request<{}, {}, UserCredentials>,
  res: Response<{ id: number; token: string } | { message: string }>
): Promise<void> => {
  try {
    const user = await store.authenticate(body)
    if (!user) {
      throw new HandlerError(401, `Wrong email or password`)
    }
    const token = await jwt.sign({ user }, process.env.TOKEN_SECRET || "")
    res.json({ id: user.id, token })
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const remove = async (
  { params: { id } }: Request<{ id: string }>,
  res: Response<{ message: string }>
): Promise<void> => {
  try {
    const isTheOwnUser = isTheUser(parseInt(res.locals.token.id), parseInt(id))
    if (!isTheOwnUser) {
      throw new HandlerError(401, `You can't delete another user`)
    }
    const deleteUser = await store.remove(id)
    res.json({ message: `User ${deleteUser.id} deleted` })
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const update = async (
  { params: { id }, body: user }: Request<{ id: string }, {}, UserUpdate>,
  res: Response<UserResponse | { message: string }>
): Promise<void> => {
  try {
    const isTheOwnUser = isTheUser(parseInt(res.locals.token.id), parseInt(id))
    if (!isTheOwnUser) {
      throw new HandlerError(401, `You can't update another user`)
    }
    const updateUser = await store.update(id, user)
    res.json(createUserResponse(updateUser))
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const updatePassword = async (
  {
    params: { id },
    body: { oldPassword, newPassword },
  }: Request<{ id: string }, {}, { oldPassword: string; newPassword: string }>,
  res: Response<{ message: string }>
): Promise<void> => {
  try {
    const isTheOwnUser = isTheUser(parseInt(res.locals.token.id), parseInt(id))
    if (!isTheOwnUser) {
      throw new HandlerError(401, `You can't update another user`)
    }
    const user = await store.show(id)
    const isPasswordMatch = comparePassword(oldPassword, user.password_digest)
    if (!isPasswordMatch) {
      throw new HandlerError(401, `Wrong password`)
    }
    const updateUser = await store.updatePassword(id, newPassword)
    res.json({ message: `User ${updateUser.id} password updated` })
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const uploadProfilePicture = async (
  { params: { id }, ...req }: Request<{ id: string }>,
  res: Response<{ url: string } | { message: string }>
) => {
  try {
    if (!req.file) {
      throw new HandlerError(400, "File is required")
    }
    const isTheOwnUser = isTheUser(parseInt(res.locals.token.id), parseInt(id))
    if (!isTheOwnUser) {
      throw new HandlerError(401, `You can't update another user`)
    }
    const { Contents } = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME || "",
        Prefix: `${id}/`,
      })
    )
    if (Contents?.length) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME || "",
          Delete: {
            Objects: Contents.map(({ Key }) => ({ Key })),
          },
        })
      )
    }
    const Key = `${id}/${req.file.originalname}`
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || "",
        Key,
        Body: req.file.buffer,
      })
    )
    res.json({
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`,
    })
  } catch (err) {
    if (err instanceof HandlerError) {
      res.status(err.statusCode).json({ message: err.message })
    } else {
      res.status(500).json({ message: "Something went wrong!" })
    }
  }
}

const basePath = "/users"

const userRoutes = (app: Application): void => {
  app.get(`${basePath}/:id`, verifyAuthToken, show)
  app.post(basePath, create)
  app.post(`${basePath}/authenticate`, authenticate)
  app.delete(`${basePath}/:id`, verifyAuthToken, remove)
  app.patch(`${basePath}/:id`, verifyAuthToken, update)
  app.patch(`${basePath}/:id/password`, verifyAuthToken, updatePassword)
  app.post(
    `${basePath}/:id/image`,
    verifyAuthToken,
    upload.single("file"),
    uploadProfilePicture
  )
}

export default userRoutes
