import classes from "./style.module.css"
import { useActionData, useFetcher, useLoaderData, useNavigate, useSubmit } from "@remix-run/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Timer } from "~/components"
import { $PATH, $POLICY } from "~/config"
import config from "./config"
import { action } from "./action"
import { loader } from "./loader"
import resendConfig from "../api.signup.resend-email/config"
import { action as resendAction } from "../api.signup.resend-email/route"
import { useDebounce } from "~/client"

export { loader, action }

export default function Page() {
  const { email, sendTime: sendTimeStr } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const submit = useSubmit()

  const inputRef = useRef<HTMLInputElement>(null)
  const deleteInput = () => { if (inputRef.current) inputRef.current.value = "" }

  /**
   * Timer
   */
  const [sendTime, setSendTime] = useState(new Date(sendTimeStr))
  const timerInit = Date.now() - sendTime.getTime()
  const timerMax = $POLICY.auth.signup.emailVerifyCodeExpireSeconds * 1000

  /**
   * Expiration
   */
  const [expired, setExpired] = useState(timerInit > timerMax)
  const onExpire = useCallback(() => setExpired(true), [expired])
  
  /**
   * Message
   */
  const actionData = useActionData<typeof action>()
  const message = actionData ? actionData.fieldErrors["message"] : null

  /**
   * Resend email
   */
  const resendFetcher = useFetcher<typeof resendAction>()
  const resendEmail = useDebounce(
    () => resendFetcher.submit({}, { action: $PATH.api.auth.signup.resendEmail, method: "post" }),
    100,
  )
  const isResendSubmitting = resendFetcher.state !== "idle"
  useEffect(() => {
    if (resendFetcher.state !== "idle") return

    const parsed = resendConfig.res.schema.safeParse(resendFetcher.data)
    if (parsed.error) return

    // Reset state
    setExpired(false)
    setSendTime(parsed.data.send_time)
    deleteInput()
  }, [resendFetcher.state, expired])

  return (
    <>
      <article className={classes["form-layout"]}>
        <fieldset>
          <legend>단계 2 / 3</legend>
          <p>
            {email}로 이메일을 보냈어요. 이메일을 확인하고 코드를 아래에 입력해주세요.
          </p>
          <div>
            <div className="field label suffix border no-margin">
              <input
                name={config.req.names.code}
                type="text"
                maxLength={$POLICY.auth.signup.emailVerifyCodeLength}
                disabled={expired}
                onChange={e => {
                  const v = e.currentTarget.value
                  if (v.length == $POLICY.auth.signup.emailVerifyCodeLength) {
                    const formData = new FormData()
                    formData.set(config.req.names.code, v)
                    submit(formData, { method: "post" })
                  }
                }}
                ref={inputRef}
                placeholder=" "
              />
              <label>{$POLICY.auth.signup.emailVerifyCodeLength}자리 코드</label>
            </div>
            {message && <p>{message}</p>}
          </div>
          
          <Timer init={timerInit} max={timerMax} onComplete={onExpire} />

          {expired
            ? <p>전송된 코드가 만료되었습니다. 재전송 버튼을 눌러 새로운 코드를 생성해주세요.</p>
            : null
          }
          <button
            disabled={isResendSubmitting}
            onClick={resendEmail}
          >
            {isResendSubmitting
              ? <progress className="circle small"/>
              : "재전송"
            }
          </button>
          {/* <SpinnerButton label={"재전송"} busy={fetcher.state !== "idle"} onClick={resendEmail} /> */}
          
        </fieldset>
      </article>

      <section>
        <h5 className="small">이미 가입한 이메일인가요?</h5>
        <p className="padding">
          <a href={$PATH.auth.login} className="primary-text">로그인</a>&nbsp;
          또는&nbsp;
          <a href={$PATH.auth.reset} className="primary-text">비밀번호 재설정</a>
          을 해주세요.
        </p>

        <h5 className="small">이메일을 받지 못했나요?</h5>
        <p className="padding">
          이메일이 전송되는데 시간이 걸릴 수 있어요. <br />
          스팸메일함을 확인해주세요. <br />
          이메일이 오지 않는다면 [재전송] 버튼을 눌러주세요.
        </p>
        <ul className="font-size-sm">
          
        </ul>

        <h5 className="small">이메일 주소가 잘못됐나요?</h5>
        <p className="padding">
          <a href={$PATH.auth.signup} className="primary-text">이전 단계</a>
          로 돌아가서 이메일을 입력해주세요.
        </p>
      </section>
    </>
  )
}
