
import { toast as toastSonner, type Toast } from "sonner";
import { 
  ToastActionElement, 
  ToastProps 
} from "@/components/ui/toast";

type ToastOptions = ToastProps & {
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const useToast = () => {
  const toast = (options: ToastOptions) => {
    const { title, description, variant = "default", action, ...props } = options;
    
    return toastSonner(title, {
      description,
      ...props,
    });
  };

  return {
    toast,
    toasts: [] // Compatibility with existing interface
  };
};

export { useToast, toastSonner as toast };
