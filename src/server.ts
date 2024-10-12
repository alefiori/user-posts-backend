import express from "express"
import userRoutes from "./handlers/users"

const app: express.Application = express()
const PORT = process.env.PORT || 3000
export const address = `0.0.0.0:${PORT}`

app.use(express.json())

userRoutes(app)

app.listen(PORT, (): void => {
  console.log(`REST API on ${address}`)
})

export default app
