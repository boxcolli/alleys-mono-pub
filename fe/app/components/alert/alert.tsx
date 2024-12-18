import classes from "./style.module.css"

import { BlockIcon, CancelIcon, CheckIcon, EmergencyIcon, ErrorIcon, FeedbackIcon, InfoIcon, LightBulbIcon, WarningIcon } from ".."
import { AlertType } from "~/config"
import { useEffect, useState } from "react"

type AlertProps = {
  type: AlertType
  message: string
  removeAfterMili?: number
}

export function Alert({ type, message, removeAfterMili }: AlertProps) {
  // const Icon = (
  //   type == "success" ? <i>check</i> :
  //   type == "info" ? <i>info</i> :
  //   type == "warning" ? <i>warning</i> :
  //   type == "error" ? <i>cancel</i> :
  //   <i>bolt</i>
  // )

  const [active, setActive] = useState<boolean>(true)

  useEffect(() => {
    if (removeAfterMili !== undefined) {
      const timer = setTimeout(() => setActive(false), removeAfterMili)
      return () => clearTimeout(timer)
    }
  }, [active])
  
  return (
    <div className={`snackbar alert-${type} ${active ? "active" : ""}`}>
      <div className={`${classes["alert-icon"]} ${classes["alert-" + type]}`}>
        {type == "success"  ? <i>check</i> :
          type == "info"    ? <i>info</i> :
          type == "warning" ? <i>warning</i> :
          type == "error"   ? <i>cancel</i> :
          <i>bolt</i>
        }
      </div>
      <div className="spacing" />
      {message}
    </div>
  )
}

export function AlertContainer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="alert-container">
      {children}
    </div>
  )
}
