import { FolderExhibition } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

const getResSchema = z.object({
  data: z.array(z.string()),
})

type PostReqKey = "id"
const postReqNames: Util.KeyAsValue<PostReqKey> = {
  id: "id"
}
const postReqSchema = z.object({
  id: z.string(),
}) satisfies Util.KeyAsZod<PostReqKey>

const postResSchema = z.object({
  ok:             z.coerce.boolean(),
  folder_id:      z.string(),
  exhibition_id:  z.string(),
})

export default {
  get: {
    res: { schema: getResSchema },
  },
  post: {
    req: { names: postReqNames, schema: postReqSchema },
    res: { schema: postResSchema },
  },
}
