import "./style.css"
import React, { useRef, useState, useEffect } from 'react'
import { $REGEX } from '~/config'

type CodeInputProps = {
  name: string
  length: number
  charSet: "numeric" | "alphanumeric" | "alpha",
  forceTo?: "upper" | "lower",
  onComplete?: (code: string) => void
  isDisabled?: boolean
}

export function CodeInput({
  name,
  length,
  charSet,
  forceTo,
  onComplete,
  isDisabled,    
}: CodeInputProps) {
  const reg = (
    (charSet === 'alpha')   ? $REGEX.alpha :
    (charSet === 'numeric') ? $REGEX.digit :
    $REGEX.alphanumeric
  )

  const [code, setCode] = useState(Array<string>(length))
  const refs = Array.from({ length }, () => useRef<HTMLInputElement>(null))

  useEffect(() => {
    refs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.addEventListener("input", (e) => handleInput(e, index))
      }
    })
  }, [refs, code])

  useEffect(() => {
    if (!onComplete) return
    const codeString = code.join("")
    if (codeString.length === length) {
      // console.log(`Complete: ${codeString}`)
      onComplete(codeString)
    }
  }, [code])

  function resetCode() {
    // reset value in each ref
    refs.forEach(ref => {
      if (ref.current) { ref.current.value = "" }
    })

    // reset focus
    if (refs[0].current) { refs[0].current.focus() }

    // reset data
    setCode(Array<string>(length))
  }

  function handleClick(e: React.MouseEvent<HTMLInputElement, MouseEvent>) {
    e.currentTarget.select()
  }

  /**
   *  Catch edit keys
   */
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    // console.log({ KeyboardEvent: e.key, index: index })
    const target = e.target as HTMLInputElement
    const key = e.key

    if (key === "Backspace" || key === "Delete") {
      e.preventDefault()
      
      if (target.value) {
        // Remove current slot
        target.value = ""
        setCode((prev) => {
          const buf = [...prev]
          buf[index] = ""
          return buf
        })
        return
      }

      if (key === "Backspace") {
        // Focus left
        const left = refs[index - 1]
        if (!left || !left.current) {
          return
        }
        left.current.focus()

        if (left.current.value) {
          // Remove left slot
          left.current.value = ""
          setCode(prev => {
            const buf = [...prev]
            buf[index - 1] = ""
            return buf
          })
        }
      } else {
        // Focus right
        const right = refs[index + 1]
        if (!right || !right.current) {
          return
        }
        right.current.focus()

        if (right.current.value) {
          right.current.value = ""
          setCode(prev => {
            const buf = [...prev]
            buf[index + 1] = ""
            return buf
          })
        }
      }

      return
    }

    if (key === 'ArrowLeft') {
      const l = refs[index - 1]
      if (l && l.current) {
          l.current.select()
      }
      return
    }

    if (key === 'ArrowRight') {
      const r = refs[index + 1]
      if (r && r.current) {
          r.current.select()
      }
      return
    }

    if (key === 'Home') {
      const lo = refs[0]
      if (lo && lo.current) {
        lo.current.select()
      }
      return
    }

    if (key === 'End') {
      const hi = refs[length - 1]
      if (hi && hi.current) {
          hi.current.select()
      }
      return
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    console.log({ ClipboardEvent: e.clipboardData.getData('text') })
    if (!e.clipboardData) return
    e.preventDefault()

    const target = e.target
    const pasteString = e.clipboardData.getData('text')
    const paste = [...pasteString]
    const buf = [...code]
    {
      if (pasteString.length === 0) {
        return
      }
      
      for (let i = 0; i < Math.min(paste.length, length); i++) {
        // Erase invalid character
        if (!reg.test(paste[i])) {
          paste[i] = ""
        }

        // Case option
        if (charSet !== "numeric" && forceTo && $REGEX.alpha.test(paste[i])) {
          if (forceTo == "lower") {
            paste[i] = paste[i].toLowerCase()
          } else {
            paste[i] = paste[i].toUpperCase()
          }
        }
      }
    }

    if (paste.length >= length) {
      // Copy paste[0..] into buf[0..]
      for (let i = 0; i < length; i++) {
        buf[i] = paste[i]
        refs[i].current!.value = paste[i]
      }
      setCode(buf)
      refs[length-1].current?.focus()
      return
    }

    // Determine target index
    var index = 0
    for (let i = 0; i < length; i++) {
      if (target === refs[i].current) {
        index = i
        break
      }
    }

    // Copy paste[0..] into buf[i..]
    var i = index
    var j = 0
    while (i < length && j < paste.length) {
      buf[i] = paste[j]
      refs[i].current!.value = paste[j]            
      
      i++
      j++
    }
    setCode(buf)
    if (i == length) {
      i--
    }
    refs[i].current?.focus()
  }

  // Delete all inputs and select the first entry
  // function ClearButton() {
  //   return (
  //     <button onClick={resetCode}>
  //       <img src={CloseIcon} />
  //     </button>
  //   )
  // }

  /**
   *  Why Input instead Change:
   *    When a same value is replaced, ChangeEvent does not
   *    detect and cannot focus on next ref.
   */
  function handleInput(e: Event, index: number): any {
    const target = e.target as HTMLInputElement
    // console.log({ Input: target.value, index: index })
    const key = target.value
    const type = (
      ($REGEX.alpha.test(key)) ? "alpha" :
      ($REGEX.digit.test(key)) ? "numeric" :
      "else"
    )
    if (
      type === "else" ||          
      (type === "alpha" && charSet === "numeric") ||
      (type === "numeric" && charSet === "alpha")
    ) {
      target.value = ""
      return
    }
    
    setCode((prev) => {
      const buf = [...prev]
      buf[index] = key
      return buf
    })

    const next = refs[index + 1]
    if (next && next.current) {
      next.current.focus()
    }
  }

  return (
    <div className="code-input">
      {refs.map((ref, index) => (
        <input
          key={index}
          className="code-input-entry"
          type="text"
          maxLength={1}
          autoFocus={index === 0}
          disabled={isDisabled}

          ref={ref}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onClick={handleClick}
        />
      ))}
      <input name={name} value={code.join("")} hidden readOnly />
    </div>
  )
}
