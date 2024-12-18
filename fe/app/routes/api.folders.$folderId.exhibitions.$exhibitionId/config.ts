import { z } from "zod";

const delResSchema = z.object({
  ok:             z.coerce.boolean(),
  folder_id:      z.string(),
  exhibition_id:  z.string(),
})

export default {
  del: {
    res: {schema: delResSchema },
  },
}
