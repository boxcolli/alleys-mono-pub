import { Util } from "@alleys/util"
import { withZod } from "@rvf/zod"
import { z } from "zod"
import { $POLICY } from "~/config"

type ReqKeys = "code" | "password"
const reqNames: Util.KeyAsValue<ReqKeys> = {
  code: "code",
  password: "password",
}

const passwordConditions = {
  0: z.string().min($POLICY.auth.signup.passwordMinLength),
  1: z.string().max($POLICY.auth.signup.passwordMaxLength),
}
const reqSchema = z.object({
  code: z.string().length($POLICY.auth.reset.emailVerifyCodeLength),
  password: (
    z.string()
    .and(passwordConditions[0])
    .and(passwordConditions[1])
  ),
}) satisfies Util.KeyAsZod<ReqKeys>

type ResKey = "msg"
const resNames: Util.KeyAsValue<ResKey> = {
  msg: "msg",
}
const resSchema = z.object({
  msg:  z.string().optional(),
}) satisfies Util.KeyAsZod<ResKey>

const msg = {
  "internal": "오류가 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
  "expired": "코드가 만료되었습니다. 다시 시도해주세요.",
  "invalid": "코드가 일치하지 않습니다."
}
function getMsg(key: string) {
  return msg[key as keyof typeof msg] ?? null
}

export default {
  passwordConditions,
  req: { names: reqNames, schema: reqSchema, validator: withZod(reqSchema) },
  res: { names: resNames, schema: resSchema, msg, getMsg },
}
