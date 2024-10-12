export type User = {
  id: number
  password_digest: string
  first_name: string
  last_name: string
  email: string
  picture_url?: string
  created_at: string
  updated_at: string
}

export type UserCredentials = {
  email: string
  password: string
}

export type UserCreate = UserCredentials & {
  firstName: string
  lastName: string
  pictureUrl?: string
}

export type UserUpdate = Partial<UserCreate>

export type UserResponse = {
  id: number
  firstName: string
  lastName: string
  email: string
  pictureUrl?: string
}
