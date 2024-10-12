import { Post, PostResponse } from "../types/post"

export const createPostResponse = (p: Post): PostResponse => ({
  id: p.id,
  title: p.title,
  content: p.content,
})
