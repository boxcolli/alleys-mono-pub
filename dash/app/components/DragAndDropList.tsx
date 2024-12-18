import React, { useState } from "react";

type Props<T> = {
  state: T[]
  setState: React.Dispatch<React.SetStateAction<T[]>>
  Render: ({ data, isDraggedOver }: {
    data: T
    isDraggedOver: boolean
  }) => React.ReactNode
}

export function DragAndDropList<T>({ state, setState, Render }: Props<T>) {
  const [dragged, setDragged] = useState<number | null>(null)
  const [draggedOver, setDraggedOver] = useState<number | null>(null)

  return (
    <>
      {state.map((data, index) => (
        <div
          key={`drag-and-drop-item-${index}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <Render
            data={data}
            isDraggedOver={draggedOver === index}
          />
        </div>
      ))}
    </>
  )

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragged(index)
  }

  function handleDragEnter(e: React.DragEvent, index: number) {
    setDraggedOver(index)
  }

  function handleDragEnd() {
    if (dragged === null || draggedOver === null) {
      return
    }

    if (dragged < draggedOver) {
      // move: lo -> hi
      setState(prev => {
        const next: T[] = []
        next.push(...prev.slice(0, dragged))
        next.push(...prev.slice(dragged + 1, draggedOver + 1))
        next.push(prev[dragged])
        next.push(...prev.slice(draggedOver + 1, prev.length))
        return next
      })
    } else if (draggedOver < dragged) {
      // move: lo <- hi
      setState(prev => {
        const next: T[] = []
        next.push(...prev.slice(0, draggedOver))
        next.push(prev[dragged])
        next.push(...prev.slice(draggedOver, dragged))
        next.push(...prev.slice(dragged + 1, prev.length))
        return next
      })
    }
    setDragged(null)
    setDraggedOver(null)
  }
}
