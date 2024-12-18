// import { Util } from "@alleys/util"
// import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/cloudflare"
// import { useFetcher, useLoaderData } from "@remix-run/react"
// import { authenticator } from "otplib"
// import qrcode from "qrcode"
// import { useEffect, useState } from "react"
// import { z } from "zod"

// const secret = "GMYDALC7H4GEULRFIBKQARYHJU5UWLDZKIPHGNSYNE2GOAYSGMFXY6D5LZ2BKZTTGBBC2FTLLM4DE7LACYXAWCAUEQ6HCUAUIILFQXY"
// const accountName = "hello@example.com"
// const issuer = "alleys-test"

// type Keys = "otp" | "secret"
// const names: Util.KeyAsValue<Keys> = {
//   otp: "otp",
//   secret: "secret"
// }
// const reqSchema = z.object({
//   otp:    z.string(),
//   secret: z.string(),
// }) satisfies Util.KeyAsZod<Keys>
// const resSchema = z.object({
//   ok: z.boolean(),
//   err: z.any(),
// })

// export async function loader({ params, request, context }: LoaderFunctionArgs) {
//   const secretLength = 32
//   // const secret = authenticator.generateSecret(secretLength)
//   const otpauth = authenticator.keyuri(accountName, issuer, secret)  
  
//   try {
//     const qrCodeUrl = await qrcode.toDataURL(otpauth)
//     return json({ secret, otpauth, qrCodeUrl })
//   } catch (e) {
//     return json({ secret, otpauth, qrCodeUrl: null })
//   }
// }

// export async function action({ params, request, context }: ActionFunctionArgs) {
//   const formData = await request.formData()
//   const parsed = reqSchema.safeParse(Object.fromEntries(formData.entries()))
//   if (parsed.error) {
//     return json({ err: parsed.error })
//   }
//   const data = parsed.data

//   const isValid = authenticator.check(data.otp, data.secret)
//   if (isValid) {
//     return json({ ok: true })
//   } else {
//     return json({ ok: false })
//   }
// }

// export default function Index() {
//   const { secret, qrCodeUrl } = useLoaderData<typeof loader>()
//   const fetcher = useFetcher()
//   const isSubmitting = fetcher.state !== "idle"

//   const [res, setRes] = useState<string>()

//   useEffect(() => {
//     if (fetcher.state === "idle") return
//     const parsed = resSchema.safeParse(fetcher.data)
//     if (parsed.error) {
//       console.error("Parse failed:", parsed.error)
//       return
//     }

//     const data = parsed.data
//     if (data.err) {
//       setRes(String(data.err))
//     } else {
//       setRes(String(data.ok))
//     }
//   }, [fetcher.data])

//   return (
//     <>
//       <h1>Test QR</h1>
//       {qrCodeUrl ? (
//         <img src={qrCodeUrl} alt="QR Code for Google Authenticator" />
//       ) : (
//         <p>Something went wrong.</p>
//       )}
//       <fetcher.Form
//         method="POST"
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "flex-start",
//         }}
        
//       >
//         <input type="text" name={names.secret} value={secret} readOnly />
//         <input type="text" name={names.otp} />
//         <button type="submit" disabled={isSubmitting}>Submit</button>
//       </fetcher.Form>
//       <p>Res: {res}</p>
//     </>
//   )
// }