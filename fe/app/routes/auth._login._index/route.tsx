import classes from "./styles.module.css"

import { useNavigate } from "@remix-run/react"
import { useForm } from "@rvf/remix"
import { $PATH } from "~/config"
import config from "./config"
import { action } from "./action"

export { action }

export default function Page() {
  const form = useForm({ validator: config.req.validator, method: "post" })
  const msgKey = form.error(config.res.names.msg)
  const msg = msgKey ? config.res.getMsg(msgKey) : null

  return (
    <>
      <h2>로그인</h2>
      <div className="row">
        계정이 없나요?&nbsp;
        <a href={$PATH.auth.signup}>
          <p className="primary-text"><strong>회원가입</strong></p>
        </a>
      </div>
      
      <div className="row">
        비밀번호를 잊어버렸나요?&nbsp;
        <a href={$PATH.auth.reset}>
          <p className="primary-text"><strong>비밀번호 재설정</strong></p>
        </a>
      </div>

      <article className="">
        <fieldset>
          <legend>로그인</legend>
          <form {...form.getFormProps()}>
            <div className="field border label">
              <input id="email" type="email" name={config.req.names.email} placeholder=" " />
              <label htmlFor="email">이메일</label>
            </div>

            <div className="field border label">
              <input id="password" type="password" name={config.req.names.password} placeholder=" " />
              <label htmlFor="password">비밀번호</label>
            </div>
            
            {/* <SpinnerButton label="로그인" type="submit" busy={form.formState.isSubmitting} /> */}
            <button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? <progress className="circle small"/>
                : "로그인"
              }
            </button>
          </form>
          {msg && <p>{msg}</p>}
        </fieldset>
      </article>
    </>
  )
}
