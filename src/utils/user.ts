import { User, UserResponse } from "../types/user"

export const isTheUser = (idInToken: number, idInRequest: number): boolean =>
  idInToken === idInRequest

export const createUserResponse = (u: User): UserResponse => ({
  id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  email: u.email,
  pictureUrl: u.picture_url,
})
