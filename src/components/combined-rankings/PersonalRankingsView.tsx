
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PersonalRankingsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Personal Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Personal rankings view will be implemented next. This will include:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• Available Pokémon grid (milestone-style cards)</li>
            <li>• Your ranked Pokémon grid (milestone-style cards)</li>
            <li>• Drag and drop functionality with TrueSkill updates</li>
            <li>• Complete isolation from existing manual ranking page</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalRankingsView;
