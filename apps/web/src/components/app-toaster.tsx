'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: 'border-border bg-popover text-popover-foreground',
        },
      }}
    />
  );
}
