import { Util } from "@alleys/util"
import { withZod } from "@rvf/zod"
import { z } from "zod"
import { $POLICY } from "~/config"

type ReqKey = "code"
const reqNames: Util.KeyAsValue<ReqKey> = {
  code: "code",
}

const reqSchema = z.object({
  code: z.string().length($POLICY.auth.signup.emailVerifyCodeLength),
}) satisfies Util.KeyAsZod<ReqKey>

const msg = {
  "incorrect": "코드가 일치하지 않습니다. 올바른 코드를 입력해주세요.",
  "internal": "오류가 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
  "code-expired": "코드가 만료되었습니다. 재전송 버튼을 눌러주세요.",
}
function getMsg(key: string) {
  return msg[key as keyof typeof msg] ?? null
}

export default {
  req: { names: reqNames, schema: reqSchema, validator: withZod(reqSchema) },
  res: { msg, getMsg },
}
