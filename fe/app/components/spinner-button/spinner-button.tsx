import "./style.css"

type SpinnerButtonProps = {
  label: string
  type?: "button" | "submit" | "reset"
  busy: boolean
  onClick?: () => void
  className?: string
}

export function SpinnerButton({ label, type, busy, onClick, className }: SpinnerButtonProps) {
  return (
    <button className={`btn-submit ${className}`} type={type ?? "button"} disabled={busy} onClick={onClick}>
      {busy && <span className="spinner"></span>}
      <span style={{ visibility: busy ? 'hidden' : 'visible' }}>
        {label}
      </span>
    </button>
  )
}
