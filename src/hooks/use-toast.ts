
import { toast as toastSonner } from "sonner";
import { 
  ToastActionElement, 
  ToastProps 
} from "@/components/ui/toast";

type ToastOptions = ToastProps & {
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const useToast = () => {
  const toast = (options: ToastOptions | string) => {
    // Handle string case (simple message)
    if (typeof options === 'string') {
      return toastSonner(options);
    }
    
    // Handle object case (with title and potentially other options)
    const { title, description, variant = "default", action, ...props } = options;
    
    return toastSonner(title as string, {
      description,
      ...props,
    });
  };

  return {
    toast,
    toasts: [] // Compatibility with existing interface
  };
};

// Export a simplified version for direct usage
const toast = (title: string, options?: any) => {
  return toastSonner(title, options);
};

export { useToast, toast };
