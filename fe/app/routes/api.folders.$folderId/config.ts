import { Folder } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { z } from "zod"

type PutReqKey = Util.KPick<Folder, "name" | "is_public">
const putReqSchema = z.object({
  name:       z.string().optional(),
  is_public:  z.coerce.boolean().optional()
}) satisfies Util.KeyAsZod<PutReqKey>

export default {
  put: {
    req: { schema: putReqSchema },
  },
}
