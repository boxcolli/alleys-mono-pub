import { Folder } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { withZod } from "@rvf/zod"
import { z } from "zod"

type PostReqKey = Util.KPick<Folder, "name" | "is_public">
const postReqNames: Util.KeyAsValue<PostReqKey> = {
  name: "name",
  is_public: "is_public"
}
const postReqSchema = z.object({
  name:       z.string().min(1),
  is_public:  z.coerce.boolean(),
}) satisfies Util.KeyAsZod<PostReqKey>

const postResSchema = z.object({
  id: z.string(),
}) satisfies Util.KeyAsZod<Util.KPick<Folder, "id">>

export default {
  post: {
    req: { names: postReqNames, schema: postReqSchema, validator: withZod(postReqSchema) },
    res: { schema: postResSchema },
  },
}
