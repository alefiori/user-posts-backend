import bcrypt from "bcrypt"
import client from "../database"
import { User, UserCreate, UserCredentials, UserUpdate } from "../types/user"

const { SALT_ROUNDS: saltRounds } = process.env

export class UserStore {
  async show(id: string): Promise<User> {
    try {
      const conn = await client.connect()
      const sql = "SELECT * FROM users WHERE id=($1)"
      const result = await conn.query<User>(sql, [id])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot get that user, ${err}`)
    }
  }

  async showByEmail(email: string): Promise<User> {
    try {
      const conn = await client.connect()
      const sql = "SELECT * FROM users WHERE email=($1)"
      const result = await conn.query<User>(sql, [email])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot get that user, ${err}`)
    }
  }

  async create(u: UserCreate): Promise<User> {
    try {
      const conn = await client.connect()
      const hash = bcrypt.hashSync(u.password, parseInt(saltRounds as string))
      const sql =
        "INSERT INTO users (email, first_name, last_name, password_digest) VALUES ($1, $2, $3, $4) RETURNING *"
      const result = await conn.query<User>(sql, [
        u.email,
        u.firstName,
        u.lastName,
        hash,
      ])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot create that user, ${err}`)
    }
  }

  async authenticate(u: UserCredentials): Promise<User | null> {
    try {
      const conn = await client.connect()
      const sql = "SELECT * FROM users WHERE email=($1)"
      const result = await conn.query<User>(sql, [u.email])
      if (result.rows.length) {
        const user = result.rows[0]
        if (bcrypt.compareSync(u.password, user.password_digest)) {
          return user
        }
      }
      conn.release()

      return null
    } catch (err) {
      throw new Error(`Cannot authenticate. ${err}`)
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const conn = await client.connect()
      const sql = "DELETE FROM users WHERE id=($1) RETURNING *"
      const result = await conn.query(sql, [id])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot delete that user, ${err}`)
    }
  }

  async update(id: string, u: UserUpdate): Promise<User> {
    const fields = Object.keys(u).filter((k) => u[k as keyof UserUpdate])
    const values = fields.map((k) => u[k as keyof UserUpdate])
    const setStr = fields.map((k, i) => `${k}=$${i + 1}`).join(", ")
    try {
      const conn = await client.connect()
      const sql = `UPDATE users SET ${setStr} WHERE id=($${
        fields.length + 1
      }) RETURNING *`
      const result = await conn.query<User>(sql, [...values, id])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot update that user, ${err}`)
    }
  }
}
