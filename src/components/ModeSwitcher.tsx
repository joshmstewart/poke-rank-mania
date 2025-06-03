
import React from "react";
import { Link } from "react-router-dom";
import { Swords, List } from "lucide-react";

export default function ModeSwitcher() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pokémon Battle Ranker
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose your preferred method to rank and battle Pokémon
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {/* Battle Mode */}
        <Link
          to="/battle"
          className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300"
        >
          <div className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
              <Swords className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Battle Mode</h2>
            <p className="text-gray-600 mb-4">
              Battle Pokémon head-to-head and let our TrueSkill algorithm automatically generate rankings based on your choices.
            </p>
            <div className="text-blue-600 font-semibold group-hover:text-blue-700">
              Start Battling →
            </div>
          </div>
        </Link>

        {/* Rankings - Combined Personal and Global */}
        <Link
          to="/community"
          className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-green-300"
        >
          <div className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
              <List className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Rankings</h2>
            <p className="text-gray-600 mb-4">
              Manage your personal rankings with drag-and-drop, or view global community rankings based on all users' data.
            </p>
            <div className="text-green-600 font-semibold group-hover:text-green-700">
              View Rankings →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
