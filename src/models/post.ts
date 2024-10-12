import client from "../database"
import { Post, PostCreate, PostUpdate } from "../types/post"

export class PostStore {
  async index(userId: string): Promise<Array<Post>> {
    try {
      const conn = await client.connect()
      const sql = "SELECT * FROM posts WHERE user_id=($1)"
      const result = await conn.query<Post>(sql, [userId])
      conn.release()

      return result.rows
    } catch (err) {
      throw new Error(`Cannot get those posts, ${err}`)
    }
  }

  async create(userId: string, p: PostCreate): Promise<Post> {
    try {
      const conn = await client.connect()
      const sql =
        "INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *"
      const result = await conn.query<Post>(sql, [p.title, p.content, userId])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot create that post, ${err}`)
    }
  }

  async update(id: string, p: PostUpdate): Promise<Post> {
    const fields = Object.keys(p).filter((k) => p[k as keyof PostUpdate])
    const values = fields.map((k)=> p[k as keyof PostUpdate])
    const setString = fields.map((k, i) => `${k}=$${i + 1}`).join(", ")
    try {
      const conn = await client.connect()
      const sql = `UPDATE posts SET ${setString} WHERE id=($${fields.length + 1}) RETURNING *`
      const result = await conn.query<Post>(sql, [...values, id])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot update that post, ${err}`)
    }
  }

  async remove(id: string): Promise<Post> {
    try {
      const conn = await client.connect()
      const sql = "DELETE FROM posts WHERE id=($1) RETURNING *"
      const result = await conn.query<Post>(sql, [id])
      conn.release()

      return result.rows[0]
    } catch (err) {
      throw new Error(`Cannot delete that post, ${err}`)
    }
  }

  async isTheOwnPost(id: string, userId: string): Promise<boolean> {
    try {
      const conn = await client.connect()
      const sql = "SELECT * FROM posts WHERE id=($1) AND user_id=($2)"
      const result = await conn.query<Post>(sql, [id, userId])
      conn.release()

      return result.rows.length > 0
    } catch (err) {
      throw new Error(`Cannot check if it's the own post, ${err}`)
    }
  }
}
