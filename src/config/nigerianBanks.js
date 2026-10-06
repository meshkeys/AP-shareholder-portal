/**
 * CBN-licensed Nigerian banks, grouped by category, for the bank-name
 * dropdown on the dematerialization form (and anywhere else a shareholder
 * needs to pick their bank).
 *
 * "Other" is intentionally included at the end so a shareholder whose bank
 * isn't listed can still proceed — no list like this can stay perfectly
 * complete as licenses change.
 */

export const NIGERIAN_BANKS = [
  {
    group: "Commercial Banks",
    banks: [
      "Access Bank",
      "Citibank Nigeria",
      "Ecobank Nigeria",
      "Fidelity Bank",
      "First Bank of Nigeria",
      "First City Monument Bank (FCMB)",
      "Globus Bank",
      "Guaranty Trust Bank (GTBank)",
      "Keystone Bank",
      "Optimus Bank",
      "Parallex Bank",
      "Polaris Bank",
      "Premium Trust Bank",
      "Providus Bank",
      "Signature Bank",
      "Stanbic IBTC Bank",
      "Standard Chartered Bank",
      "Sterling Bank",
      "SunTrust Bank",
      "Titan Trust Bank",
      "Union Bank of Nigeria",
      "United Bank for Africa (UBA)",
      "Unity Bank",
      "Wema Bank",
      "Zenith Bank",
    ],
  },
  {
    group: "Non-Interest Banks",
    banks: ["Jaiz Bank", "Lotus Bank", "TAJ Bank"],
  },
  {
    group: "Merchant Banks",
    banks: [
      "Coronation Merchant Bank",
      "FBNQuest Merchant Bank",
      "FSDH Merchant Bank",
      "Greenwich Merchant Bank",
      "Nova Merchant Bank",
      "Rand Merchant Bank Nigeria",
    ],
  },
  {
    group: "Digital Banks & Payment Service Banks",
    banks: [
      "Kuda Bank",
      "Moniepoint MFB",
      "OPay",
      "PalmPay",
      "VFD Microfinance Bank",
      "Sparkle Bank",
      "9PSB",
      "Hope PSB",
    ],
  },
  {
    group: "Other",
    banks: ["Other (not listed)"],
  },
];
