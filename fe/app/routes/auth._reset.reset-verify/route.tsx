import classes from "./styles.module.css"

import { useForm } from "@rvf/remix";
import { Timer } from "~/components";
import { $PATH, $POLICY } from "~/config";
import config from "./config";
import { useCallback, useState } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { loader } from "./loader";
import { action } from "./action";

export { loader, action }

export default function Page() {
  const { email, sendTime } = useLoaderData<typeof loader>()

  /**
   * Timer
   */
  const sendTimeInDate = new Date(sendTime ?? "")
  const timerInit = Date.now() - sendTimeInDate.getTime()
  const timerMax = $POLICY.auth.reset.emailVerifyCodeExpireSeconds * 1000
  const [expired, setExpired] = useState<boolean>(false)
  const onExpire = useCallback(() => setExpired(true), [expired])
  
  /**
   * Form
   */
  const form = useForm({
    validator: config.req.validator,
    method: "put",
    replace: false,
  })
  const msgKey = form.error(config.res.names.msg)
  const msg = msgKey ? config.res.getMsg(msgKey) : null

  const [passwordState, setPasswordState] = useState<
  { [K in keyof typeof config.passwordConditions]: boolean }
  >({ 0: false, 1: false })
  const ok = classes["ok"]
  
  return (
    <>
      <article>
        <fieldset>
          <legend>단계 2 / 2</legend>
          {expired
            ? (
              <p>
                코드가 만료되었습니다.&nbsp;
                <a href={$PATH.auth.reset}><p className="primary-text"><strong>이전 단계</strong></p></a>
                에서 다시 시도해주세요.</p>
            )
            : (
              <p>
                {email}로 이메일을 보냈어요. <br />
                이메일을 확인하고 전송된 일회용 코드와 함께 새 비밀번호를 입력하세요.
                코드는 {Math.floor($POLICY.auth.reset.emailVerifyCodeExpireSeconds / 60)}분간 유효합니다.
              </p>
            )
          }

          <form {...form.getFormProps()}>
            {/* <CodeInput
              name={config.req.names.code}
              length={$POLICY.auth.reset.emailVerifyCodeLength}
              charSet={"numeric"}
              isDisabled={expired}
            /> */}
            <div className="field label border no-margin">
              <input
                name={config.req.names.code}
                type="text"
                maxLength={$POLICY.auth.reset.emailVerifyCodeLength}
                disabled={expired}
              />
              <label>{$POLICY.auth.reset.emailVerifyCodeLength}자리 코드</label>
            </div>
            <Timer init={timerInit} max={timerMax} onComplete={onExpire} />

            <div className="small-padding" />

            <div className="field label border no-margin">
              <input
                id="password"
                type="password"
                name={config.req.names.password}
                onChange={e => {
                  const v = e.currentTarget.value
                  setPasswordState(prev => {
                    const next = { ...prev }
                    next[0] = config.passwordConditions[0].safeParse(v).success
                    next[1] = config.passwordConditions[1].safeParse(v).success
                    return next
                  })
                }}
                placeholder=" "
              />
              <label htmlFor="password">비밀번호</label>
            </div>
            <div className={classes["with-hint"]}>
              <p className={passwordState[0] && passwordState[1] ? ok : ""}>
                길이: {$POLICY.auth.signup.passwordMinLength}-{$POLICY.auth.signup.passwordMaxLength}
              </p>
            </div>

            <button>비밀번호 재설정</button>
          </form>
          {msg && <p>{msg}</p>}
        </fieldset>
      </article>
    </>
  )
}
