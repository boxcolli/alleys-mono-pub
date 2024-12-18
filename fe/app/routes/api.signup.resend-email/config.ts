import { z } from "zod"

const resSchema = z.object({
  send_time: z.coerce.date(),
})

export default {
  res: { schema: resSchema },
}
