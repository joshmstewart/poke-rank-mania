
import { useState, useEffect } from 'react';

export const useSplashLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple 2-second timer - no complex logic
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return { isLoading };
};
