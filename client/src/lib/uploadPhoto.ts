/**
 * Utility function for photo uploads
 * Currently returns a placeholder URL - to be implemented with actual upload logic later
 */

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Uploads a single photo and returns the URL
 * @param file - The file to upload
 * @returns Promise with upload result
 */
export async function uploadPhoto(file: File): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validatePhoto(file);
    if (!validation.valid) {
      return {
        url: '',
        success: false,
        error: validation.error
      };
    }

    // Local test, convert file to data URL for testing
    const dataUrl = await fileToDataUrl(file);
    
    return {
      url: dataUrl,
      success: true
    };
  } catch (error) {
    return {
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Converts a File to a data URL for testing purposes
 * @param file - The file to convert
 * @returns Promise that resolves to data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads multiple photos and returns array of URLs
 * @param files - Array of files to upload
 * @returns Promise with array of upload results
 */
export async function uploadMultiplePhotos(files: File[]): Promise<UploadResult[]> {
  try {
    const uploadPromises = files.map(file => uploadPhoto(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    return files.map(() => ({
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }));
  }
}

/**
 * Validates file type and size before upload
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns Validation result
 */
export function validatePhoto(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and GIF images are allowed'
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}
