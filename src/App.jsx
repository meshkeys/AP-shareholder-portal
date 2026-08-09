import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import StepBar from "./components/StepBar";
import EmailEntry from "./pages/EmailEntry";
import OTPVerify from "./pages/OTPVerify";
import ProfileReview from "./pages/ProfileReview";
import UpdateTypeSelector from "./pages/UpdateTypeSelector";
import NameChangeForm from "./pages/NameChangeForm";
import KYCForm from "./pages/KYCForm";
import AddressForm from "./pages/AddressForm";
import SignatureForm from "./pages/SignatureForm";
import NUBANChange from "./pages/NubanChange";
import ReviewSummary from "./pages/ReviewSummary";
import Success from "./pages/Success";

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
import { getSession, clearSession } from "./admin/services/adminApi";

const isAdminRoute = window.location.pathname.startsWith("/admin");

export default function App() {
  // ── Admin state ─────────────────────────────────────────────────────────────
  const [adminAgent, setAdminAgent] = useState(null);
  const [adminPage, setAdminPage] = useState("dashboard");
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
      if (session) {
        setAdminAgent(session.agent);
      }
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

  function onReviewConfirmed() {
    const prefix = submission.tagPrefix;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceNumber = `${prefix}-${date}-${rand}`;
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

  // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!adminAgent) {
      return <Login onLogin={(agent) => setAdminAgent(agent)} />;
    }

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
          textAlign: "center",
          fontSize: "12px",
          color: "#b0b0b0",
          padding: "16px 24px",
          borderTop: "1px solid #e8e8e8",
          background: "#fff",
        }}
      >
        ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
        &nbsp;·&nbsp;
        <a href="#" style={{ color: "#b0b0b0" }}>
          Privacy notice
        </a>
        &nbsp;·&nbsp;
        <a href="mailto:support@sharereg.ng" style={{ color: "#b0b0b0" }}>
          support@sharereg.ng
        </a>
      </footer>
    </div>
  );
}
