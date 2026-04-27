import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import App from "./App.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import IndicatorDetailPage from "./pages/IndicatorDetailPage.tsx";
import SignalsPage from "./pages/SignalsPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import PaymentPage from "./pages/PaymentPage.tsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.tsx";
import PaymentFailPage from "./pages/PaymentFailPage.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
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
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/indicators/:id" element={<IndicatorDetailPage />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail" element={<PaymentFailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
