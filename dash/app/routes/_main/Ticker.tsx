import { useState, useEffect } from "react"

type TickerProps = {
  target: Date
}
export function Ticker({ target }: TickerProps) {
  const [data, setData] = useState<
    ReturnType<typeof calcRemainingTime> | null
  >(null)

  useEffect(() => {
    setData(calcRemainingTime(new Date(target)))

    const interval = setInterval(() => {
      setData(calcRemainingTime(target))
    }, 1000)

    return () => clearInterval(interval)
  }, [target])

  if (!data) return (
    <progress />
  )

  if (data.total <= 0) return (
    <p>Time's up</p>
  )

  const timeStr = `${data.hours}h ${data.minutes}m ${data.seconds}s`
  return (
    <p>Session expires in: <strong>{timeStr}</strong></p>
  )
}

function calcRemainingTime(target: Date) {
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  const total = Math.max(0, diff)
  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor(total / 1000 / 3600)

  return { total, hours, minutes, seconds }
}
