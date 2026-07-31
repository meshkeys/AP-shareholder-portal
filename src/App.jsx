import React, { useState } from "react";
import Navbar from "./components/Navbar";
import StepBar from "./components/StepBar";
import EmailEntry from "./pages/EmailEntry";
import OTPVerify from "./pages/OTPVerify";
import ProfileReview from "./pages/ProfileReview";
import UpdateForm from "./pages/UpdateForm";
import Success from "./pages/Success";

export default function App() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pinId, setPinId] = useState("");
  const [profile, setProfile] = useState(null);
  const [result, setResult] = useState(null);

  // Step 1 → 2
  function onEmailDone({ email, pinId }) {
    setEmail(email);
    setPinId(pinId);
    setStep(2);
  }

  // Step 2 → 3
  function onOTPDone({ profile }) {
    setProfile(profile);
    setStep(3);
  }

  // Step 3 → 5 (details are correct, no update needed)
  function onConfirmed({ referenceNumber, type }) {
    setResult({ referenceNumber, type });
    setStep(5);
  }

  // Step 3 → 4 (user wants to update)
  function onUpdateRequested() {
    setStep(4);
  }

  // Step 4 → 5
  function onUpdateSubmitted({ referenceNumber, type }) {
    setResult({ referenceNumber, type });
    setStep(5);
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "32px 16px",
          maxWidth: "560px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Step progress bar */}
        <StepBar currentStep={step} />

        {/* Step 1 — Email entry */}
        {step === 1 && <EmailEntry onNext={onEmailDone} />}

        {/* Step 2 — OTP verification */}
        {step === 2 && (
          <OTPVerify
            email={email}
            pinId={pinId}
            onNext={onOTPDone}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3 — Profile review */}
        {step === 3 && profile && (
          <ProfileReview
            profile={profile}
            onConfirm={onConfirmed}
            onUpdate={onUpdateRequested}
          />
        )}

        {/* Step 4 — Update form */}
        {step === 4 && profile && (
          <UpdateForm
            profile={profile}
            onSubmit={onUpdateSubmitted}
            onBack={() => setStep(3)}
          />
        )}

        {/* Step 5 — Success */}
        {step === 5 && result && (
          <Success
            referenceNumber={result.referenceNumber}
            type={result.type}
          />
        )}
      </main>

      {/* Footer */}
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
