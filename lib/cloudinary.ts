export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
  
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Debug logging
    console.log('Cloudinary Config:', { cloudName, uploadPreset });

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    // Log the response for debugging
    const responseText = await response.text();
    console.log('Cloudinary Response:', responseText);

    if (!response.ok) {
      throw new Error(`Upload failed: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadVideoToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
  formData.append('resource_type', 'video');
  
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Debug logging
    console.log('Cloudinary Video Upload Config:', { cloudName, uploadPreset });

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    // Log the response for debugging
    const responseText = await response.text();
    console.log('Cloudinary Video Response:', responseText);

    if (!response.ok) {
      throw new Error(`Video upload failed: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw error;
  }
};
