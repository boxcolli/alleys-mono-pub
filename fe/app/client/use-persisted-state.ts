import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useIsMount } from "./use-is-mount";

type PersistedState<T> = [T, Dispatch<SetStateAction<T>>]
type ValueOrCallback<T> = T | (() => T)
type SelectStorage = "localStorage" | "sessionStorage"

/**
 * This hook automatically serialize/deserialize data between
 * memory state and browser storage.
 * 
 * Has a priority of: initial > storage > default
 * 
 * @param defaultValue provide default value or callback
 * @param key for storage entry
 * @param opt.use default sessionStorage
 * @param opt.initialValue provide initial value or callback
 * @returns normal react state
 */
export function usePersistedState<T>(
  defaultValue: ValueOrCallback<T>,
  key: string,
  opt?: {
    use?: SelectStorage
    initialValue?: ValueOrCallback<T>,  // Priority: initial > storage > default
  }
): PersistedState<T> {
  const [value, setValue] = useState<T>(
    opt && opt.initialValue
      ? (
        typeof opt.initialValue === "function"
          ? (opt.initialValue as () => T)()
          : opt.initialValue
      )
      : (
        typeof defaultValue === "function"
          ? (defaultValue as () => T)()
          : defaultValue
      )
  )

  const storage: SelectStorage = (
    opt && opt.use
      ? opt.use
      : "sessionStorage"
  )

  function get(k: string) {
    switch (storage) {
      case "localStorage":
        return localStorage.getItem(k)
      case "sessionStorage":
        return sessionStorage.getItem(k)
    }

    return null
  }

  function set(k: string, v: string) {
    switch (storage) {
      case "localStorage":
        localStorage.setItem(k, v)
        return

      case "sessionStorage":
        sessionStorage.setItem(k, v)
        return
    }
  }

  /**
   * Event: on mount
   * Action: get storage data
   */
  const isMount = useIsMount()
  useEffect(() => {
    if (!isMount) { return }
    if (opt && opt.initialValue) { return } // follow priority

    try {
      const storedValue = get(key)
      if (storedValue) {
        setValue(JSON.parse(storedValue) as T)
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e)
    }
  }, [isMount])

  /**
   * Event: state change
   * Action: sync with storage
   */
  useEffect(() => {
    if (isMount) { return }

    try {
      set(key, JSON.stringify(value))
    } catch (e) {
      console.error("Error writing to localStorage:", e)
    }
  }, [key, value])

  return [value, setValue]
}
