import classes from "./styles.module.css"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { useState } from "react"
import { $POLICY } from "~/config"
import config from "./config"
import { useForm } from "@rvf/remix"
import { action } from "./action"
import { loader } from "./loader"
import { SpinnerButton } from "~/components"
import { Util } from "@alleys/util"

export { loader, action }

type InputKey = Util.KeySubset<keyof typeof config.req.names, "unique_name" | "password">
type InputState = {
  [K in InputKey]: {
    [Condition: number]: boolean
  }
}

export default function Page() {
  const navigate = useNavigate()
  const { email } = useLoaderData<typeof loader>()

  const form = useForm({
    validator: config.req.validator,
    method: "post",
    replace: false,
  })
  const msgKey = form.error(config.res.names.msg)
  const msg = msgKey ? config.res.getMsg(msgKey) : null

  const [uniqueNameState, setUniqueNameState] = useState<
  { [K in keyof typeof config.uniqueNameConditions]: boolean }
  >({ 0: false, 1: false, 2: false })
  const [passwordState, setPasswordState] = useState<
  { [K in keyof typeof config.passwordConditions]: boolean }
  >({ 0: false, 1: false })
  const ok = classes["ok"]

  return (
    <>
      <article>
        <fieldset>
          <legend>단계 3 / 3</legend>

          <form {...form.getFormProps()}>
            <div className="field label border suffix">
              <input
                id="email"
                type="email"
                name={config.req.names.email}
                value={email}
                readOnly
                placeholder=" "
              />
              <label htmlFor="email">이메일</label>
              <i>check</i>
            </div>

            <div className="field label border no-margin">
              <input
                id="unique_name"
                type="text"
                name={config.req.names.unique_name}
                onChange={e => {
                  const v = e.currentTarget.value
                  setUniqueNameState(prev => {
                    const next = { ...prev }
                    next[0] = config.uniqueNameConditions[0].safeParse(v).success
                    next[1] = config.uniqueNameConditions[1].safeParse(v).success
                    next[2] = config.uniqueNameConditions[2].safeParse(v).success
                    return next
                  })
                }}
                placeholder=" "
              />
              <label htmlFor="unique_name">사용자 이름</label>
            </div>
            <div className={classes["with-hint"]}>
              <p className={uniqueNameState[0] && uniqueNameState[1] ? ok : ""}>
                길이: {$POLICY.auth.signup.uniqueNameMinLength}-{$POLICY.auth.signup.uniqueNameMaxLength}
              </p>
              <p className={uniqueNameState[2] ? ok : ""}>
                사용 가능: 한글 영문 숫자 대시(-) 언더스코어(_)
              </p>
            </div>

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
            
            <SpinnerButton label="가입하기" type="submit" busy={form.formState.isSubmitting} />
          </form>
          {msg && <p>{msg}</p>}
        </fieldset>
      </article>
    </>
  )
}
