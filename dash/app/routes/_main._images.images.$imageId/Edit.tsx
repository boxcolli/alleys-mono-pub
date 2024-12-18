import { Await, useFetcher, useLoaderData } from "@remix-run/react";
import { loader } from "./loader";
import { Suspense, useRef } from "react";
import config from "./config";

export function Edit() {
  const { image } = useLoaderData<typeof loader>()
  if (!image) return (
    <p>There was an error.</p>
  )

  const fetcherKey = "fetcher-edit"
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== "idle"

  return (
    <>
      <h3>Edit</h3>
      <Suspense fallback={<progress />}>
        <Await resolve={image}>
          {image => image && (
            <fetcher.Form method="put">
              <input
                name={config.action.name}
                value={config.action.names.edit}
                hidden
                readOnly
              />
              <table>
                <tbody>
                  {Object.entries(image).map(([k, v]) => {
                    if (k in config.edit.names == false) return null
                    const key = `edit-${k}`
                    const ref = useRef<HTMLInputElement>(null)

                    type TypedInputProps = {
                      disabled?: boolean
                      name?: string
                    }
                    function TypedInput({ disabled, name }: TypedInputProps) {
                      return (
                        <input
                          type="text"
                          defaultValue={v || ""}
                          disabled={disabled}
                          name={name}
                          ref={ref}
                        />
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