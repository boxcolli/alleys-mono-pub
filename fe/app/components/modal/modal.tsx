import { createPortal } from "react-dom"
import "./style.css"

type ModalProps = {
  /** State variable */
  isOpen: boolean

  onClose?: () => void

  children: React.ReactNode
}
export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <>
      {isOpen && createPortal(
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
