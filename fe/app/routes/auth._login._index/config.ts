import { Util } from "@alleys/util"
import { withZod } from "@rvf/zod"
import { z } from "zod"

type ReqKey = "email" | "password"
const reqNames: Util.KeyAsValue<ReqKey> = {
  email: "email",
  password: "password",
}
const reqSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}) satisfies Util.KeyAsZod<ReqKey>

type ResKey = "msg"
const resNames: Util.KeyAsValue<ResKey> = {
  msg: "msg",
}
const resSchema = z.object({
  msg:  z.string().optional(),
}) satisfies Util.KeyAsZod<ResKey>

const msg = {
  "not-found": "이메일 또는 비밀번호가 잘못되었습니다.",
  "internal": "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
}
function getMsg(key: string) {
  return msg[key as keyof typeof msg] ?? null
}

export default {
  req: { names: reqNames, schema: reqSchema, validator: withZod(reqSchema) },
  res: { names: resNames, schema: resSchema, msg, getMsg },
}
