
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FeedbackForm } from './FeedbackForm';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  consoleLogs: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, consoleLogs }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <FeedbackForm onClose={onClose} consoleLogs={consoleLogs} />
      </DialogContent>
    </Dialog>
  );
};
