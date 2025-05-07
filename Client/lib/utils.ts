import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debounces a function, delaying its execution until after a specified wait time
 * has elapsed since the last time it was invoked.
 * @param func The function to debounce.
 * @param waitFor The number of milliseconds to delay.
 * @returns A debounced version of the function.
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void; // Ensure void return for setters
}

/**
 * Triggers a browser download for a given Blob.
 * @param blob The file content as a Blob.
 * @param defaultFilename The filename to use if not extractable from headers.
 * @param responseHeaders Optional Axios response headers to attempt extracting filename.
 */
export const triggerBrowserDownload = (
  blob: Blob,
  defaultFilename: string,
  responseHeaders?: any
): void => {
  let filename = defaultFilename;

  // Try to extract filename from Content-Disposition header
  const contentDisposition = responseHeaders?.["content-disposition"];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch.length > 1) {
      filename = filenameMatch[1];
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  // Clean up
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};


// Helper function to parse filename from Content-Disposition header
export const getFilenameFromContentDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) {
    return null;
  }
  // Regex to find filename="thefilename.ext" or filename*=UTF-8''thefilename.ext
  const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/i);
  if (filenameMatch && filenameMatch[1]) {
    try {
      // Decode URI component for potential encoding (e.g., filename*=UTF-8''...)
      return decodeURIComponent(filenameMatch[1]);
    } catch (e) {
      // Fallback for simple filename="name.ext" if decoding fails
      return filenameMatch[1];
    }
  }
  return null;
}


// Example usage within a component after calling a download function:
// try {
//   const response = await downloadOriginalFile(requestId); // Axios response with Blob data
//   triggerBrowserDownload(response.data, 'original_document.txt', response.headers);
// } catch (error) {
//   console.error("Download failed:", error);
// }
