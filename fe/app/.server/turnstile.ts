// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

interface RequestBody {
  secret: string
  response: string
  remoteip?: string
  idempotency_key?: string
}

interface ResponseBody {
  success: boolean
  challenge_ts?: string    // ISO timestamp
  hostname?: string
  'error-codes': string[]
  action?: string
  cdata?: string
}

interface Params {
  env: Env
  token: string
  ip?: string      // request.headers.get('CF-Connecting-IP')
}

export async function validateTurnstile({ env, token, ip }: Params) {
  const reqBody: RequestBody = {
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: ip,
  }
  const res = await fetch(env.TURNSTILE_ENDPOINT, {
    method:     'post',
    body:       JSON.stringify(reqBody),
    headers:    { 'Content-Type': 'application/json' },
  })
  
  const resBody: ResponseBody = await res.json()

  return resBody.success
}
