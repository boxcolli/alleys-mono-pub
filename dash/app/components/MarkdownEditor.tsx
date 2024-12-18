// import "./style.css"
import { useState } from "react"
import Markdown from "react-markdown"

type MarkdownEditorProps = {
  name: string
  defaultValue: string
}

export function MarkdownEditor({ name, defaultValue }: MarkdownEditorProps) {
  const [content, setContent] = useState(defaultValue)

  return (
    <div style={{
      width: "full",
      display: "flex",
      justifyContent: "space-evenly",
    }}>
      <div>
        <Markdown className={"react-markdown"}>
          {content}
        </Markdown>
      </div>
      

      <textarea
        name={name}
        defaultValue={defaultValue}
        onChange={e => setContent(e.currentTarget.value)}
        style={{
          width: "50%",
          minWidth: "50%",
        }}
      />
    </div>
  )
}
