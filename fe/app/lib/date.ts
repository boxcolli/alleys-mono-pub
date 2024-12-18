export function dateToString(d: Date, join: string) {
  const year = d.getFullYear().toString().substring(2)
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const date = d.getDate().toString().padStart(2, "0")
  return `${year}${join}${month}${join}${date}`
}
