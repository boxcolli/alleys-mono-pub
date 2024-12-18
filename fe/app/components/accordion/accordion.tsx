type AccordionProps = {
  children: React.ReactNode
}

export function Accordion({ children }: AccordionProps) {
  return (
    <div className="accordion">
      <button className="accordion-button">
        
      </button>
      <div className="accordion-panel">
          {children}
        </div>
    </div>
  )
}