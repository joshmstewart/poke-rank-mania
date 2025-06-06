
import React, { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        <div className="animate-fade-in">
          <Logo />
        </div>
        <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-white text-xl font-semibold">Welcome to PokeRank Mania!</p>
          <p className="text-white/80 text-sm mt-2">Get ready to rank your favorite Pokémon</p>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
