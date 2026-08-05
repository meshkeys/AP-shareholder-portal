/**
 * Update Categories Config
 *
 * This is the single source of truth for all update types,
 * their fields, and their document requirements.
 *
 * TO ADD A NEW CATEGORY: add a new object to the array below.
 * TO ADD A NEW DOCUMENT: add to the relevant documents array.
 * TO ADD A NEW SUB-TYPE: add to the subTypes array of the category.
 */

export const UPDATE_CATEGORIES = [
  // ─── 1. NAME CHANGE ────────────────────────────────────────────────────────
  {
    id: "nameChange",
    label: "Name change",
    tagPrefix: "NC",
    description: "Update your registered name",
    icon: "ti-user",
    note: "Your new name must tally with your bank account name pattern.",
    hasSubTypes: true,
    subTypes: [
      {
        id: "male",
        label: "Male individual",
        fields: [
          {
            key: "newFirstName",
            label: "New first name",
            type: "text",
            required: true,
          },
          {
            key: "newLastName",
            label: "New last name",
            type: "text",
            required: true,
          },
        ],
        documents: [
          {
            id: "requestLetter",
            title: "Request letter",
            note: "Duly signed, reflecting old and new name with signature",
            required: true,
          },
          {
            id: "swornAffidavit",
            title: "Sworn affidavit",
            note: "Sworn affidavit of name change",
            required: true,
          },
          {
            id: "newspaperPublication",
            title: "Newspaper publication",
            note: "Publication announcing name change",
            required: true,
          },
          {
            id: "validId",
            title: "Valid means of identification",
            note: "National identity card, driver's licence, or international passport",
            required: true,
          },
          {
            id: "proofOfSubscription",
            title: "Proof of subscription",
            note: "Dividend counterfoil, share certificate, or CSCS statement",
            required: true,
          },
        ],
        hasSecondaryMarket: true,
      },
      {
        id: "femaleMarried",
        label: "Female individual — Married",
        fields: [
          {
            key: "newFirstName",
            label: "New first name",
            type: "text",
            required: true,
          },
          {
            key: "newLastName",
            label: "New last name",
            type: "text",
            required: true,
          },
        ],
        documents: [
          {
            id: "requestLetter",
            title: "Request letter",
            note: "Duly signed, reflecting old and new name with signature",
            required: true,
          },
          {
            id: "marriageCertificate",
            title: "Marriage certificate",
            note: "Certified copy of marriage certificate",
            required: true,
          },
          {
            id: "newspaperPublication",
            title: "Newspaper publication",
            note: "Publication announcing name change",
            required: true,
          },
          {
            id: "validId",
            title: "Valid means of identification",
            note: "National identity card, driver's licence, or international passport",
            required: true,
          },
          {
            id: "proofOfSubscription",
            title: "Proof of subscription",
            note: "Dividend counterfoil, share certificate, or CSCS statement",
            required: true,
          },
        ],
        hasSecondaryMarket: true,
      },
      {
        id: "femaleDivorcee",
        label: "Female individual — Divorcee",
        fields: [
          {
            key: "newFirstName",
            label: "New first name",
            type: "text",
            required: true,
          },
          {
            key: "newLastName",
            label: "New last name",
            type: "text",
            required: true,
          },
          {
            key: "phone",
            label: "Mobile phone number",
            type: "tel",
            required: true,
          },
          {
            key: "email",
            label: "Email address",
            type: "email",
            required: true,
          },
          { key: "bvn", label: "BVN", type: "text", required: true },
        ],
        documents: [
          {
            id: "validIdBothNames",
            title: "Valid means of identification",
            note: "Government-issued photo ID in both old and new names",
            required: true,
          },
          {
            id: "newspaperPublication",
            title: "Newspaper publication",
            note: "Copy of newspaper publication of change of name",
            required: true,
          },
          {
            id: "requestLetter",
            title: "Request letter",
            note: "Duly signed, reflecting old and new name with signature",
            required: true,
          },
          {
            id: "divoreCertificate",
            title: "Certificate of divorce",
            note: "Where applicable",
            required: false,
          },
          {
            id: "marriageCertificate",
            title: "Marriage certificate",
            note: "Where applicable",
            required: false,
          },
          {
            id: "affidavit",
            title: "Affidavit for change of name",
            note: "Sworn affidavit for change of name",
            required: true,
          },
        ],
        hasSecondaryMarket: true,
      },
      {
        id: "corporate",
        label: "Corporate entity",
        fields: [
          {
            key: "newCompanyName",
            label: "New company name",
            type: "text",
            required: true,
          },
        ],
        documents: [
          {
            id: "applicationLetter",
            title: "Application letter",
            note: "On company letterhead, with board resolution and newspaper publication",
            required: true,
          },
          {
            id: "signatureMandate",
            title: "Current signature mandate",
            note: "Specifying number of signatories and their category",
            required: true,
          },
          {
            id: "cacCertificate",
            title: "CAC certificate of incorporation",
            note: "Certificate of incorporation in the new name",
            required: true,
          },
          {
            id: "regulatoryApproval",
            title: "Regulatory authority approval",
            note: "Where applicable",
            required: false,
          },
        ],
        hasSignatories: true,
        hasSecondaryMarket: true,
      },
    ],
  },

  // ─── 2. NUBAN CHANGE ───────────────────────────────────────────────────────
  {
    id: "nubanChange",
    label: "NUBAN change",
    tagPrefix: "NUB",
    description: "Update your bank account number",
    icon: "ti-building-bank",
    note: null,
    hasSubTypes: false,
    isExternalLink: true,
    externalUrl: "https://www.nibss-plc.com.ng",
    externalLabel:
      "Please kindly click here to fill a form on the NIBSS website",
    fields: [],
    documents: [],
  },

  // ─── 3. KYC UPDATE ─────────────────────────────────────────────────────────
  {
    id: "kycUpdate",
    label: "KYC update",
    tagPrefix: "KYC",
    description: "Update your phone number, email address, or TIN",
    icon: "ti-id",
    note: null,
    hasSubTypes: false,
    fields: [
      { key: "phone", label: "Phone number", type: "tel", required: false },
      { key: "email", label: "Email address", type: "email", required: false },
      {
        key: "tin",
        label: "Tax Identification Number (TIN)",
        type: "text",
        required: false,
      },
    ],
    documents: [],
  },

  // ─── 4. ADDRESS UPDATE ─────────────────────────────────────────────────────
  {
    id: "addressUpdate",
    label: "Address update",
    tagPrefix: "AD",
    description: "Update your residential address",
    icon: "ti-map-pin",
    note: null,
    hasSubTypes: false,
    fields: [
      {
        key: "address",
        label: "New residential address",
        type: "text",
        required: true,
      },
      { key: "state", label: "State", type: "text", required: true },
      { key: "country", label: "Country", type: "text", required: true },
    ],
    documents: [
      {
        id: "validId",
        title: "Valid means of identification",
        note: "National identity card, driver's licence, or international passport",
        required: true,
      },
      {
        id: "utilityBill",
        title: "Utility bill",
        note: "Not older than 3 months, reflecting new address",
        required: true,
      },
      {
        id: "cscsStatement",
        title: "CSCS statement of account",
        note: "Current CSCS statement",
        required: true,
      },
    ],
  },

  // ─── 5. SIGNATURE UPDATE ───────────────────────────────────────────────────
  {
    id: "signatureUpdate",
    label: "Signature update",
    tagPrefix: "SIG",
    description: "Update your registered signature",
    icon: "ti-writing",
    note: null,
    hasSubTypes: false,
    fields: [],
    documents: [
      {
        id: "oldSignature",
        title: "Old signature",
        note: "Upload your current registered signature",
        required: true,
      },
      {
        id: "newSignature",
        title: "New signature",
        note: "Upload your new signature",
        required: true,
      },
      {
        id: "cscsStatement",
        title: "CSCS statement of account",
        note: "Current CSCS statement",
        required: true,
      },
      {
        id: "validId",
        title: "Valid means of identification",
        note: "National identity card, driver's licence, or international passport",
        required: true,
      },
    ],
  },
];

// ─── Secondary market documents (appended when checkbox is ticked) ────────────
export const SECONDARY_MARKET_DOCS = [
  {
    id: "cscsStatementSecondary",
    title: "CSCS statement",
    note: "Where name has been changed at CSCS",
    required: false,
  },
  {
    id: "validIdSecondary",
    title: "Valid means of identification",
    note: "Any valid government-issued ID",
    required: true,
  },
  {
    id: "signedRequestLetter",
    title: "Duly signed request letter",
    note: "Signed request letter for secondary market transaction",
    required: true,
  },
];
