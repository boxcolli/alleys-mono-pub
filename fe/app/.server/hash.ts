import { ArgonOpts, argon2id as _argon2id } from "@noble/hashes/argon2"
import { serialize, deserialize }from "~/lib/phc-formatter"

// https://thecopenhagenbook.com/password-authentication#password-storage
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
const opt: ArgonOpts = {
    t: 2,
    m: 19456,    
    p: 1,
    version: 0x13, // 19
}

export function hash_argon2id(password: string): string {
    const salt = new Uint8Array(16)
    crypto.getRandomValues(salt)

    const digest = _argon2id(password, salt, opt)

    // const saltBase64 = btoa(String.fromCharCode(...salt))
    // const hashBase64 = btoa(String.fromCharCode(...hash))

    const serialized = serialize({
        id: 'argon2id',
        salt: Buffer.from(salt),
        hash: Buffer.from(digest),
        version: opt.version,
        parameters: {
            i: opt.t,
            m: opt.m,
            p: opt.p,
        },
    })

    return serialized
}

export function verify_argon2id(hash: string, password: string): boolean {
    const parsed = deserialize(hash)

    const newDigest = _argon2id(password, parsed.salt, opt)
    const prevDigest = new Uint8Array(parsed.hash)

    return compareUint8Array(prevDigest, newDigest)
}

function compareUint8Array(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false
        }
    }

    return true
}