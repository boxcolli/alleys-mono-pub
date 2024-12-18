import classes from "./styles.module.css"

import { json, LoaderFunctionArgs } from "@remix-run/cloudflare"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { Turnstile } from "@marsidev/react-turnstile"
import { useRef, useState } from "react"
import { $PATH, $STORAGE } from "~/config"
import { useForm } from "@rvf/remix"
import config from "./config"
import { action } from "./action"
import { z } from "zod"
import { createPortal } from "react-dom"

export async function loader({ context }: LoaderFunctionArgs) {
  return json({ siteKey: context.cloudflare.env.TURNSTILE_SITE_KEY })
}
// export const action = $action
export { action }

export default function Page() {
  const { siteKey } = useLoaderData<typeof loader>()
  const [pass, setPass] = useState(false)
  const navigate = useNavigate()
  
  const form = useForm({
    validator: config.req.validator,
    method: "post",
    replace: false,
  })
  const msgKey = form.error(config.res.names.message)
  const msg = msgKey ? config.res.getMsg(msgKey) : null
  
  const [showModal, setShowModal] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const [agree, setAgree] = useState(false)
  
  return (
    <>
      <div className="row">
        이미 계정이 있나요? &nbsp;
        <a href={$PATH.auth.login}
          onClick={e => {
            e.preventDefault()
            navigate($PATH.auth.login, { preventScrollReset: true, replace: true })
          }}
        >
          <p className="primary-text"><strong>로그인하기</strong></p>
        </a>
      </div>

      <article className={classes["form-layout"]}>
        <fieldset>
          <legend>단계 1 / 3</legend>
          <form
            {...form.getFormProps()}
            className=""
          >
            <div className="field label border no-margin">
              <input
                id="email"
                type="email"
                name={config.req.names.email}
                ref={emailRef}
                placeholder=" "
              />
              <label htmlFor="email">이메일</label>
            </div>

            <label className="checkbox" onClick={e => {
              console.log({ agree })
              if (agree) { return }
              e.preventDefault()
              setShowModal(true)
            }}>
              <input
                id={config.req.names.agree}
                type="checkbox"
                name={config.req.names.agree}
                checked={agree}
                onChange={e => setAgree(e.currentTarget.checked)}
              />
              <span>이용약관에 동의합니다.</span>
            </label>

            <Turnstile
              siteKey={siteKey}
              options={{ language: "ko-kr", responseFieldName: config.req.names.token }}
              onError={(_) => setPass(false)}
              onExpire={() => setPass(false)}
              onSuccess={(_) => setPass(true)}
              className="turnstile"
            />

            {/* <SpinnerButton label={"인증코드 받기"} type="submit" busy={form.formState.isSubmitting} /> */}
            <button
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? <progress className="circle small"/>
                : "인증코드 받기"
              }
            </button>
          </form>
          {msg && <p>{msg}</p>}
        </fieldset>
      </article>
      {showModal ? createPortal(
        <>
          <div
            className={`overlay ${showModal ? "active" : ""}`}
            onClick={_ => setShowModal(false)}
          />
          <dialog className={`${showModal ? "active" : ""}`}>
            <h1>ALLEYS 이용약관</h1>
            <p>준비중</p>
            <button onClick={_ => {
              setShowModal(false)
              setAgree(true)
            }}>동의합니다</button>
          </dialog>
        </>,
        document.body,
      ) : null}
    </>
  )
}
