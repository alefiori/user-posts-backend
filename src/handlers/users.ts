import express, { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { verifyAuthToken } from "../middlewares/verifyAuthToken"
import { UserStore } from "../models/user"
import { UserCreate, UserCredentials, UserUpdate } from "../types/user"
import { createUserResponse, isTheUser } from "../utils/user"
import { HandlerError } from "./helpers/handleError"

const store = new UserStore()

const show = async (req: Request, res: Response): Promise<void> => {
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
  res: Response
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
  res: Response
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
  res: Response
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
  res: Response
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

const userRoutes = (app: express.Application): void => {
  app.get("/users/:id", verifyAuthToken, show)
  app.post("/users", create)
  app.post("/users/authenticate", authenticate)
  app.delete("/users/:id", verifyAuthToken, remove)
  app.patch("/users/:id", verifyAuthToken, update)
}

export default userRoutes
