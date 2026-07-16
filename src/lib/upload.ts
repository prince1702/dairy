// Utility helper to handle payment screenshot uploads
// Supports Cloudinary or falls back to base64 data URL encoding

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
      console.error("Cloudinary upload error, falling back to base64:", err);
    }
  }

  // Fallback: Convert the file to a base64 data URL
  // This gets stored directly in the database TEXT column
  // and renders natively in <img> tags without any external service
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
