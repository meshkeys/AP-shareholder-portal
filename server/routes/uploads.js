const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadDocument } = require("../utils/storage");
const { supabase } = require("../utils/supabase");

// Store files in memory before uploading to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    if (
      allowed.includes(file.mimetype) ||
      // iOS/Android sometimes send HEIC/HEIF without a recognized mimetype
      /\.(heic|heif)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `"${file.originalname}" is a ${file.mimetype || "file type"} we can't accept. Please upload a JPG, PNG, WEBP, HEIC or PDF file.`,
        ),
      );
    }
  },
});

// ── POST /api/uploads/documents ───────────────────────────────────────────────
// Upload documents for a request
// Called by the shareholder portal after submission
router.post("/documents", (req, res, next) => {
  // multer/fileFilter errors are thrown before the route handler runs, so
  // they'd otherwise fall through to the generic 500 handler and lose their
  // specific, user-actionable message (e.g. which file/type was rejected).
  upload.array("files", 20)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed." });
    }
    next();
  });
}, async (req, res) => {
  const { requestId, documentTypes } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required." });
  }

  if (!req.files?.length) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    const types = JSON.parse(documentTypes || "[]");
    const uploaded = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const docType = types[i] || "document";

      // Upload to Supabase Storage
      const { path: storagePath, url } = await uploadDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        `requests/${requestId}`,
      );

      // Save to documents table
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            request_id: requestId,
            document_type: docType,
            file_name: file.originalname,
            file_url: url,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      uploaded.push(data);
    }

    res.json({ success: true, documents: uploaded });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

module.exports = router;
