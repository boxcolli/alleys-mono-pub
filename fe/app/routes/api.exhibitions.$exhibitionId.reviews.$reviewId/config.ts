import { Review, User } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

type PutReqKey = Util.KPick<Review, "title" | "content" | "is_content_public">
const putReqNames: Util.KeyAsValue<PutReqKey> = {
  title: "title",
  content: "content",
  is_content_public: "is_content_public"
}
const putReqSchema = z.object({
  title:              z.string(),
  content:            z.string(),
  is_content_public:  z.coerce.boolean(),
}) satisfies Util.KeyAsZod<PutReqKey>

const putResSchema = z.object({
  review_id:  z.string(),
  created_at: z.coerce.date(),
})

const delResSchema = z.object({
  review_id:  z.string(),
})

export default {
  put: {
    req: { names: putReqNames, schema: putReqSchema },
    res: { schema: putResSchema },
  },
  del: {
    res: { schema: delResSchema },
  }
}
