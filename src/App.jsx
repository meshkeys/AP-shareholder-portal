import React, { useState } from "react";
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
import NUBANChange from "./pages/NUBANChange";
import ReviewSummary from "./pages/ReviewSummary";
import Success from "./pages/Success";

/*
  STEP MAP:
  1 — EmailEntry
  2 — OTPVerify
  3 — ProfileReview       (holdings table)
  4 — UpdateTypeSelector  (pick one)
  5 — Form                (depends on type)
  6 — ReviewSummary       (printable)
  7 — Success             (ticket)
*/

export default function App() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pinId, setPinId] = useState("");
  const [profile, setProfile] = useState(null);
  const [updateType, setUpdateType] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [ticket, setTicket] = useState(null);

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  function onEmailDone({ email, pinId }) {
    setEmail(email);
    setPinId(pinId);
    setStep(2);
  }

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────
  function onOTPDone({ profile }) {
    setProfile(profile);
    setStep(3);
  }

  // ── Step 3 → 4 (update) ───────────────────────────────────────────────────
  function onUpdateRequested() {
    setStep(4);
  }

  // ── Step 3 → 7 (confirm correct) ──────────────────────────────────────────
  function onConfirmed({ referenceNumber, type }) {
    setTicket({ referenceNumber, type, label: null });
    setStep(7);
  }

  // ── Step 4 → 5 ────────────────────────────────────────────────────────────
  function onTypeSelected(category) {
    setUpdateType(category);
    setStep(5);
  }

  // ── Step 5 → 6 ────────────────────────────────────────────────────────────
  function onFormDone(submissionData) {
    setSubmission(submissionData);
    setStep(6);
  }

  // ── Step 6 → 7 (submit) ───────────────────────────────────────────────────
  function onReviewConfirmed() {
    // Generate ticket reference number
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

  // ── Step 7 → 4 (update another) ───────────────────────────────────────────
  function onUpdateAnother() {
    setUpdateType(null);
    setSubmission(null);
    setTicket(null);
    setStep(4);
  }

  // ── Step 7 → end (done) ───────────────────────────────────────────────────
  function onDone() {
    // Reset everything and go back to start
    setStep(1);
    setEmail("");
    setPinId("");
    setProfile(null);
    setUpdateType(null);
    setSubmission(null);
    setTicket(null);
  }

  // ── Render the correct form for step 5 ────────────────────────────────────
  function renderForm() {
    if (!updateType) return null;

    const props = {
      profile,
      onNext: onFormDone,
      onBack: () => setStep(4),
    };

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

  // ── Main container width — wider on step 3 for the table ──────────────────
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

        {/* Step 1 — Email entry */}
        {step === 1 && <EmailEntry onNext={onEmailDone} />}

        {/* Step 2 — OTP verify */}
        {step === 2 && (
          <OTPVerify
            email={email}
            pinId={pinId}
            onNext={onOTPDone}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3 — Profile / holdings review */}
        {step === 3 && profile && (
          <ProfileReview
            profile={profile}
            onUpdate={onUpdateRequested}
            onConfirm={onConfirmed}
          />
        )}

        {/* Step 4 — Update type selector */}
        {step === 4 && (
          <UpdateTypeSelector
            onSelect={onTypeSelected}
            onBack={() => setStep(3)}
          />
        )}

        {/* Step 5 — Update form (dynamic) */}
        {step === 5 && renderForm()}

        {/* Step 6 — Review summary */}
        {step === 6 && submission && profile && (
          <ReviewSummary
            submission={submission}
            profile={profile}
            onConfirm={onReviewConfirmed}
            onBack={() => setStep(5)}
          />
        )}

        {/* Step 7 — Success */}
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
