import { useEffect, useRef } from "react"

export function useDebounce<F extends (...args: any[]) => void>(run: F, delayMili = 1000) {
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (!timer.current) return
      clearTimeout(timer.current)
    }
  }, [])

  const debounceAndRun = ((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => run(...args), delayMili)
  }) as F

  return debounceAndRun
}