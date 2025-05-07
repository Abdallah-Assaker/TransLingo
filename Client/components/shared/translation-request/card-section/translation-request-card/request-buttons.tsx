'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { TranslationStatus } from '@/lib/api/interfaces';

interface RequestButtonsProps {
  status: TranslationStatus;
  requestId: string;
  userRole: 'admin' | 'user';
  downloadButtonLabel: string;
  onDownloadButtonClick: () => void;
  redirectButtonLabel?: string;
  onRedirectClick?: (translateRequestId: string) => void;
  secondaryDownloadButtonLabel?: string; // New prop
  onSecondaryDownloadButtonClick?: () => void; // New prop
  // Add more props for other admin/user actions as needed
}

export const RequestButtons: React.FC<RequestButtonsProps> = ({
  status,
  requestId,
  userRole,
  downloadButtonLabel,
  onDownloadButtonClick,
  redirectButtonLabel,
  onRedirectClick,
  secondaryDownloadButtonLabel, // Destructure new prop
  onSecondaryDownloadButtonClick, // Destructure new prop
}) => {
  const canModifyOrResubmit =
    userRole === 'user' &&
    (status === TranslationStatus.Pending || status === TranslationStatus.Rejected) &&
    onRedirectClick &&
    redirectButtonLabel;

  return (
    <div className="pt-4 flex flex-wrap justify-between gap-2"> {/* Changed to justify-start */}
      {/* Action Button (Modify/Resubmit for User) */}
      {canModifyOrResubmit && (
        <Button
          onClick={() => onRedirectClick(requestId)}
          variant="outline"
          className="flex-grow sm:flex-grow-0"
        >
          {redirectButtonLabel}
        </Button>
      )}

      {/* Main Download Button */}
      {downloadButtonLabel && onDownloadButtonClick && (
        <Button
          onClick={onDownloadButtonClick}
          className="flex-grow sm:flex-grow-0"
        >
          {downloadButtonLabel}
        </Button>
      )}

      {/* Secondary Download Button */}
      {secondaryDownloadButtonLabel && onSecondaryDownloadButtonClick && (
        <Button
          onClick={onSecondaryDownloadButtonClick}
          variant="outline" // Or any other variant you prefer
          className="flex-grow sm:flex-grow-0"
        >
          {secondaryDownloadButtonLabel}
        </Button>
      )}

      {/* Placeholder for other potential buttons based on role and status */}
      {/* Example for an admin action:
      {userRole === 'admin' && status === TranslationStatus.Pending && (
        <Button onClick={() => console.log("Admin approve action")} variant="default">
          Approve
        </Button>
      )}
      */}
    </div>
  );
};
