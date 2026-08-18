import React from "react"
import ReactDOM from "react-dom/client"

// Fonts — Inter Variable (Latin) + Vazirmatn Variable (Persian)
import "@fontsource-variable/inter"
import "@fontsource-variable/vazirmatn"

import "./i18n"
import App from "./App"
import AppProviders from "./app/providers/AppProviders"
import "./styles/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
