/**
 * Matches C# RegisterModel
 */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // firstName?: string;
  // lastName?: string;
  // email?: string;
  // userName: string;
  // password?: string; // Password should be included for registration
}

/**
 * Matches C# LoginModel
 */
export interface LoginPayload {
  userName: string;
  password?: string; // Password should be included for login
}

/**
 * Matches C# AuthResponse (structure might vary based on actual implementation)
 */
export interface AuthResponseData {
  token: string;
  expiration: string; // ISO date string
  userId: string;
  userName: string;
  email: string;
  roles: string[];
  // Add other relevant user details returned upon login
}

/**
 * Matches C# UpdateProfileModel
 */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Matches C# AdminUpdateUserModel (extends UpdateProfileModel)
 */
export interface AdminUpdateUserPayload extends UpdateProfilePayload {
  userId: string;
}

/**
 * Matches C# User Profile structure returned by GetProfile/GetAllUsers
 */
export interface UserProfileData {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userName: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

/**
 * Matches C# TranslationStatus Enum
 */
export enum TranslationStatus {
  Pending = 0,
  Approved = 1,
  Completed = 2,
  Rejected = 3,
  Resubmitted = 4, // Assuming this status exists based on workflow
}

/**
 * Represents the structure of translation request data returned from the API.
 * Matches the C# TranslationRequest model.
 */
export interface TranslationRequestData {
  id: string; // Guid represented as string
  title: string;
  description?: string; // Nullable string
  sourceLanguage: string;
  targetLanguage: string;
  originalFileName: string;
  storedFileName: string;
  translatedFileName?: string; // Nullable string
  status: number; // Enum represented as number (Pending = 0, Approved = 1, etc.)
  adminComment?: string; // Nullable string
  userComment?: string; // Nullable string
  createdAt: string; // DateTime represented as ISO string
  updatedAt?: string; // Nullable DateTime represented as ISO string
  completedAt?: string; // Nullable DateTime represented as ISO string
  userId: string;
  // Optional: Include user details if the API endpoint populates them
  // user?: { firstName: string; lastName: string; email: string; };
}

/**
 * Matches C# TranslationRequestUpdateModel
 */
export interface UpdateTranslationRequestPayload {
  id: string; // Guid maps to string
  title: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  userComment?: string;
}

/**
 * Matches C# AdminCommentModel
 */
export interface AdminCommentPayload {
  comment?: string;
}

// --- File Download Endpoints ---

// While the DownloadOriginalFile and DownloadTranslatedFile endpoints directly return
// file data (Blob/ArrayBuffer), these interfaces represent potential structures
// you might create in your client-side code *after* receiving the file data
// and associated metadata (like the filename derived from the 'Content-Disposition' header
// or the original request data).

/**
 * Represents the data structure after successfully downloading the original file.
 */
export interface OriginalFileDownloadResponse {
  /** The downloaded file data. */
  fileData: Blob;
  /** The original filename provided by the server. */
  fileName: string;
}

/**
 * Represents the data structure after successfully downloading the translated file.
 */
export interface TranslatedFileDownloadResponse {
  /** The downloaded file data. */
  fileData: Blob;
  /** The suggested filename for the translated file (e.g., "Translated_document.txt"). */
  fileName: string;
}

/**
 * Represents the structure of file response data.
 */
export interface FileResponseData {
  fileBlob: Blob;
  fileName: string;
}

// Note: Models involving IFormFile (TranslationRequestFormModel, TranslationCompletionModel, ResubmitRequestFormModel)
// are handled using FormData, not specific interfaces for the payload structure.
