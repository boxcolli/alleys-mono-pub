import config from "./config"
import { Util } from "@alleys/util"
import { Await, Form, useFetcher, useLoaderData } from "@remix-run/react"
import { loader } from "./loader"
import { Suspense, useRef } from "react"
import { Location } from "@alleys/kysely"

type ExcludeKeys = Util.KPick<Location, "id">
const exclude: Record<ExcludeKeys, ExcludeKeys> = {
  id: "id",
}

export function Edit() {
  const { location } = useLoaderData<typeof loader>()

  if (!location) return (
    <p>There was an error.</p>
  )

  const fetcherKey = "fetcher-edit"
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  return (
    <>
      <h2>Edit</h2>
      <Suspense fallback={<progress />}>
        <Await resolve={location}>
          {location => location && (
            <Form
              method="post"
              navigate={false}
              fetcherKey={fetcherKey}
            >
              <input
                name={config.actionName}
                value={config.actionNames.edit}
                hidden
                readOnly
              />
              <table>
                <tbody>
                  {Object.entries(location).map(([k, v]) => {
                    if (k in config.edit.editNames == false) return (
                      null
                    )

                    const key = `edit-${k}`
                    const ref = useRef<HTMLInputElement>(null)

                    type SelectProps = {
                      disabled?: boolean
                      name?: string
                    }

                    const Select = ({ disabled, name }: SelectProps) => {
                      if (typeof v === "string" || v === null) return (
                        <input
                          type="text"
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
      
                      if (v instanceof Date) return (
                        <input
                          type="date"
                          defaultValue={v.toISOString().split("T")[0]}
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
                        <td><Select disabled={true} /></td>
                        <td><Select name={k} /></td>
                        <td>
                          <button
                            onClick={() => {
                              if (ref.current) {
                                ref.current.value = String(v ?? "")
                              }
                            }}
                            type="button"
                          >reset</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? <progress /> : "Update"}
              </button>
            </Form>
          )}
        </Await>
      </Suspense>
    </>
  )
}
