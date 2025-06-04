
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// TEMPORARILY SIMPLIFIED - Removing all complex useEffect hooks and console overrides
// to test if they were causing React Error #300

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category?: string;
}

const PersistentLogViewer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          Debug Logs (Simplified)
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Debug Logs (Temporarily Simplified)</h2>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            ✕
          </Button>
        </div>
        
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium">Logging temporarily disabled</p>
            <p className="text-sm mt-2">Testing for React Error #300 resolution</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PersistentLogViewer;
