import { useEffect, useState } from "react"

type TimerProps = {
  init?: number
  max: number
  onComplete?: () => void
}

export function Timer({ init, max, onComplete }: TimerProps) {
  const unit = 10
  const [value, setValue] = useState(init ?? 0)

  useEffect(() => {
    setValue(init ?? 0)
  }, [init])

  useEffect(() => {
    if (value >= max) {
      if (onComplete) {
        onComplete()
      }
      return
    }
    
    const timerId = setTimeout(() => {
      setValue(value + unit)
    }, unit)

    return () => clearTimeout(timerId)
  }, [value, max, onComplete])

  return (
    <progress value={value} max={max} />
  )
}
