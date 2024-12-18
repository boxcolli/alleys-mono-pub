export function getRandomCode(charSet: string, length: number): string {
    const buf = new Uint8Array(length)

    const r = new Uint8Array(length)
    crypto.getRandomValues(r)
    
    for (let i = 0; i < length; i++) {
      buf[i] = charSet.charCodeAt(Math.floor(r[i] % charSet.length))
    }
    
    return String.fromCharCode.apply(null, buf as unknown as number[])
}
