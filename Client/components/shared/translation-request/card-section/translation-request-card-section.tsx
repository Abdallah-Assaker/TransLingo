'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { saveAs } from 'file-saver';
import { TranslationRequestCard } from './translation-request-card/translation-request-card';
import AdminButtons from '@/components/authorized/admin/admin-buttons';
import {
  type TranslationRequestData,
  type OriginalFileDownloadResponse,
  TranslationStatus,
  type ApiErrorResponse,
} from '@/lib/api/interfaces';
import {
  downloadOriginalFile,
  downloadTranslatedFile,
  downloadOriginalFileAdmin,
  downloadTranslatedFileAdmin,
} from '@/lib/api/requests';

// Helper function to check if the response is an error
function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response.error === 'string';
}

export interface TranslateRequestSectionProps {
  requestData: TranslationRequestData;
  fileData: OriginalFileDownloadResponse; // For pre-loaded original file
  translateRequestId: string;
  userRole: 'admin' | 'user';
  onError?: (message: string) => void;
  onRequestUpdate?: () => Promise<void>;
}

export const TranslateRequestSection: React.FC<TranslateRequestSectionProps> = ({
  requestData,
  fileData,
  translateRequestId,
  userRole,
  onError,
  onRequestUpdate,
}) => {
  const router = useRouter();

  const handleUserDownloadOriginalFile = async () => {
    if (fileData?.fileData && fileData?.fileName) {
      try {
        saveAs(fileData.fileData, fileData.fileName);
      } catch (err) {
        console.error("Error triggering download from pre-loaded data:", err);
        onError?.("Could not initiate file download from pre-loaded data.");
      }
    } else {
      const response = await downloadOriginalFile(translateRequestId);
      if (!isApiError(response) && response.data?.fileBlob && response.data?.fileName) {
        saveAs(response.data.fileBlob, response.data.fileName);
      } else {
        const errorMessage = isApiError(response) ? response.error : "Failed to download original file.";
        console.error(errorMessage);
        onError?.(errorMessage);
      }
    }
  };

  const handleUserDownloadTranslatedFile = async () => {
    if (!requestData.translatedFileName) {
      onError?.("Translated file name not available for download.");
      console.error("Attempted to download translated file, but translatedFileName is not set.");
      return;
    }
    const response = await downloadTranslatedFile(translateRequestId);
    if (!isApiError(response) && response.data) {
      saveAs(response.data, requestData.translatedFileName);
    } else {
      const errorMessage = isApiError(response) ? response.error : "Failed to download translated file.";
      console.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleRedirectClick = () => {
    let targetRoute = `/user/translation-request/modify/${translateRequestId}`;
    if (requestData.status === TranslationStatus.Rejected) {
      targetRoute = `/user/translation-request/resubmit/${translateRequestId}`;
    }
    console.log("Redirecting to:", targetRoute);
    router.push(targetRoute);
  };

  // --- Admin Action Handlers (Modified for redirection) ---
  const handleAdminApprove = () => {
    router.push(`/admin/translation-request-response/approve/${translateRequestId}`);
  };

  const handleAdminReject = () => {
    router.push(`/admin/translation-request-response/reject/${translateRequestId}`);
  };

  const handleAdminComplete = () => {
    router.push(`/admin/translation-request-response/complete/${translateRequestId}`);
  };

  const handleAdminDownloadOriginalFile = async () => {
    const response = await downloadOriginalFileAdmin(translateRequestId);
    if (isApiError(response)) {
      onError?.(response.error);
    } else if (response.data && requestData.originalFileName) {
      saveAs(response.data, requestData.originalFileName);
    } else {
      onError?.("Failed to download original file (admin).");
    }
  };

  const handleAdminDownloadTranslatedFile = async () => {
    if (!requestData.translatedFileName) {
      onError?.("Translated file name not available for admin download.");
      return;
    }
    const response = await downloadTranslatedFileAdmin(translateRequestId);
    if (isApiError(response)) {
      onError?.(response.error);
    } else if (response.data) {
      saveAs(response.data, requestData.translatedFileName);
    } else {
      onError?.("Failed to download translated file (admin).");
    }
  };

  // --- Button Logic Determination ---
  let primaryDownloadLabel: string | undefined = undefined;
  let primaryDownloadHandler: (() => Promise<void>) | undefined = undefined;
  let secondaryDownloadLabel: string | undefined = undefined;
  let secondaryDownloadHandler: (() => Promise<void>) | undefined = undefined;
  let redirectLabel: string | undefined = undefined;
  let redirectHandler: (() => void) | undefined = undefined;

  if (userRole === 'user') {
    switch (requestData.status) {
      case TranslationStatus.Pending:
        redirectLabel = "Modify Request";
        redirectHandler = handleRedirectClick;
        primaryDownloadLabel = "Download Original File";
        primaryDownloadHandler = handleUserDownloadOriginalFile;
        break;
      case TranslationStatus.Rejected:
        redirectLabel = "Resubmit Request";
        redirectHandler = handleRedirectClick;
        primaryDownloadLabel = "Download Original File";
        primaryDownloadHandler = handleUserDownloadOriginalFile;
        break;
      case TranslationStatus.Approved:
      case TranslationStatus.Completed:
      case TranslationStatus.Resubmitted:
        if (requestData.translatedFileName) {
          primaryDownloadLabel = "Download Translated File";
          primaryDownloadHandler = handleUserDownloadTranslatedFile;
          secondaryDownloadLabel = "Download Original File";
          secondaryDownloadHandler = handleUserDownloadOriginalFile;
        } else {
          primaryDownloadLabel = "Download Original File";
          primaryDownloadHandler = handleUserDownloadOriginalFile;
        }
        break;
      default:
        primaryDownloadLabel = "Download Original File";
        primaryDownloadHandler = handleUserDownloadOriginalFile;
        break;
    }
  } else if (userRole === 'admin') {
    if (
      requestData.status === TranslationStatus.Pending ||
      requestData.status === TranslationStatus.Rejected
    ) {
      primaryDownloadLabel = "Download Original File";
      primaryDownloadHandler = handleAdminDownloadOriginalFile;
      secondaryDownloadLabel = undefined;
      secondaryDownloadHandler = undefined;
    } else if (
      requestData.status === TranslationStatus.Approved ||
      requestData.status === TranslationStatus.Completed ||
      requestData.status === TranslationStatus.Resubmitted
    ) {
      primaryDownloadLabel = "Download Original File";
      primaryDownloadHandler = handleAdminDownloadOriginalFile;
      if (requestData.translatedFileName) {
        secondaryDownloadLabel = "Download Translated File";
        secondaryDownloadHandler = handleAdminDownloadTranslatedFile;
      } else {
        secondaryDownloadLabel = undefined;
        secondaryDownloadHandler = undefined;
      }
    } else {
      primaryDownloadLabel = "Download Original File";
      primaryDownloadHandler = handleAdminDownloadOriginalFile;
      secondaryDownloadLabel = undefined;
      secondaryDownloadHandler = undefined;
    }
    redirectLabel = undefined;
    redirectHandler = undefined;
  }

  return (
    <div className="w-full">
      <TranslationRequestCard
        requestData={requestData}
        fileData={fileData}
        userRole={userRole}
        redirectButtonLabel={redirectLabel}
        onRedirectClick={redirectHandler}
        downloadButtonLabel={primaryDownloadLabel || "Download"}
        onDownloadButtonClick={primaryDownloadHandler || (() => onError?.("No download action configured."))}
        secondaryDownloadButtonLabel={secondaryDownloadLabel}
        onSecondaryDownloadButtonClick={secondaryDownloadHandler}
      />

      {userRole === 'admin' && requestData && (
        <div className="mt-6">
          <AdminButtons
            status={requestData.status}
            onApprove={handleAdminApprove}
            onReject={handleAdminReject}
            onComplete={handleAdminComplete}
          />
        </div>
      )}
    </div>
  );
};
