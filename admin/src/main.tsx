import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router";
import "./index.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <Router basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Router>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
