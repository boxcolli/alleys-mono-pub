import { Hono } from "hono"
import image from "./image"

const app = new Hono<{ Bindings: Env }>()

app.get("/", c => {
  return c.redirect(c.env.REDIRECT)
})

app.route("/", image.app)

export default app
