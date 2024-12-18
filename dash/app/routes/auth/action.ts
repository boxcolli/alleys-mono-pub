import turnstile from "@alleys/cf/turnstile"
import { ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare"
import config, { UserRow } from "./config"
import { z } from "zod"
import { authenticator } from "otplib"
import sessions from "~/.server/sessions"
import { $PATH } from "~/config"

const testSecret = "GMYDALC7H4GEULRFIBKQARYHJU5UWLDZKIPHGNSYNE2GOAYSGMFXY6D5LZ2BKZTTGBBC2FTLLM4DE7LACYXAWCAUEQ6HCUAUIILFQXY"

export async function action({ params, request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env

  function response(res: z.infer<typeof config.res.schema>, status?: number) {
    return Response.json(res, { status: status ?? 200 })
  }

  /**
   * Req
   */
  const parsed = config.req.schema.safeParse(
    Object.fromEntries((await request.formData()).entries())
  )
  if (parsed.error) return response({ msg: "please check input fields" }, 400)
  const data = parsed.data
  console.info("Req:", data)

  /**
   * Turnstile
   */
  const pass = await turnstile.validate(env.TURNSTILE_SECRET_KEY, data.token)
  if (!pass) return response({ msg: "robot pass fail" }, 400)

  /**
   * Secret
   */
  let secret: string
  switch (env.WHICH_ENV) {
    case "development":
      secret = testSecret
      break
    
    case "preview":
    case "production":
    default:
      try {
        const result = (
          await env.MY_DB
          .prepare(`SELECT * FROM user WHERE username = ?1`)
          .bind(data.user)
          .first<UserRow>()
        )
        if (!result) return response({ msg: "invalid value" }, 400)
        secret = result.otp_secret
      } catch (e) {
        console.error("d1 fail:", e)
        return response({ msg: "internal" }, 500)
      }
  }

  /**
   * OTP
   */
  const isValid = authenticator.check(data.otp, secret)
  console.info({ isValid })
  if (!isValid) return response({ msg: "invalid value" }, 400)

  /**
   * Session
   */
  try {
    const { getSession, commitSession } = sessions.init(env, "auth")
    const session = await getSession()
    const expireAt = new Date(Date.now() + config.sessionTTLSec * 1_000)
    session.set("expire_at", expireAt)
    return redirect(
      $PATH.home,
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.error("session fail", e)
    return response({ msg: "internal" }, 500)
  }
}
