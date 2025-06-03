
import { useRef, useEffect } from 'react';

export const useRenderTracker = (componentName: string, props?: any) => {
  const renderCount = useRef(0);
  const prevProps = useRef<any>();
  
  renderCount.current += 1;
  
  useEffect(() => {
    if (renderCount.current > 1 && prevProps.current) {
      const changedProps: string[] = [];
      if (props) {
        Object.keys(props).forEach(key => {
          if (prevProps.current[key] !== props[key]) {
            changedProps.push(key);
          }
        });
      }
      
      console.log(`🔄 [RENDER_TRACKER] ${componentName} rendered ${renderCount.current} times`, {
        changedProps: changedProps.length > 0 ? changedProps : 'No prop changes detected'
      });
    }
    
    prevProps.current = props;
  });
  
  return renderCount.current;
};
