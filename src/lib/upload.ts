// Utility helper to handle payment screenshot uploads
// Supports Cloudinary or falls back to compressed base64 data URL

/**
 * Compress an image file on the client using Canvas.
 * Resizes to max 1200px on longest side and compresses to JPEG quality 0.7
 * This keeps base64 output typically under 200-400KB.
 */
function compressImage(file: File, maxSize = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

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

  // Fallback: Compress and convert to base64 data URL
  // Image is resized to max 1200px and compressed to JPEG quality 0.7
  // Keeps output well under the 5MB server action body limit
  return compressImage(file);
}
