export type Post = {
  id: number
  title: string
  content: string
  user_id: number
  created_at: string
  updated_at: string
}

export type PostCreate = {
  title: string
  content: string
}

export type PostUpdate = Partial<PostCreate>

export type PostResponse = PostCreate & {
  id: number
}
