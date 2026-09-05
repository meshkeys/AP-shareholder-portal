import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import StepBar from "./components/StepBar";
import EmailEntry, { ProductCarousel } from "./pages/EmailEntry";
import OTPVerify from "./pages/OTPVerify";
import ProfileReview from "./pages/ProfileReview";
import UpdateTypeSelector from "./pages/UpdateTypeSelector";
import NameChangeForm from "./pages/NameChangeForm";
import KYCForm from "./pages/KYCForm";
import AddressForm from "./pages/AddressForm";
import SignatureForm from "./pages/SignatureForm";
import NUBANChange from "./pages/NUBANChange";
import ReviewSummary from "./pages/ReviewSummary";
import Success from "./pages/Success";
import KYCStandalone from "./pages/KYCStandalone";
import AutoAssign from "./admin/pages/AutoAssign";
import APLogo from "./assets/AP_LOGO.png";

// Admin imports
import AdminNavbar from "./admin/components/AdminNavbar";
import Login from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import Requests from "./admin/pages/Requests";
import RequestDetail from "./admin/pages/RequestDetail";
import Agents from "./admin/pages/Agents";
import Performance from "./admin/pages/Performance";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import ChangePassword from "./admin/pages/ChangePassword";
import ForgotPassword from "./admin/pages/ForgotPassword";
import ResetPassword from "./admin/pages/ResetPassword";
import { getSession } from "./admin/services/adminApi";

const isAdminRoute = window.location.pathname.startsWith("/admin");
const isKYCRoute = window.location.pathname.startsWith("/kyc-update");

export default function App() {
  // ── Admin state ─────────────────────────────────────────────────────────────
  const [adminAgent, setAdminAgent] = useState(null);
  const [adminPage, setAdminPage] = useState("dashboard");
  const [adminView, setAdminView] = useState("login");
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // ── Portal state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pinId, setPinId] = useState("");
  const [profile, setProfile] = useState(null);
  const [updateType, setUpdateType] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [ticket, setTicket] = useState(null);

  // ── Check for existing admin session on load ──────────────────────────────
  useEffect(() => {
    if (isAdminRoute) {
      const session = getSession();
      if (session) setAdminAgent(session.agent);
    }
  }, []);

  // ── Admin navigation ──────────────────────────────────────────────────────
  function handleAdminNavigate(page, id = null) {
    setAdminPage(page);
    if (id) setSelectedRequestId(id);
  }

  // ── Portal flow ───────────────────────────────────────────────────────────
  function onEmailDone({ email, pinId }) {
    setEmail(email);
    setPinId(pinId);
    setStep(2);
  }

  function onOTPDone({ profile }) {
    setProfile(profile);
    setStep(3);
  }

  function onUpdateRequested() {
    setStep(4);
  }

  function onConfirmed({ referenceNumber, type }) {
    setTicket({ referenceNumber, type, label: null });
    setStep(7);
  }

  function onTypeSelected(category) {
    setUpdateType(category);
    setStep(5);
  }

  function onFormDone(submissionData) {
    setSubmission(submissionData);
    setStep(6);
  }

  function onReviewConfirmed({ referenceNumber }) {
    setTicket({
      referenceNumber,
      type: submission.updateType,
      label: submission.label,
    });
    setStep(7);
  }

  function onUpdateAnother() {
    setUpdateType(null);
    setSubmission(null);
    setTicket(null);
    setStep(4);
  }

  function onDone() {
    setStep(1);
    setEmail("");
    setPinId("");
    setProfile(null);
    setUpdateType(null);
    setSubmission(null);
    setTicket(null);
  }

  function renderForm() {
    if (!updateType) return null;
    const props = { profile, onNext: onFormDone, onBack: () => setStep(4) };
    switch (updateType.id) {
      case "nameChange":
        return <NameChangeForm {...props} />;
      case "kycUpdate":
        return <KYCForm {...props} />;
      case "addressUpdate":
        return <AddressForm {...props} />;
      case "signatureUpdate":
        return <SignatureForm {...props} />;
      case "nubanChange":
        return <NUBANChange onBack={() => setStep(4)} />;
      default:
        return null;
    }
  }

  // ── KYC standalone route ──────────────────────────────────────────────────
  if (isKYCRoute) {
    return <KYCStandalone />;
  }

  // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
  if (isAdminRoute) {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");

    if (!adminAgent) {
      // Show reset password page if token in URL
      if (resetToken) {
        return (
          <ResetPassword
            token={resetToken}
            onDone={() => (window.location.href = "/admin")}
          />
        );
      }
      // Show forgot password page
      if (adminView === "forgot") {
        return <ForgotPassword onBack={() => setAdminView("login")} />;
      }
      // Show login page
      return (
        <Login
          onLogin={(agent) => setAdminAgent(agent)}
          onForgotPassword={() => setAdminView("forgot")}
        />
      );
    }

    // Force password change on first login
    if (adminAgent.mustChangePassword) {
      return (
        <ChangePassword
          agent={adminAgent}
          onDone={() =>
            setAdminAgent((prev) => ({ ...prev, mustChangePassword: false }))
          }
        />
      );
    }

    // Main admin dashboard
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AdminNavbar
          agent={adminAgent}
          currentPage={adminPage}
          onNavigate={handleAdminNavigate}
        />
        <div style={{ flex: 1 }}>
          {adminPage === "dashboard" && (
            <Dashboard agent={adminAgent} onNavigate={handleAdminNavigate} />
          )}
          {adminPage === "requests" && (
            <Requests agent={adminAgent} onNavigate={handleAdminNavigate} />
          )}
          {adminPage === "requestDetail" && selectedRequestId && (
            <RequestDetail
              agent={adminAgent}
              requestId={selectedRequestId}
              onBack={() => setAdminPage("requests")}
            />
          )}
          {adminPage === "performance" && (
            <Performance agent={adminAgent} onNavigate={handleAdminNavigate} />
          )}
          {adminPage === "reports" && <Reports agent={adminAgent} />}
          {adminPage === "agents" && <Agents agent={adminAgent} />}
          {adminPage === "settings" && <Settings agent={adminAgent} />}
          {adminPage === "autoAssign" && <AutoAssign agent={adminAgent} />}
        </div>
      </div>
    );
  }

  // ── SHAREHOLDER PORTAL ────────────────────────────────────────────────────
  const maxWidth = step === 3 ? "1100px" : "560px";

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main
        style={{
          flex: 1,
          padding: "32px 24px",
          maxWidth,
          margin: "0 auto",
          width: "100%",
          transition: "max-width 0.3s ease",
        }}
      >
        {step === 1 && <ProductCarousel />}

        <StepBar currentStep={step > 5 ? 5 : step} />

        {step === 1 && <EmailEntry onNext={onEmailDone} />}
        {step === 2 && (
          <OTPVerify
            email={email}
            pinId={pinId}
            onNext={onOTPDone}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && profile && (
          <ProfileReview
            profile={profile}
            onUpdate={onUpdateRequested}
            onConfirm={onConfirmed}
          />
        )}
        {step === 4 && (
          <UpdateTypeSelector
            onSelect={onTypeSelected}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && renderForm()}
        {step === 6 && submission && profile && (
          <ReviewSummary
            submission={submission}
            profile={profile}
            onConfirm={onReviewConfirmed}
            onBack={() => setStep(5)}
          />
        )}
        {step === 7 && ticket && (
          <Success
            ticket={ticket}
            onUpdateAnother={onUpdateAnother}
            onDone={onDone}
          />
        )}
      </main>

      <footer
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          marginTop: "auto",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Main footer content */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px 32px",
            display: "grid",
            gridTemplateColumns: "280px 1fr 1fr 1fr 1fr",
            gap: "40px",
          }}
        >
          {/* Brand column */}
          <div>
            <img
              src={APLogo}
              alt="Africa Prudential"
              style={{
                height: "32px",
                width: "auto",
                marginBottom: "20px",
                display: "block",
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              Africa Prudential Plc is registered with the Securities and
              Exchange Commission, Nigeria.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              {[
                {
                  icon: "ti-brand-linkedin",
                  url: "https://www.linkedin.com/company/africa-prudential-plc/mycompany/",
                },
                {
                  icon: "ti-brand-facebook",
                  url: "https://www.facebook.com/Africaprudentialplc",
                },
                {
                  icon: "ti-brand-instagram",
                  url: "https://www.instagram.com/africaprudential",
                },
                { icon: "ti-brand-x", url: "https://x.com/afriprud" },
              ].map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#374151",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#E31E24")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#374151")
                  }
                >
                  <i className={`ti ${s.icon}`} style={{ fontSize: "15px" }} />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#1A1A2E",
                marginBottom: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Company
            </p>
            {[
              {
                label: "About Us",
                url: "https://www.africaprudential.com/About-Us",
              },
              { label: "Blog", url: "https://www.africaprudential.com/news" },
              { label: "FAQ", url: "https://www.africaprudential.com/FAQ" },
              {
                label: "Contact Us",
                url: "https://www.africaprudential.com/Contact-Us",
              },
              {
                label: "Sustainability",
                url: "https://www.africaprudential.com/sustainability",
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#6B7280",
                  textDecoration: "none",
                  marginBottom: "10px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E31E24")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Our Service */}
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#1A1A2E",
                marginBottom: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Our Service
            </p>
            {[
              {
                label: "Premium Share Registration",
                url: "https://www.africaprudential.com/Services/Premium-share-Registration",
              },
              {
                label: "Capital Market Issuer",
                url: "https://www.africaprudential.com/Services/Capital-Market-Issuer-Services",
              },
              {
                label: "Probate and Transmission",
                url: "https://www.africaprudential.com/Services/Probate-and-Transmission-Services",
              },
              {
                label: "Investor Relations",
                url: "https://www.africaprudential.com/Services/Investor-Relations-Services",
              },
              {
                label: "e-Solutions",
                url: "https://www.africaprudential.com/Services/e-Solutions",
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#6B7280",
                  textDecoration: "none",
                  marginBottom: "10px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E31E24")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#1A1A2E",
                marginBottom: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Legal
            </p>
            {[
              {
                label: "Privacy Policy",
                url: "https://www.africaprudential.com/Privacy-Policy",
              },
              {
                label: "Glossary",
                url: "https://www.africaprudential.com/Glassory",
              },
              {
                label: "Cookie Policy",
                url: "https://www.africaprudential.com/policies/cookie-policy",
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#6B7280",
                  textDecoration: "none",
                  marginBottom: "10px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E31E24")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Investor Relations */}
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#1A1A2E",
                marginBottom: "16px",
                letterSpacing: "0.02em",
              }}
            >
              Investor Relations
            </p>
            {[
              {
                label: "Financial Reports",
                url: "https://www.africaprudential.com/investor-relations",
              },
              {
                label: "Company Policy",
                url: "https://www.africaprudential.com/investor-relations",
              },
              {
                label: "Client Information",
                url: "https://www.africaprudential.com/investor-relations",
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "#6B7280",
                  textDecoration: "none",
                  marginBottom: "10px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E31E24")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #E5E7EB", padding: "16px 24px" }}>
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
              © 2026 Africa Prudential. All rights reserved.
            </p>
            <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
              Africa Prudential Plc is registered with the Securities and
              Exchange Commission, Nigeria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
