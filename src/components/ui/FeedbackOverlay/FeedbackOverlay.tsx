import { useTranslation } from '@/hooks/useTranslation';
import { FeedbackForm } from '@/components/ui/FeedbackForm';

type FeedbackOverlayProps = {
  onClose: () => void;
};

export const FeedbackOverlay = ({ onClose }: FeedbackOverlayProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-b-[inherit] border-t border-neutral-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      {/* UNO gradient accent */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#ef6f6f] via-[#5b8ef5] via-50% via-[#4dcb7a] to-[#f0b84d]" />
      <div className="flex max-h-[70%] flex-col overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase dark:text-white/40">
            {t('feedback.cta')} ✉️
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:bg-white/10 dark:text-white/50 dark:hover:bg-white/20 dark:hover:text-white/80"
          >
            ✕
          </button>
        </div>
        <FeedbackForm onSubmitted={onClose} />
      </div>
    </div>
  );
};
