import { useEffect, useRef } from "react"

export function useIsMount() {
  const ref = useRef(true)

  useEffect(() => {
    ref.current = false
  }, [])

  return ref.current
}
