
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { useConsoleCapture } from '@/hooks/useConsoleCapture';

export const FeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getLogsAsString } = useConsoleCapture();

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
        title="Send Feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        consoleLogs={getLogsAsString()}
      />
    </>
  );
};
