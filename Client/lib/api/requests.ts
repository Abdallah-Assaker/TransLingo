"use server"; // Mark this module as server-only

import apiClient, { getAuthenticatedHeaders } from "./client";
import type {
  TranslationRequestData,
  UpdateTranslationRequestPayload,
  FileResponseData, // Import the new interface
  AdminCommentPayload,
} from "./interfaces";
// Import getServerSession and authOptions for v4
import { getServerSession } from "next-auth/next"; // Changed import
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust import path for your auth options
import { handleApiError } from "./auth"; // Import the error handler
import { getFilenameFromContentDisposition } from "../utils";

/**
 * Helper function to get the current session and token using NextAuth v4.x getServerSession.
 * Throws an error if the user is not authenticated.
 */
export const getSessionOrThrow = async () => {
  const session = await getServerSession(authOptions);
  // Also, throw a real error instead of returning an object on failure.
  if (!session?.accessToken || !session?.user?.id) {
    throw new Error("User is not authenticated.");
  }
  // Type assertion might be needed depending on your session/token structure in v4 callbacks
  return session as { accessToken: string; user: { id: string } }; // Example assertion
};

// --- User Translation Request Functions ---

/**
 * Creates a new translation request.
 * POST /api/TranslationRequest
 * @param formData FormData containing request details and the file.
 */
export const createTranslationRequest = async (
  formData: FormData
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    // Explicitly set Content-Type for FormData
    const headers = getAuthenticatedHeaders(
      session.accessToken,
      "multipart/form-data"
    );

    console.log("Creating translation request with headers:", headers); // Debugging log
    const response = await apiClient.post<TranslationRequestData>(
      "/TranslationRequest",
      formData,
      { headers } // Pass the headers including the explicit Content-Type
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Gets all translation requests for the current user.
 * GET /api/TranslationRequest
 */
export const getUserRequests = async (): Promise<
  ApiSuccessResponse<TranslationRequestData[]> | ApiErrorResponse
> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get<TranslationRequestData[]>(
      "/TranslationRequest",
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Gets a specific translation request by ID for the current user.
 * GET /api/TranslationRequest/{id}
 */
export const getRequestById = async (
  id: string
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get<TranslationRequestData>(
      `/TranslationRequest/${id}`,
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Updates an existing translation request for the current user.
 * PUT /api/TranslationRequest/{id}
 */
export const updateRequest = async (
  id: string,
  payload: UpdateTranslationRequestPayload
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.put<TranslationRequestData>(
      `/TranslationRequest/${id}`,
      payload,
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Deletes a translation request for the current user.
 * DELETE /api/TranslationRequest/{id}
 */
export const deleteRequest = async (
  id: string
): Promise<ApiSuccessMessageResponse | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.delete(`/TranslationRequest/${id}`, {
      headers: getAuthenticatedHeaders(session.accessToken),
    });
    return {
      statusCode: response.status,
      statusText: response.statusText,
      message: response.data?.message || "Request deleted successfully.",
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

// /**
//  * Downloads the original file for a user's request.
//  * GET /api/TranslationRequest/{id}/download-original
//  * Returns a Blob wrapped in the success response.
//  */
// export const downloadOriginalFile = async (
//   id: string
// ): Promise<ApiSuccessResponse<Blob> | ApiErrorResponse> => {
//   try {
//     const session = await getSessionOrThrow();
//     const headers = getAuthenticatedHeaders(session.accessToken);
//     // Add Accept header for file download
//     delete headers["Content-Type"];
//     headers["Content-Type"] = "application/octet-stream";
//     headers["Accept"] = "application/octet-stream";
//     // headers["Accept"] = "application/pdf";

//     const response = await apiClient.get(
//       `/TranslationRequest/${id}/download-original`,
//       {
//         responseType: "blob",
//         headers: headers, // Use updated headers
//       }
//     );
//     console.log(response.data.originalFileName, 'response');
//     console.log(headers, typeof response.data, response.data instanceof Blob ? "Is a Blob" : "Is NOT a Blob");
//     if (!(response.data instanceof Blob)) {
//       console.log("Blob condition:");
//       const blob = new Blob([response.data], { type: "application/octet-stream" });
//       response.data = blob;
//       console.log("Blob created:", blob, typeof blob);
//     }
//     return {
//       statusCode: response.status,
//       statusText: response.statusText,
//       data: response.data,
//     };
//   } catch (error: any) {
//     if (error.message === "User is not authenticated.") {
//       return { error: error.message };
//     }
//     return await handleApiError(error);
//   }
// };


/**
 * Downloads the original file for a user's request.
 * GET /api/TranslationRequest/{id}/download-original
 * Returns a Blob and filename wrapped in the success response.
 */
export const downloadOriginalFile = async (
  id: string
): Promise<ApiSuccessResponse<FileResponseData> | ApiErrorResponse> => { // Updated return type
  try {
    const session = await getSessionOrThrow();
    const headers = getAuthenticatedHeaders(session.accessToken);
    // Adjust headers for file download
    delete headers["Content-Type"]; // Not needed for GET, backend determines response Content-Type
    headers["Accept"] = "application/octet-stream"; // Indicate we accept binary stream

    const response = await apiClient.get(
      `/TranslationRequest/${id}/download-original`,
      {
        responseType: "blob",
        headers: headers,
      }
    );

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    const fileName = getFilenameFromContentDisposition(contentDisposition) || "downloaded-file"; // Fallback filename

    let actualBlob = response.data;
    // This block ensures response.data is a Blob, which is good practice
    // especially if Axios in Node.js environment might return a Buffer.
    // Node.js v18+ has global Blob.
    if (!(response.data instanceof Blob)) {
      console.warn("Response data was not a Blob, attempting conversion.");
      actualBlob = new Blob([response.data], { type: response.headers['content-type'] || "application/octet-stream" });
    }

    console.log(`Downloaded file: ${fileName}, Type: ${actualBlob.type}, Size: ${actualBlob.size}`);
    console.log("Is actualBlob a Blob?", actualBlob instanceof Blob);


    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: { // Updated data structure
        fileBlob: actualBlob,
        fileName: fileName,
      },
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};


/**
 * Downloads the translated file for a user's completed request.
 * GET /api/TranslationRequest/{id}/download-translated
 * Returns a Blob wrapped in the success response.
 */
export const downloadTranslatedFile = async (
  id: string
): Promise<ApiSuccessResponse<Blob> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const headers = getAuthenticatedHeaders(session.accessToken);
    // Add Accept header for file download
    headers["Accept"] = "application/octet-stream";

    const response = await apiClient.get(
      `/TranslationRequest/${id}/download-translated`,
      {
        responseType: "blob",
        headers: headers, // Use updated headers
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Resubmits a rejected translation request.
 * POST /api/TranslationRequest/{id}/resubmit
 * @param id The ID of the request.
 * @param formData FormData containing the user comment and optional new file.
 */
export const resubmitRequest = async (
  id: string,
  formData: FormData
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const headers = getAuthenticatedHeaders(session.accessToken, "");
    delete headers["Content-Type"];

    const response = await apiClient.post<TranslationRequestData>(
      `/TranslationRequest/${id}/resubmit`,
      formData,
      { headers }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

// --- Admin Translation Management Functions ---

/**
 * Gets all translation requests (Admin only).
 * GET /api/admin/Translation
 */
export const getAllRequestsAdmin = async (): Promise<
  ApiSuccessResponse<TranslationRequestData[]> | ApiErrorResponse
> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get<TranslationRequestData[]>(
      "/admin/Translation",
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Gets a specific translation request by ID (Admin only).
 * GET /api/admin/Translation/{id}
 */
export const getRequestByIdAdmin = async (
  id: string
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get<TranslationRequestData>(
      `/admin/Translation/${id}`,
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Approves a translation request (Admin only).
 * POST /api/admin/Translation/{id}/approve
 */
export const approveRequestAdmin = async (
  id: string,
  payload?: AdminCommentPayload
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.post<TranslationRequestData>(
      `/admin/Translation/${id}/approve`,
      payload,
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Rejects a translation request (Admin only).
 * POST /api/admin/Translation/{id}/reject
 */
export const rejectRequestAdmin = async (
  id: string,
  payload: AdminCommentPayload
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    if (!payload?.comment?.trim()) {
      return { error: "Comment is required when rejecting a request." };
    }
    const response = await apiClient.post<TranslationRequestData>(
      `/admin/Translation/${id}/reject`,
      payload,
      {
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Completes a translation request (Admin only).
 * POST /api/admin/Translation/{id}/complete
 * @param id The ID of the request.
 * @param formData FormData containing the translated file and optional admin comment.
 */
export const completeRequestAdmin = async (
  id: string,
  formData: FormData
): Promise<ApiSuccessResponse<TranslationRequestData> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const headers = getAuthenticatedHeaders(
      session.accessToken,
      "multipart/form-data"
    );
    // const headers = getAuthenticatedHeaders(session.accessToken, "");
    // delete headers["Content-Type"];
    // headers

    const response = await apiClient.post<TranslationRequestData>(
      `/admin/Translation/${id}/complete`,
      formData,
      { headers }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Downloads the original file for any request (Admin only).
 * GET /api/admin/Translation/{id}/download-original
 * Returns a Blob wrapped in the success response.
 */
export const downloadOriginalFileAdmin = async (
  id: string
): Promise<ApiSuccessResponse<Blob> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get(
      `/admin/Translation/${id}/download-original`,
      {
        responseType: "blob",
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};

/**
 * Downloads the translated file for any completed request (Admin only).
 * GET /api/admin/Translation/{id}/download-translated
 * Returns a Blob wrapped in the success response.
 */
export const downloadTranslatedFileAdmin = async (
  id: string
): Promise<ApiSuccessResponse<Blob> | ApiErrorResponse> => {
  try {
    const session = await getSessionOrThrow();
    const response = await apiClient.get(
      `/admin/Translation/${id}/download-translated`,
      {
        responseType: "blob",
        headers: getAuthenticatedHeaders(session.accessToken),
      }
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    if (error.message === "User is not authenticated.") {
      return { error: error.message };
    }
    return await handleApiError(error);
  }
};
