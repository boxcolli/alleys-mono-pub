import { azure_sendEmailHTML } from "@alleys/azure/communication/email"
import {
  getEmailAlreadyTakenString,
  getEmailResetCodeString,
  getEmailSignupCodeString,
} from "./email-string"

type SendProps = {
  env: Env,
  title: string,
  htmlString: string,
  to: string,
}

function send({ env, title, htmlString, to}: SendProps) {
  return azure_sendEmailHTML({
    connStr: env.EMAIL_CONN_STR,
    title,
    htmlString,
    from: env.EMAIL_FROM_ADDR,
    to,
  })
}

/**
 * May throw error
 */
export async function sendEmailSignupCode(env: Env, to: string, code: string) {
  const error = await send({
    env: env,
    title: `[Alleys] 회원가입 코드: ${code}`,
    htmlString: getEmailSignupCodeString(code),
    to: to,
  })

  if (error) {
    throw error
  }
}

/**
 * May throw error
 */
export async function sendEmailAlreadyTaken(env: Env, to: string) {
    const error = await send({
        env: env,
        title: '[Alleys] 이메일이 이미 사용중입니다.',
        htmlString: getEmailAlreadyTakenString(),
        to: to,
    })

    if (error) {
        throw error
    }
}

/**
 * May throw error
 */
export async function sendEmailResetCode(env: Env, to: string, code: string) {
    const error = await send({
        env: env,
        title: `[Alleys] 비밀번호 재설정 코드: ${code}`,
        htmlString: getEmailResetCodeString(code),
        to: to,
    })

    if (error) {
        throw error
    }
}
