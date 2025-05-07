import React from 'react';
import { Button } from "@/components/ui/button";
import { TranslationStatus } from '@/lib/api/interfaces'; // Import TranslationStatus

interface AdminButtonsProps {
  status: TranslationStatus;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
}

const AdminButtons: React.FC<AdminButtonsProps> = ({ status, onApprove, onReject, onComplete }) => {
  return (
    <div style={styles.card} className="">
      {status === TranslationStatus.Pending && (
        <div className="flex flex-col md:flex-row gap-14">
          <Button onClick={onApprove} variant="default" size="lg" className="w-full sm:w-auto">
            Approve Request
          </Button>
          <Button onClick={onReject} variant="destructive" size="lg" className="w-full sm:w-auto">
            Reject Request
          </Button>
        </div>
      )}
      {(status === TranslationStatus.Approved || status === TranslationStatus.Rejected) && (
        <Button onClick={onComplete} variant="default" size="lg" className="w-full sm:w-auto">
          Complete Request
        </Button>
      )}
      {/* Add other admin-specific buttons here if needed, based on status or other criteria */}
    </div>
  );
};

const styles = {
  card: {
    padding: '20px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, #e0e0e0, #f5f5f5)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    gap: '15px', // Increased gap for better spacing
  },
  // Button styles are now primarily handled by shadcn/ui Button component and utility classes
};

export default AdminButtons;
