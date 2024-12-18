import config from "./config"
import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense, useRef } from "react"

export function Edit() {
  const { exhibition } = useLoaderData<typeof loader>()

  if (!exhibition) return (
    <p>There was an error.</p>
  )

  const fetcherKey ="fetcher-edit"
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  return (
    <>
      <h3>Edit</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={exhibition}>
          {exhibition => exhibition && (
            <fetcher.Form method="put">
              <input
                name={config.action.name}
                value={config.action.names.edit}
                hidden
                readOnly
              />
              <table>
                <tbody>
                  {Object.entries(exhibition).map(([k, v]) => {
                    if (k in config.edit.names == false) return (
                      null
                    )

                    const key = `edit-${k}`
                    const ref = useRef<HTMLInputElement>(null)

                    type TypedInputProps = {
                      disabled?: boolean
                      name?: string
                    }

                    const TypedInput = ({ disabled, name }: TypedInputProps) => {
                      if (typeof v === "number" || v === null) return (
                        <input
                          type="number"
                          defaultValue={v || ""}
                          disabled={disabled}
                          name={name}
                          ref={ref}
                        />
                      )
      
                      if (typeof v === "boolean") return (
                        <input
                          type="checkbox"
                          defaultChecked={v}
                          disabled={disabled}
                          name={name}
                          ref={ref}
                          value="true"
                        />
                      )

                      if (k.endsWith("_date")) return (
                        <input
                          type="date"
                          defaultValue={new Date(v).toISOString().split("T")[0]}
                          disabled={disabled}
                          name={name}
                          ref={ref}
                        />
                      )

                      if (typeof v === "string" || v === null) return (
                        <input
                          type="text"
                          defaultValue={v || ""}
                          disabled={disabled}
                          name={name}
                          ref={ref}
                        />
                      )
      
                      return (
                        <p>?{k}</p>
                      )
                    }

                    return (
                      <tr key={key}>
                        <td>{k}</td>
                        <td><TypedInput disabled={true} /></td>
                        <td><TypedInput name={k} /></td>
                        <td>
                          <button type="button" onClick={() => {
                              if (ref.current) ref.current.value = String(v ?? "")
                          }}>reset</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <button type="submit" disabled={isSubmitting}>
                Update
              </button>
            </fetcher.Form>
          )}
        </Await>
      </Suspense>
    </>
  )
}
