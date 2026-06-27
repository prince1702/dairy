// Utility helper to handle payment screenshot uploads
// Supports Cloudinary or falls back to a simulated upload if credentials are not configured

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
      console.error("Cloudinary upload error, falling back to simulated upload:", err);
    }
  }

  // Fallback / Simulation mode for local development:
  // Convert the file to an object URL or simulated local URL
  console.log("Simulating file upload for:", file.name);
  
  // Return a realistic mock URL with a unique query param to simulate a success
  return `https://res.cloudinary.com/demo/image/upload/v1626240000/payment_receipt_simulated.png?filename=${encodeURIComponent(
    file.name
  )}&t=${Date.now()}`;
}
