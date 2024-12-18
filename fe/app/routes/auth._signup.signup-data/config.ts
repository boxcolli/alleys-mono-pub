import { User } from "@alleys/kysely"
import { Util } from "@alleys/util"
import { withZod } from "@rvf/zod"
import { z } from "zod"
import { $POLICY } from "~/config"

type ReqKey = Util.KPick<User, "email" | "unique_name"> | "password"
const reqNames: Util.KeyAsValue<ReqKey> = {
  email: "email",
  unique_name: "unique_name",
  password: "password",
}
const uniqueNameConditions = {
  0: z.string().min($POLICY.auth.signup.uniqueNameMinLength),
  1: z.string().max($POLICY.auth.signup.uniqueNameMaxLength),
  2: z.string().regex($POLICY.auth.signup.uniqueNameRegexWithoutLength)
}
const passwordConditions = {
  0: z.string().min($POLICY.auth.signup.passwordMinLength),
  1: z.string().max($POLICY.auth.signup.passwordMaxLength),
}
const reqSchema = z.object({
  email: z.string().email(),
  unique_name: (
    z.string()
    .and(uniqueNameConditions[0])
    .and(uniqueNameConditions[1])
    .and(uniqueNameConditions[2])
  ),
  password: (
    z.string()
    .and(passwordConditions[0])
    .and(passwordConditions[1])
  ),
}) satisfies Util.KeyAsZod<ReqKey>

type ResKey = "msg"
const resNames: Util.KeyAsValue<ResKey> = {
  msg: "msg",
}
const resSchema = z.object({
  msg:  z.string().optional(),
}) satisfies Util.KeyAsZod<ResKey>

const msg = {
  "internal": "오류가 발생했습니다. 만약 이 응답이 반복되면 잠시 후 처음부터 다시 시도해주세요.",
  "email-taken": "이미 존재하는 이메일입니다. 로그인을 시도해주세요.",
  "unique-name-taken": "이미 존재하는 사용자 이름입니다. 다른 이름으로 시도해주세요.",
}

function getMsg(key: string) {
  return msg[key as keyof typeof msg] ?? null
}

export default {
  uniqueNameConditions,
  passwordConditions,
  req: { names: reqNames, schema: reqSchema, validator: withZod(reqSchema) },
  res: { names: resNames, schema: resSchema, msg, getMsg },
}
