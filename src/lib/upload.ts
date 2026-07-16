// Utility helper to handle payment screenshot uploads
// Supports Cloudinary or falls back to local server upload via /api/upload

export async function uploadScreenshot(file: File): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "";

  if (cloudinaryUrl && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error, falling back to local upload:", err);
    }
  }

  // Fallback: Upload to local server via /api/upload
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "File upload failed");
  }

  const data = await response.json();
  return data.url;
}
