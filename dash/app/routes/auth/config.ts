import { Util } from "@alleys/util"
import { z } from "zod"

type ReqKeys = "user" | "otp" | "token"
const reqNames: Util.KeyAsValue<ReqKeys> = {
  user: "user",
  otp: "otp",
  token: "token",
}
const reqSchema = z.object({
  user:   z.string().min(1),
  otp:    z.string().min(1),
  token:  z.string().min(1),
}) satisfies Util.KeyAsZod<ReqKeys>

type ResKeys = "msg"
const resSchema = z.object({
  msg: z.string(),
}) satisfies Util.KeyAsZod<ResKeys>

export default {
  req: { names: reqNames, schema: reqSchema },
  res: { schema: resSchema },
  sessionTTLSec: 3_600,
}

export type UserRow = {
  username: string
  otp_secret: string
}
