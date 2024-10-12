import { Application, Request, Response } from "express"
import { verifyAuthToken } from "../middlewares/verifyAuthToken"
import { PostStore } from "../models/post"
import { PostCreate, PostResponse, PostUpdate } from "../types/post"
import { createPostResponse } from "../utils/post"
import { HandlerError } from "./helpers/handleError"

const store = new PostStore()

const index = async (
  _: Request,
  res: Response<
    Array<PostResponse> | { message: string },
    { token: { id: string } }
  >
): Promise<void> => {
  const { id: userId } = res.locals.token
  try {
    const posts = await store.index(userId)
    res.json(posts.map(createPostResponse))
  } catch (err) {
    res.status(500).json({ message: "Something went wrong!" })
  }
}

const create = async (
  { body: post }: Request<{}, {}, PostCreate>,
  res: Response<PostResponse | { message: string }, { token: { id: string } }>
): Promise<void> => {
  const { id: userId } = res.locals.token
  try {
    const newPost = await store.create(userId, post)
    res.json(createPostResponse(newPost))
  } catch (err) {
    res.status(500).json({ message: "Something went wrong!" })
  }
}

const update = async (
  { params: { id }, body: post }: Request<{ id: string }, {}, PostUpdate>,
  res: Response<PostResponse | { message: string }>
): Promise<void> => {
  try {
    const isTheOwnPost = await store.isTheOwnPost(id, res.locals.token.id)
    if (!isTheOwnPost) {
      throw new HandlerError(401, `You can't update another post`)
    }
    const updatedPost = await store.update(id, post)
    res.json(createPostResponse(updatedPost))
  } catch (err) {
    res.status(500).json({ message: "Something went wrong!" })
  }
}

const remove = async (
  { params: { id } }: Request<{ id: string }>,
  res: Response<{ message: string }>
): Promise<void> => {
  try {
    const isTheOwnPost = await store.isTheOwnPost(id, res.locals.token.id)
    if (!isTheOwnPost) {
      throw new HandlerError(401, `You can't delete another post`)
    }
    const deletedPost = await store.remove(id)
    res.json({ message: `Post ${deletedPost.id} deleted` })
  } catch (err) {
    res.status(500).json({ message: "Something went wrong!" })
  }
}

const basePath = "/posts"

const postRoutes = (app: Application): void => {
  app.get(basePath, verifyAuthToken, index)
  app.post(basePath, verifyAuthToken, create)
  app.patch(`${basePath}/:id`, verifyAuthToken, update)
  app.delete(`${basePath}/:id`, verifyAuthToken, remove)
}

export default postRoutes
