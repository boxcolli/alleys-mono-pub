import { FESession } from "@alleys/lib/session/fe"
import remixSession from "@alleys/lib/session/remixSession"
import {
  Cookie,
  CookieOptions,
  createCookie,
  createMemorySessionStorage,
  createSessionStorage,
  SessionStorage
} from "@remix-run/cloudflare"
import { z } from "zod"
import cookies from "./cookies"

const policy = {
  idByteLength: 256,
}

const selectCookie: Record<FESession.Session, Cookie> = {
  main: cookies.main,
  auth: cookies.auth,
}

/**
 * Type selection helper
 */
type SessionData<N extends keyof FESession.SessionData> = FESession.SessionData[N]
type SessionFlash<N extends keyof FESession.SessionFlash> = FESession.SessionFlash[N]

/**
 *  Example:
 *      const { getSession, commitSession, destroySession } = declareSession(env)
 */
function init<
  N extends FESession.Session,
  D = SessionData<N>,
  F = SessionFlash<N>
>(env: Env, name: N) {
  const selectKV: Record<FESession.Session, KVNamespace<string>> = {
    main: env.KV_SESSION_MAIN,
    auth: env.KV_SESSION_AUTH,
  }

  switch (env.WHICH_ENV) {
    case "development":
      return remixSession.createGlobalMemorySession<N, D, F>(name, selectCookie[name])
    
    case "preview":
    case "production":
    default:
      return remixSession.createCustomKVSessionStorage<D, F>(
        selectKV[name],
        selectCookie[name],
        { idByteLength: policy.idByteLength },
      )
  }
}

export default { init }
