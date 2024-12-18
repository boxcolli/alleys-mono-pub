import React, { useState } from "react"
import { createPortal } from "react-dom"

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
}

const contentStyle: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  position: "relative",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  maxWidth: "500px",
  width: "90%",
}

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  border: "none",
  background: "none",
  fontSize: "16px",
  cursor: "pointer",
}

type DialogProps = {
  isOpen: boolean
  onClose?: () => void
  children: React.ReactNode
}

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  if (!isOpen) return null

  return createPortal(
    <dialog open style={overlayStyle} onClick={onClose}>
      <div
        style={contentStyle}
        onClick={e => e.stopPropagation()}  // Prevent closing on content click
      >
        <button style={closeButtonStyle} onClick={onClose}>
          <i className="material-symbols-outlined">close</i>
        </button>
        {children}
      </div>
    </dialog>,
    document.body
  )
}
