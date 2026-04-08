import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import App from "./App.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import IndicatorDetailPage from "./pages/IndicatorDetailPage.tsx";
import SignalsPage from "./pages/SignalsPage.tsx";
import "./index.css";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-northeast-2_pQDdR9CWJ",
      userPoolClientId: "6imvm8src98uubrm6dgorg9fcf",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/indicators/:id" element={<IndicatorDetailPage />} />
        <Route path="/signals" element={<SignalsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
