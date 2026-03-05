import { useState, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';
import { analytics } from '@/services/analytics';
import { cn } from '@/utils/cn';
import { RatingCards } from './RatingCards';

type FeedbackFormProps = {
  onSubmitted: () => void;
  onSkip?: () => void;
};

const MESSAGE_MAX_LENGTH = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FeedbackForm = ({ onSubmitted, onSkip }: FeedbackFormProps) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [emailError, setEmailError] = useState(false);

  const successSpring = useSpring({
    opacity: status === 'success' ? 1 : 0,
    scale: status === 'success' ? 1 : 0.8,
    config: { tension: 260, friction: 20 },
  });

  const handleSubmit = useCallback(async () => {
    if (rating === 0 && message.trim().length === 0) {
      setShakeKey((k) => k + 1);
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0 && !EMAIL_RE.test(trimmedEmail)) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setStatus('submitting');
    const ok = await analytics.submitFeedback({
      rating,
      message: message.trim(),
      email: email.trim(),
      submittedAt: Date.now(),
    });

    if (ok) {
      setStatus('success');
      setTimeout(onSubmitted, 2000);
    } else {
      setStatus('error');
    }
  }, [rating, message, email, onSubmitted]);

  if (status === 'success') {
    return (
      // @ts-expect-error animated.div children type mismatch with React 19
      <animated.div
        className="flex flex-col items-center gap-2 py-3"
        style={{
          opacity: successSpring.opacity,
          transform: successSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        {/* Reverse card icon */}
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ef6f6f] via-[#5b8ef5] to-[#4dcb7a] shadow-lg">
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14l-4-4 4-4" />
            <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('feedback.thankYou')}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {t('feedback.thankYouSub')}
        </p>
      </animated.div>
    );
  }

  return (
    <div
      key={shakeKey}
      className="flex w-full flex-1 flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex flex-1 flex-col space-y-3 py-4">
        {/* Rating */}
        <div className="space-y-4 pb-4">
          <span className="block text-center text-[10px] font-medium tracking-wide text-neutral-400 uppercase dark:text-white/40">
            {t('feedback.ratingLabel')}
          </span>
          <RatingCards value={rating} onChange={setRating} />
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={5}
          placeholder={t('feedback.messagePlaceholder')}
          className={cn(
            'w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs',
            'text-neutral-900 placeholder:text-neutral-400',
            'dark:border-neutral-700 dark:bg-neutral-900',
            'dark:text-white dark:placeholder:text-neutral-500',
            'transition-colors outline-none',
            'focus:border-[#5b8ef5] focus:ring-1 focus:ring-[#5b8ef5]',
          )}
        />

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(false);
          }}
          placeholder={t('feedback.emailPlaceholder')}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-xs',
            'text-neutral-900 placeholder:text-neutral-400',
            'dark:bg-neutral-900',
            'dark:text-white dark:placeholder:text-neutral-500',
            'transition-colors outline-none',
            emailError
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
              : 'border-neutral-300 dark:border-neutral-700 focus:border-[#5b8ef5] focus:ring-1 focus:ring-[#5b8ef5]',
          )}
        />

        {status === 'error' && (
          <p className="text-center text-xs text-red-500">
            Something went wrong. Try again?
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'submitting'}
            className={cn(
              'w-full rounded-xl px-6 py-2 text-xs font-semibold transition-transform',
              'bg-neutral-900 text-white hover:scale-[1.02] disabled:opacity-50',
              'dark:bg-white/90 dark:text-neutral-900',
              'cursor-pointer focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:focus:ring-white/50',
            )}
          >
            {status === 'submitting' ? '...' : t('feedback.submit')}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="cursor-pointer text-xs text-neutral-400 underline transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              {t('feedback.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
