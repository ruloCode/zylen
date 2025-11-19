import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should be closed */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Modal description for screen readers (optional) */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Sticky footer content (optional) - replaces default close button */
  footer?: React.ReactNode;
  /** Maximum width of the modal on desktop */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Whether to show the close button in header */
  showCloseButton?: boolean;
  /** Custom className for the modal container */
  className?: string;
  /** Whether to show mobile-optimized fullscreen layout */
  fullscreenOnMobile?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  showCloseButton = true,
  className,
  fullscreenOnMobile = true,
}: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 md:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform transition-all',
                  // Mobile: fullscreen layout
                  fullscreenOnMobile && 'h-full md:h-auto md:rounded-3xl',
                  // Desktop: centered modal
                  !fullscreenOnMobile && 'rounded-3xl',
                  'md:my-8 md:max-h-[calc(100vh-4rem)]',
                  // Base styles
                  'bg-charcoal-500 shadow-2xl flex flex-col border border-white/10',
                  // Max width (desktop only)
                  `md:${maxWidthClasses[maxWidth]}`,
                  className
                )}
              >
                {/* Header - Sticky on mobile */}
                {(title || showCloseButton) && (
                  <div className="sticky top-0 z-10 flex-shrink-0 bg-charcoal-600/95 backdrop-blur-sm border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between md:rounded-t-3xl">
                    <div className="flex-1">
                      {title && (
                        <Dialog.Title className="text-xl md:text-2xl font-bold text-white">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="sr-only">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors ml-4 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Cerrar modal"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>

                {/* Footer - Sticky bottom action buttons */}
                {footer ? (
                  <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-charcoal-600/95 backdrop-blur-sm sticky bottom-0">
                    {footer}
                  </div>
                ) : (
                  // Default footer: close button on mobile only
                  fullscreenOnMobile && showCloseButton && (
                    <div className="md:hidden flex-shrink-0 border-t border-white/10 p-4 bg-charcoal-600">
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white font-semibold touch-manipulation min-h-[44px]"
                      >
                        Cerrar
                      </button>
                    </div>
                  )
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
