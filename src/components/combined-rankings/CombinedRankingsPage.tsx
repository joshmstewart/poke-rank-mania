
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlobalRankingsView from './GlobalRankingsView';
import PersonalRankingsView from './PersonalRankingsView';

const CombinedRankingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Pokemon Rankings Hub</CardTitle>
            <CardDescription className="text-center">
              View and manage your personal rankings or explore global community rankings
            </CardDescription>
          </CardHeader>
        </Card>

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
  );
};

export default CombinedRankingsPage;
