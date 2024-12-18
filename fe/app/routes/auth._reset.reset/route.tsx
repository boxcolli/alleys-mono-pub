import { SpinnerButton } from "~/components"
import config from "./config"
import { useForm } from "@rvf/remix"
import { action } from "./action"

export { action }

export default function Page() {
  const form = useForm({
    validator: config.req.validator,
    method: "post",
    replace: false,
  })
  const msgKey = form.error(config.res.names.msg)
  const message = msgKey ? config.res.getMsg(msgKey) : null

  return (
    <>
      <article>
        <fieldset>
          <legend>단계 1 / 2</legend>
          <p>이메일로 가입된 계정이 있으면 일회용 코드를 보낼게요.</p>
          <form {...form.getFormProps()}>
            <div className="field border label">
              <input id="email" type="email" name={config.req.names.email} placeholder=" " />
              <label htmlFor="email">이메일</label>
            </div>

            <button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? <progress className="circle small"/>
                : "일회용 코드 받기"
              }
            </button>
          </form>
          <p>{message}</p>
        </fieldset>
      </article>
    </>
  )
}
