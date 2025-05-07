"use server"; // Mark this module as server-only

import apiClient, { getAuthenticatedHeaders } from "./client";
import type {
  RegisterPayload,
  UserProfileData,
  UpdateProfilePayload,
  AdminUpdateUserPayload,
} from "./interfaces";
import { z } from "zod";
import { signUpSchema } from "@/lib/schemas/auth-schemas";
import { AxiosResponse } from "axios";
import { getSessionOrThrow } from "./requests";

/**
 * Helper function for standardized error handling in API calls. Now async and exportable.
 */
export const handleApiError = async (
  error: any
): Promise<{ error: string; issues?: any }> => {
  console.error("API call failed:", error);
  // Extract error message from Axios error structure if available
  const errorMessage =
    error.response?.data?.message || // Backend specific error message
    error.response?.data?.title || // ASP.NET Core validation problem details title
    (typeof error.response?.data === "string" ? error.response.data : null) || // Handle plain string errors
    error.message || // General error message
    "An unexpected error occurred.";
  const issues = error.response?.data?.errors; // Capture validation issues if available (ASP.NET Core ProblemDetails)
  console.error("Formatted error message:", errorMessage, "Issues:", issues);

  // Check if the error response contains validation issues (ProblemDetails format)
  if (issues && typeof issues === "object") {
    // Flatten the validation errors into a more readable format if needed
    const formattedIssues = Object.entries(issues)
      .map(
        ([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`
      )
      .join("; ");
    return {
      error: `${errorMessage} Validation Errors: ${formattedIssues}`,
      issues: issues, // Keep original structure if needed downstream
    };
  }

  return {
    error: errorMessage,
  };
};

/**
 * Gets the profile of the currently authenticated user.
 * GET /api/Auth/profile
 * Returns status, statusText, and user profile data on success, or an error object.
 */
export const getUserProfile = async (): Promise<
  | { statusCode: number; statusText: string; data: UserProfileData }
  | { error: string }
> => {
  try {
    const session = await getSessionOrThrow();

    const response = await apiClient.get<UserProfileData>("/Auth/profile", {
      headers: getAuthenticatedHeaders(session.accessToken),
    });
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    return await handleApiError(error);
  }
};

/**
 * Updates the profile of the currently authenticated user.
 * PUT /api/Auth/profile
 * Returns status, statusText, and response data on success, or an error object.
 */
export const updateUserProfile = async (
  payload: UpdateProfilePayload
): Promise<
  | {
      statusCode: number;
      statusText: string;
      data: { message: string; user: UserProfileData };
    }
  | { error: string; issues?: any }
> => {
  try {
    const session = await getSessionOrThrow();

    const response = await apiClient.put("/Auth/profile", payload, {
      headers: getAuthenticatedHeaders(session.accessToken),
    });
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    return await handleApiError(error);
  }
};

/**
 * Gets a list of all users (Admin only).
 * GET /api/Auth/users
 * Returns status, statusText, and user list data on success, or an error object.
 */
export const getAllUsersAdmin = async (): Promise<
  | { statusCode: number; statusText: string; data: UserProfileData[] }
  | { error: string }
> => {
  try {
    const session = await getSessionOrThrow();
    // Optional: Add role check here if needed before making the API call
    // if (!session.user?.roles?.includes('Admin')) {
    //   throw new Error("Unauthorized: Admin role required.");
    // }

    const response = await apiClient.get<UserProfileData[]>("/Auth/users", {
      headers: getAuthenticatedHeaders(session.accessToken),
    });
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    return await handleApiError(error);
  }
};

/**
 * Gets a specific user's profile by ID (Admin only).
 * GET /api/Auth/users/{userId}
 * Returns status, statusText, and user profile data on success, or an error object.
 */
export const getUserByIdAdmin = async (
  userId: string
): Promise<
  | { statusCode: number; statusText: string; data: UserProfileData }
  | { error: string }
> => {
  try {
    const session = await getSessionOrThrow();

    const response = await apiClient.get<UserProfileData>(
      `/Auth/users/${userId}`,
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
    return await handleApiError(error);
  }
};

/**
 * Updates a specific user's profile by ID (Admin only).
 * PUT /api/Auth/users
 * Returns status, statusText, and response data on success, or an error object.
 */
export const updateUserAdmin = async (
  payload: AdminUpdateUserPayload
): Promise<
  | {
      statusCode: number;
      statusText: string;
      data: { message: string; user: UserProfileData };
    }
  | { error: string; issues?: any }
> => {
  try {
    const session = await getSessionOrThrow();

    const response = await apiClient.put("/Auth/users", payload, {
      headers: getAuthenticatedHeaders(session.accessToken),
    });
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    return await handleApiError(error);
  }
};

/**
 * Server action for handling user sign-up.
 * Validates input against signUpSchema and calls the registration API.
 * Returns an object with status code, status text, and data on success, or an error object.
 */
export const signUpAction = async (
  values: z.infer<typeof signUpSchema>
): Promise<
  | { statusCode: number; statusText: string; data: any }
  | { error: string; issues?: z.ZodIssue[] | any }
> => {
  const validatedFields = signUpSchema.safeParse(values);
  console.log("Validating sign-up fields:", values);

  if (!validatedFields.success) {
    console.error("Sign-up validation failed:", validatedFields.error.errors);
    return {
      error: "Invalid fields provided.",
      issues: validatedFields.error.errors,
    };
  }
  console.log("Sign-up validation successful.");

  const { firstName, lastName, email, password, confirmPassword } =
    validatedFields.data;

  try {
    const payload: RegisterPayload = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    };
    console.log("Attempting to register user with payload:", payload);
    const response: AxiosResponse<any> = await apiClient.post(
      "/Auth/register",
      payload
    );
    console.log(
      "Registration API call successful:",
      response.status,
      response.statusText,
      response.data
    );
    return {
      statusCode: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    const apiError = await handleApiError(error);
    return apiError;
  }
};
