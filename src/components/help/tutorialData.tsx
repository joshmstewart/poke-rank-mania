
import React from "react";
import { TutorialSlideData } from "./TutorialSlide";

export const tutorialSlides: TutorialSlideData[] = [
  {
    id: "welcome",
    title: "Welcome to Pokémon Ranker! 🎉",
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">⚔️</div>
        <p className="text-lg">
          Ready to discover your favorite Pokémon? This interactive tutorial will show you how to use all the features.
        </p>
        <p className="text-gray-600">
          You can navigate with the arrow keys or click the buttons below.
        </p>
      </div>
    )
  },
  {
    id: "modes",
    title: "Choose Your Mode",
    highlightSelector: "[data-tutorial='mode-controls']",
    content: (
      <div className="space-y-4">
        <p>
          <strong>Pokémon Ranker</strong> has two main modes to help you discover your preferences:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">⚔️ Battle Mode</h4>
            <p className="text-sm text-blue-700">
              Compare Pokémon head-to-head and let our smart algorithm learn your preferences automatically.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">📋 Manual Ranking</h4>
            <p className="text-sm text-green-700">
              Drag and drop Pokémon to create your perfect ranking list manually.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Look at the highlighted area in the header to see where you can switch between modes!
        </p>
      </div>
    )
  },
  {
    id: "battle-mode",
    title: "Battle Mode Explained",
    highlightSelector: "[data-tutorial='battle-button']",
    content: (
      <div className="space-y-4">
        <div className="text-center text-4xl mb-4">⚔️</div>
        <p>
          <strong>Battle Mode</strong> is where the magic happens! Here's how it works:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li><strong>Choose your favorite</strong> - Click on the Pokémon you prefer in each battle</li>
          <li><strong>Smart learning</strong> - Our TrueSkill algorithm learns your preferences over time</li>
          <li><strong>Battle types</strong> - Choose between 2-Pokémon or 3-Pokémon battles</li>
          <li><strong>Generation filters</strong> - Focus on Pokémon from specific games</li>
          <li><strong>Milestones</strong> - See your rankings every 25 battles</li>
        </ul>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> The more battles you complete, the more accurate your rankings become!
          </p>
        </div>
      </div>
    )
  },
  {
    id: "manual-ranking",
    title: "Manual Ranking Mode",
    highlightSelector: "[data-tutorial='rank-button']",
    content: (
      <div className="space-y-4">
        <div className="text-center text-4xl mb-4">📋</div>
        <p>
          <strong>Manual Ranking</strong> gives you complete control over your list:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li><strong>Drag & Drop</strong> - Move Pokémon from "Available" to "Rankings"</li>
          <li><strong>Reorder easily</strong> - Drag Pokémon up or down in your rankings</li>
          <li><strong>Voting arrows</strong> - Use ↑↓ buttons to suggest ranking changes</li>
          <li><strong>Generation filtering</strong> - Focus on specific Pokémon groups</li>
          <li><strong>Quick removal</strong> - Drag Pokémon back to Available to remove them</li>
        </ul>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            🎯 <strong>Perfect for:</strong> Fine-tuning rankings from Battle Mode or creating lists from scratch!
          </p>
        </div>
      </div>
    )
  },
  {
    id: "generation-filter",
    title: "Generation Filtering",
    highlightSelector: "[data-tutorial='generation-filter']",
    content: (
      <div className="space-y-4">
        <div className="text-center text-4xl mb-4">🎮</div>
        <p>
          Focus on Pokémon from your favorite games with <strong>Generation Filtering</strong>:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <div className="bg-red-50 p-2 rounded">Gen 1: Kanto</div>
          <div className="bg-yellow-50 p-2 rounded">Gen 2: Johto</div>
          <div className="bg-green-50 p-2 rounded">Gen 3: Hoenn</div>
          <div className="bg-blue-50 p-2 rounded">Gen 4: Sinnoh</div>
          <div className="bg-purple-50 p-2 rounded">Gen 5: Unova</div>
          <div className="bg-pink-50 p-2 rounded">Gen 6: Kalos</div>
          <div className="bg-orange-50 p-2 rounded">Gen 7: Alola</div>
          <div className="bg-indigo-50 p-2 rounded">Gen 8: Galar</div>
          <div className="bg-emerald-50 p-2 rounded">Gen 9: Paldea</div>
        </div>
        <p className="text-sm text-gray-600">
          The generation filter is available in both Battle and Manual Ranking modes!
        </p>
      </div>
    )
  },
  {
    id: "save-progress",
    title: "Save Your Progress",
    highlightSelector: "[data-tutorial='save-progress']",
    content: (
      <div className="space-y-4">
        <div className="text-center text-4xl mb-4">💾</div>
        <p>
          Never lose your progress with our <strong>Cloud Sync</strong> feature:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li><strong>Automatic local saving</strong> - Your data is saved in your browser</li>
          <li><strong>Cloud sync</strong> - Sign in to save across devices</li>
          <li><strong>Battle history</strong> - All your battles are remembered</li>
          <li><strong>Rankings backup</strong> - Your manual rankings are preserved</li>
        </ul>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            🔒 <strong>Privacy:</strong> Your data is only yours. We don't share your rankings with anyone!
          </p>
        </div>
      </div>
    )
  },
  {
    id: "tips",
    title: "Pro Tips & Tricks",
    content: (
      <div className="space-y-4">
        <div className="text-center text-4xl mb-4">💡</div>
        <p className="font-semibold mb-3">Get the most out of Pokémon Ranker:</p>
        <div className="space-y-3">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm"><strong>🎯 Start with Battle Mode</strong> - It's the fastest way to discover your preferences</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm"><strong>📊 Check milestones</strong> - Review your rankings every 25 battles</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm"><strong>🔄 Switch modes</strong> - Use Manual Ranking to fine-tune Battle Mode results</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm"><strong>ℹ️ Explore details</strong> - Click the info button on any Pokémon for stats and info</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ready",
    title: "You're Ready to Begin! 🚀",
    content: (
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-lg font-semibold">
          You now know everything you need to start ranking Pokémon!
        </p>
        <p className="text-gray-600">
          Remember: You can access this tutorial anytime by clicking the Help button in the header.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <p className="text-sm">
            <strong>Ready to start?</strong> Click "Get Started!" below to close this tutorial and begin your Pokémon ranking journey!
          </p>
        </div>
      </div>
    )
  }
];
