import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "~/main.css";

export function Layout({ children }: { children: React.ReactNode }) {  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="light">
        {children}
        <ScrollRestoration />
        <Scripts />

        <footer className="padding right-align">
          <h5 className="logo small">ALLEYS</h5>
          <h6 className="small">© 2024 All Rights Reserved.</h6>
        </footer>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
