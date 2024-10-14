import bcrypt from "bcrypt"
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

export const comparePassword = (
  password: string,
  passwordDigest: string
): boolean => bcrypt.compareSync(password, passwordDigest)
