import { AlertType } from "~/config"

type AlertKey =
  "internal" |
  "reset-success" |
  "signup-error-after-success" |
  "signup-session-expired"

type AlertValue<K> = {
  name: K
  type: AlertType
  msg: string
}
type AlertObject = { [K in AlertKey]: AlertValue<K> }

export const alerts: AlertObject = {
  internal: {
    name: "internal",
    type: "error",
    msg: "오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  },
  "reset-success": {
    name: "reset-success",
    type: "success",
    msg: "비밀번호가 재설정되었습니다. 로그인해주세요."
  },
  "signup-error-after-success": {
    name: "signup-error-after-success",
    type: "info",
    msg: "회원가입에 성공했습니다. 로그인해주세요."
  },
  "signup-session-expired": {
    name: "signup-session-expired",
    type: "info",
    msg: "세션이 만료되었습니다. 다시 시도해주세요."
  },
}
