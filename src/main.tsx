import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import "./index.css";

// 무거운 페이지는 lazy load — 초기 번들에서 제외
const AdminPage           = lazy(() => import("./pages/AdminPage.tsx"));
const IndicatorDetailPage = lazy(() => import("./pages/IndicatorDetailPage.tsx"));
const IndicatorsListPage  = lazy(() => import("./pages/IndicatorsListPage.tsx"));
const SignalsPage         = lazy(() => import("./pages/SignalsPage.tsx"));
const LoginPage           = lazy(() => import("./pages/LoginPage.tsx"));
const SignUpPage          = lazy(() => import("./pages/SignUpPage.tsx"));
const TermsPage           = lazy(() => import("./pages/TermsPage.tsx"));
const PrivacyPage         = lazy(() => import("./pages/PrivacyPage.tsx"));
const RefundPage          = lazy(() => import("./pages/RefundPage.tsx"));
const ProfilePage         = lazy(() => import("./pages/ProfilePage.tsx"));
const PaymentPage         = lazy(() => import("./pages/PaymentPage.tsx"));
const PaymentSuccessPage  = lazy(() => import("./pages/PaymentSuccessPage.tsx"));
const PaymentFailPage     = lazy(() => import("./pages/PaymentFailPage.tsx"));
const OAuthCallbackPage   = lazy(() => import("./pages/OAuthCallbackPage.tsx"));

const callbackUrl = `${window.location.origin}/oauth/callback`;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-northeast-2_pQDdR9CWJ",
      userPoolClientId: "6imvm8src98uubrm6dgorg9fcf",
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || "",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [callbackUrl],
          redirectSignOut: [window.location.origin],
          responseType: "code",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-[#090c14]" />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/indicators" element={<IndicatorsListPage />} />
            <Route path="/indicators/:id" element={<IndicatorDetailPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/fail" element={<PaymentFailPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
