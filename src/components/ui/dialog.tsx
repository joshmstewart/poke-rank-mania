import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  React.useEffect(() => {
    console.log(`🔍 [DIALOG_DEBUG] DialogOverlay mounted with z-index 9998`);
    
    // More comprehensive DOM inspection
    setTimeout(() => {
      // Check all possible selectors for dialog elements
      const overlaySelectors = [
        '[data-radix-dialog-overlay]',
        '[data-state="open"][role="dialog"]',
        '.fixed.inset-0.z-\\[9998\\]',
        '[data-radix-collection-item]'
      ];
      
      let foundOverlays = [];
      overlaySelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 [DIALOG_DEBUG] Selector "${selector}" found ${elements.length} elements`);
        elements.forEach((el, index) => {
          foundOverlays.push({ selector, element: el, index });
        });
      });
      
      console.log(`🔍 [DIALOG_DEBUG] Total overlay-like elements found: ${foundOverlays.length}`);
      
      // Check the entire document body for any elements with high z-index
      const allElements = document.querySelectorAll('*');
      const elementsWithZIndex = [];
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex >= 1000) {
          elementsWithZIndex.push({
            element: el,
            zIndex: zIndex,
            position: style.position,
            tagName: el.tagName,
            className: el.className,
            id: el.id
          });
        }
      });
      
      console.log(`🔍 [DIALOG_DEBUG] Elements with z-index >= 1000:`, elementsWithZIndex);
      
      // Check for portal containers
      const portalContainers = document.querySelectorAll('[data-radix-portal]');
      console.log(`🔍 [DIALOG_DEBUG] Found ${portalContainers.length} portal containers`);
      portalContainers.forEach((container, index) => {
        console.log(`🔍 [DIALOG_DEBUG] Portal container ${index}:`, {
          tagName: container.tagName,
          className: container.className,
          childCount: container.children.length,
          innerHTML: container.innerHTML.substring(0, 200)
        });
      });
      
      // Check document.body direct children for dialogs
      const bodyChildren = Array.from(document.body.children);
      console.log(`🔍 [DIALOG_DEBUG] Document.body has ${bodyChildren.length} direct children`);
      bodyChildren.forEach((child, index) => {
        if (child.tagName !== 'SCRIPT') {
          const style = window.getComputedStyle(child);
          console.log(`🔍 [DIALOG_DEBUG] Body child ${index}:`, {
            tagName: child.tagName,
            className: child.className,
            zIndex: style.zIndex,
            position: style.position,
            display: style.display
          });
        }
      });
    }, 200);
  }, []);

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[9998] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  React.useEffect(() => {
    console.log(`🔍 [DIALOG_DEBUG] DialogContent mounted with z-index 10001`);
    
    setTimeout(() => {
      // Check for content elements
      const contentSelectors = [
        '[data-radix-dialog-content]',
        '.fixed.left-\\[50\\%\\].top-\\[50\\%\\].z-\\[10001\\]'
      ];
      
      contentSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 [DIALOG_DEBUG] Content selector "${selector}" found ${elements.length} elements`);
        
        elements.forEach((content, index) => {
          const style = window.getComputedStyle(content);
          const rect = content.getBoundingClientRect();
          console.log(`🔍 [DIALOG_DEBUG] Content ${index} details:`, {
            zIndex: style.zIndex,
            position: style.position,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            transform: style.transform,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              visible: rect.width > 0 && rect.height > 0
            }
          });
          
          // Check the parent chain for stacking context creators
          let parent = content.parentElement;
          let level = 0;
          while (parent && level < 10) {
            const parentStyle = window.getComputedStyle(parent);
            const hasStackingContext = 
              parentStyle.zIndex !== 'auto' ||
              parentStyle.opacity !== '1' ||
              parentStyle.transform !== 'none' ||
              parentStyle.position === 'fixed' ||
              parentStyle.position === 'sticky';
              
            if (hasStackingContext) {
              console.log(`🔍 [DIALOG_DEBUG] Stacking context creator at level ${level}:`, {
                tagName: parent.tagName,
                className: parent.className,
                zIndex: parentStyle.zIndex,
                opacity: parentStyle.opacity,
                transform: parentStyle.transform,
                position: parentStyle.position
              });
            }
            
            parent = parent.parentElement;
            level++;
          }
        });
      });
    }, 200);
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-[10001] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
