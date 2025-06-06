
// This is where the real implementation should be
import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  // Add the duration property to match how we're using it
  duration?: number;
}

// Allow calling toast with options object or with title string + options
export function toast(titleOrOptions: string | ToastOptions, options?: Omit<ToastOptions, "title">) {
  if (typeof titleOrOptions === 'string') {
    // If first arg is a string, it's the title
    const title = titleOrOptions;
    sonnerToast(title, {
      ...options,
      // Set a default duration if not specified
      duration: options?.duration ?? 5000
    });
  } else {
    // If first arg is an object, it's the options
    const { title, duration = 5000, ...rest } = titleOrOptions;
    sonnerToast(title || "", {
      ...rest,
      // Ensure duration is passed to sonner toast
      duration: duration
    });
  }
}

// Re-export other toast hook functionality
export { useToast } from "./use-toast-base";
