import { Util } from "@alleys/util"
import { User } from "@alleys/kysely"
import { withZod } from "@rvf/zod"
import { z } from "zod"

type ReqKey = Util.KPick<User, "email"> | "token" | "agree"
const reqNames: Util.KeyAsValue<ReqKey> = {
  email: "email",
  token: "token",
  agree: "agree",
}
const reqSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  agree: z.coerce.boolean().pipe(z.literal(true)),
}) satisfies Util.KeyAsZod<ReqKey>


type ResKey = "message"
const resNames: Util.KeyAsValue<ResKey> = {
  message: "message",
}
const resSchema = z.object({
  message:  z.string().optional(),
}) satisfies Util.KeyAsZod<ResKey>

const msg = {
  "turnstile-fail": "로봇 테스트에 실패했습니다. 새로고침 후 다시 시도해주세요.",
  "internal": "오류가 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
}

function getMsg(key: string) {
  return msg[key as keyof typeof msg] ?? null
}

export default {
  req: { names: reqNames, schema: reqSchema, validator: withZod(reqSchema) },
  res: { names: resNames, schema: resSchema, msg, getMsg },
}
