import { Image } from "@alleys/kanel"
import { Util } from "@alleys/util"
import { z } from "zod"

/**
 * Actions
 */
type ActionKeys = "edit"
const actionName = "action"
const actionNames: Util.KeyAsValue<ActionKeys> = {
  edit: "edit",
}

/**
 * Edit
 */
type EditKeys = Util.KPick<Image, "source" | "source_link" | "description">
const editNames: Util.KeyAsValue<EditKeys> = {
  source: "source",
  source_link: "source_link",
  description: "description"
}
const editSchema = z.object({
  source:       z.string(),
  source_link:  z.string(),
  description:  z.string(),
}) satisfies Util.KeyAsZod<EditKeys>

/**
 * Composed formData
 */
const reqSchema = editSchema.extend({
  action: z.literal(actionNames.edit),
})

export default {
  action: { name: actionName, names: actionNames },
  edit: { names: editNames, schema: editSchema },
  req: { schema: reqSchema },
}
