import remixSession from "@alleys/lib/session/remixSession"
import cookie from "./cookie"

const policy = {
  idByteLength: 256,
}

/**
 * Session schema
 */
type SessionName = "auth"
type AuthData = {
  expire_at: Date
}
type AuthFlashData = {}

/**
 * Type map
 */
type SessionData<N extends SessionName> =
  N extends "auth"
    ? AuthData
    : AuthData
type SessionFlashData<N extends SessionName> =
  N extends "auth"
    ? AuthFlashData
    : AuthFlashData

function init<
  N extends SessionName,
  D = SessionData<N>,
  F = SessionFlashData<N>
>(env: Env, name: N) {
  switch (env.WHICH_ENV) {
    case "development":
      return remixSession.createGlobalMemorySession<N, D, F>(name, cookie.auth)
    
    case "preview":
    case "production":
    default:
      return remixSession.createCustomKVSessionStorage<D, F>(
        env.MY_KV,
        cookie.auth,
        { idByteLength: policy.idByteLength },
      )
  }
}

export default { init }
