import express from "express"
import postRoutes from "./handlers/posts"
import userRoutes from "./handlers/users"

const app: express.Application = express()
const PORT = process.env.PORT || 3000
export const address = `0.0.0.0:${PORT}`

app.use(express.json())

userRoutes(app)
postRoutes(app)

app.listen(PORT, (): void => {
  console.log(`REST API on ${address}`)
})

export default app
