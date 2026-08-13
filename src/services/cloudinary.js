/**
 * Uploads a base64 image (with EXIF already stripped) to Cloudinary
 * using an unsigned upload preset.
 * 
 * @param {string} base64Data - Data URL of the image
 * @returns {Promise<string>} - Public download URL
 */
export const uploadToCloudinary = async (base64Data) => {
    if (!base64Data) throw new Error("No image data provided");

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        console.warn("Cloudinary configuration missing from .env. Using mock Image URL.");
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1500));
        return "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("upload_preset", uploadPreset);
    // Optionally group images in a specific folder in cloudinary
    formData.append("folder", "jandarpan_evidence");

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};
