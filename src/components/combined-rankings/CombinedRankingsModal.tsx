
import React, { useState } from 'react';
import { DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalRankingsView from './GlobalRankingsView';
import PersonalRankingsView from './PersonalRankingsView';

interface CombinedRankingsModalProps {
  onClose: () => void;
}

const CombinedRankingsModal: React.FC<CombinedRankingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 m-0 border-0 rounded-none">
      {/* Full-screen overlay with close button */}
      <div className="min-h-screen bg-gray-100 relative">
        {/* Close button in top-right corner */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="bg-white shadow-lg hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main content */}
        <div className="container max-w-7xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow border mb-6 p-6">
            <h1 className="text-2xl font-bold text-center mb-2">Pokemon Rankings Hub</h1>
            <p className="text-center text-gray-600">
              View and manage your personal rankings or explore global community rankings
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="personal" className="text-lg py-3">
                Your Rankings
              </TabsTrigger>
              <TabsTrigger value="global" className="text-lg py-3">
                Global Rankings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <PersonalRankingsView />
            </TabsContent>

            <TabsContent value="global">
              <GlobalRankingsView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DialogContent>
  );
};

export default CombinedRankingsModal;
