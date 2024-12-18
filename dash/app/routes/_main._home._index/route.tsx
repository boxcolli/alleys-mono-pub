import { useFetcher } from "@remix-run/react"
import config from "./config"
import { action } from "./action"

export { action }

export default function Index() {
  return (
    <>
      <h2>Home</h2>
      
      <h3>Session</h3>

      <h4>Extend</h4>
      <ul>
        <li>
          <ExtendButton />
        </li>
      </ul>

      <h4>Logout</h4>
      <ul>
        <li>
          <LogoutButton />
        </li>
      </ul>
    </>
  )
}

function ExtendButton() {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state !== "idle"
  return (
    <fetcher.Form method="PUT">
      <button
        type="submit"
        disabled={isSubmitting}
      >Extend {config.extendMin}m</button>
    </fetcher.Form>
  )
}

function LogoutButton() {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state !== "idle"
  return (
    <fetcher.Form method="DELETE">
      <button
        type="submit"
        disabled={isSubmitting}
        onClick={() => fetcher.submit(null, { method: "DELETE" })}
      >Logout</button>
    </fetcher.Form>
  )
}
