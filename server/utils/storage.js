/**
 * Supabase Storage Utility
 * Handles file uploads for shareholder documents
 */

const { supabase } = require("./supabase");
const path = require("path");

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - file contents
 * @param {string} fileName   - original file name
 * @param {string} mimeType   - file mime type
 * @param {string} folder     - folder path inside bucket
 * @returns {string} public URL of uploaded file
 */
async function uploadDocument(
  fileBuffer,
  fileName,
  mimeType,
  folder = "requests",
) {
  const ext = path.extname(fileName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const storagePath = `${folder}/${timestamp}-${random}${ext}`;

  const { data, error } = await supabase.storage
    .from("Documents")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  // Get signed URL valid for 1 year
  const { data: urlData, error: urlError } = await supabase.storage
    .from("Documents")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (urlError) throw new Error(`Failed to get file URL: ${urlError.message}`);

  return {
    path: storagePath,
    url: urlData.signedUrl,
  };
}

module.exports = { uploadDocument };
