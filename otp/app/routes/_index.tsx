import { ActionFunctionArgs } from "@remix-run/node"
import { json, useFetcher } from "@remix-run/react"
import { authenticator } from "otplib"
import qrcode from "qrcode"
import { useEffect, useRef, useState } from 'react'
import { Util } from "@alleys/util"
import { z } from "zod"

const defaultLength = 64
const defaultIssuer = "dash.alleys.app"

type Keys = "len" | "account" | "issuer"
const names: Util.KeyAsValue<Keys> = {
  len:      "len",
  account:  "account",
  issuer:   "issuer"
}
const schema = z.object({
  len:   z.coerce.number(),
  account:  z.string(),
  issuer:   z.string(),
}) satisfies Util.KeyAsZod<Keys>

export async function action({ params, request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()))
  if (parsed.error) {
    console.error("Parse failed:", parsed.error)
    return json({ secret: null, otpauth: null, qrCodeUrl: null, err: parsed.error })
  }
  const data = parsed.data

  const secret = authenticator.generateSecret(data.len)
  const otpauth = authenticator.keyuri(data.account, data.issuer, secret)
  try {
    var qrCodeUrl = await qrcode.toDataURL(otpauth)
  } catch (e) {
    console.error("URL fail:", e)
    return json({ secret: null, otpauth: null, qrCodeUrl: null, err: e })
  }

  return json({ secret, otpauth, qrCodeUrl, err: null })
}

export default function Index() {
  const [secret, setSecret] = useState<string>()
  const [qrCodeUrl, setQRCodeUrl] = useState<string>()

  const fetcher = useFetcher<typeof action>()
  const isSubmitting = fetcher.state !== "idle"

  useEffect(() => {
    if (fetcher.state !== "idle") return
    const d = fetcher.data
    if (!d || d.err !== null) {
      return
    }
    setSecret(d.secret ?? "")
    setQRCodeUrl(d?.qrCodeUrl ?? "")
  }, [fetcher.state])

  return (
    <>
      <h1>OTP Maker</h1>
      <section>
        <fetcher.Form method="POST">
          <h3>Input</h3>
          <table>
            <tbody>
              <tr>
                <td>Secret Length</td>
                <td><input type="number" name={names.len} defaultValue={defaultLength}/></td>
              </tr>
              <tr>
                <td>Issuer</td>
                <td><input name={names.issuer} defaultValue={defaultIssuer} /></td>
              </tr>
              <tr>
                <td>Account</td>
                <td><input name={names.account} /></td>
              </tr>
            </tbody>
          </table>
          <button type="submit" disabled={isSubmitting}>Gen</button>
        </fetcher.Form>
      </section>
      <section>
        <h3>Output</h3>
        <table>
          <tr>
            <td>Secret</td>
            <td><input value={secret} readOnly /></td>
          </tr>
          <tr>
            <td>QR Code</td>
            <td>{qrCodeUrl && <img src={qrCodeUrl} />}</td>
          </tr>
        </table>
      </section>
    </>
  )
}