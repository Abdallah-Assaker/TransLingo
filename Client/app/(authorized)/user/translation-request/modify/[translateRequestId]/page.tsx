'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRequestById, updateRequest } from '@/lib/api/requests'; // Import API functions
import { TranslationRequestData, UpdateTranslationRequestPayload, TranslationStatus } from '@/lib/api/interfaces'; // Import types
import UpdateTranslationRequestForm from '@/components/authorized/user/modify-translation-request-form'; // Import the form component
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error/fallback state
import { Terminal, Ban } from "lucide-react"; // Icons for alerts
import { toast } from 'react-toastify'; // For notifications
import { Button } from "@/components/ui/button"; // For the button component

// Helper function to check if the response is an error
function isApiError(response: any): response is { error: string } {
  return response && typeof response.error === 'string';
}

export default function UpdateTranslateRequestPage() {
  const params = useParams();
  const router = useRouter();
  const translateRequestId = params.translateRequestId as string;

  const [requestData, setRequestData] = useState<TranslationRequestData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch request data on component mount
  useEffect(() => {
    if (!translateRequestId) {
      setError("Request ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setRequestData(null);

      try {
        const response = await getRequestById(translateRequestId);

        if (isApiError(response)) {
          throw new Error(response.error);
        }
        if (!response.data) {
          throw new Error("Failed to fetch request details: No data received.");
        }

        // Check if the status allows modification (Pending or Rejected)
        if (response.data.status !== TranslationStatus.Pending && response.data.status !== TranslationStatus.Rejected) {
          setError(`Modification is not allowed for requests with status: ${TranslationStatus[response.data.status]}. Only Pending or Rejected requests can be modified.`);
          // Still set requestData to show details in the error message if needed, but don't allow form rendering
          setRequestData(response.data);
        } else {
          setRequestData(response.data);
        }

      } catch (err: any) {
        console.error("Error fetching translation request details:", err);
        setError(err.message || "An unknown error occurred while fetching request details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [translateRequestId]);

  // Handle form submission
  const handleFormSubmit = async (payload: UpdateTranslationRequestPayload) => {
    if (!requestData) {
      toast.error("Cannot submit update: Original request data is missing.");
      return;
    }

    // Ensure the ID matches
    if (payload.id !== translateRequestId) {
      toast.error("ID mismatch. Cannot update request.");
      return;
    }

    console.log("Submitting update payload:", payload);

    try {
      // Call the updateRequest server action
      const result = await updateRequest(translateRequestId, payload);

      if (isApiError(result)) {
        console.error("Server Response (Error):", result);
        toast.error(result.error);
      } else {
        console.log("Server Response (Success):", result);
        toast.success(`Request "${result.data.title}" updated successfully!`);
        // Redirect back to the view page after successful update
        router.push(`/user/translation-request/view/${translateRequestId}`);
        router.refresh(); // Ensure data is refreshed on the view page
      }
    } catch (error: any) {
      // Handle unexpected errors during the API call itself
      console.error("Unexpected error during form submission:", error);
      toast.error("An unexpected error occurred while updating the request. Please try again.");
      // Re-throw or handle as needed, maybe set an error state on the page
    }
    // Note: isSubmitting state is handled within the UpdateTranslationRequestForm component
  };

  // --- Render Logic ---

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-32 mt-4" />
      </div>
    );
  }

  // 2. Error State (Fetch error OR Status not allowed)
  if (error) {
    const isStatusError = requestData && (requestData.status !== TranslationStatus.Pending);
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          {isStatusError ? <Ban className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
          <AlertTitle>{isStatusError ? "Modification Not Allowed" : "Error Loading Request"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {/* Optionally add a button to go back */}
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  // 3. Data loaded but null (Should ideally be caught by error state, but as a fallback)
  if (!requestData) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Translation request data could not be loaded.</AlertDescription>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  // 4. Success State - Render the Form
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Modify Translation Request</h1>
      <UpdateTranslationRequestForm
        translationRequestData={requestData}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
