import { getKysely as get } from "@alleys/kysely"

export function getKysely(env: Env) {
  switch (env.WHICH_ENV) {
    case "development":
    
      return get(env.DATABASE_URL, "neon-node")
    
    case "preview":
    case "production":
    default:

      return get(env.DATABASE_URL, "neon-edge")
  }
}

// export function getKyselyHyperdrive(env: Env) {
//   switch (env.WHICH_ENV) {
//     case "development":
    
//       return get(env.DATABASE_URL, "neon-node")
    
//     case "preview":
//     case "production":
//     default:
      
//       return get(env.HYPERDRIVE.connectionString, "pg")
//   }
// }
