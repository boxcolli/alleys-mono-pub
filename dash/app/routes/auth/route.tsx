import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react"
import config from "./config"
import { useEffect, useRef, useState } from "react"
import { action } from "./action"
import { z } from "zod"
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile"
import { loader } from "./loader"
import { useIsMount } from "~/client/useIsMount"

export { loader, action }

export default function Index() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state !== "idle"
  const [message, setMessage] = useState<string>()
  const isMount = useIsMount()

  useEffect(() => {
    if (isMount) return
    if (fetcher.state !== "idle") return
    console.log("fetcher.data:", fetcher.data)
    const parsed = config.res.schema.safeParse(fetcher.data)
    if (parsed.error) {
      setMessage(`(message parse fail: ${parsed.error})`)
      return
    }
    const now = new Date()
    setMessage(`${now.toLocaleTimeString()} ${parsed.data.msg}`)
  }, [fetcher.state, fetcher.data])

  // Turnstile
  const tokenRef = useRef<string | null>(null)
  const [pass, setPass] = useState(false)

  return (
    <>
      <h1>Alleys Dashboard</h1>
      <h2>Login</h2>
      <fetcher.Form method="POST">
        <table>
          <tbody>
            <tr>
              <td><label htmlFor={config.req.names.user}>{config.req.names.user}</label></td>
              <td><input id={config.req.names.user} name={config.req.names.user} /></td>
            </tr>
            <tr>
              <td><label htmlFor={config.req.names.otp}>{config.req.names.otp}</label></td>
              <td><input id={config.req.names.otp} name={config.req.names.otp} /></td>
            </tr>
            <tr>
              <td><label htmlFor="turnstile">Robot?</label></td>
              <td>
                <Turnstile
                  siteKey={turnstileSiteKey}
                  options={{ language: "ko-kr", responseFieldName: config.req.names.token }}
                  onError={() => setPass(false)}
                  onExpire={() => setPass(false)}
                  onSuccess={token => { setPass(true); tokenRef.current = token}}
                  className="turnstile"
                />
                {/* <input name={config.req.names.token} value={tokenRef.current ?? ""} hidden readOnly /> */}
              </td>
            </tr>
          </tbody>
        </table>
        <button type="submit" disabled={!pass || isSubmitting}>Login</button>
      </fetcher.Form>
      {message && <p>{message}</p>}
    </>
  )
}
