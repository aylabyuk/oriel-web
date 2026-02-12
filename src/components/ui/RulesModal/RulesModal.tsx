import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from '@/hooks/useTranslation';
import { CARD_TEXTURES } from '@/constants/cards';
import { cn } from '@/utils/cn';

type RulesModalProps = {
  open: boolean;
  onClose: () => void;
};

const CardImg = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const src = CARD_TEXTURES[name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={name.replace('.png', '')}
      className={cn('h-16 rounded-md shadow-md sm:h-20', className)}
      draggable={false}
    />
  );
};

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-white">{children}</h3>
);

const SectionBody = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs leading-relaxed text-neutral-600 dark:text-white/70">{children}</p>
);

export const RulesModal = ({ open, onClose }: RulesModalProps) => {
  const { t } = useTranslation();
  const springs = useSpring({
    opacity: open ? 1 : 0,
    scale: open ? 1 : 0.95,
    config: { tension: 260, friction: 22 },
  });

  return (
    <>
      {/* Backdrop */}
      <animated.div
        // @ts-expect-error animated.div props type mismatch with React 19
        className="fixed inset-0 z-80 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: springs.opacity,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      {/* Modal */}
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className={cn(
          'fixed inset-4 z-80 m-auto flex max-h-[85vh] max-w-lg flex-col',
          'rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md dark:bg-neutral-900/95',
          'sm:inset-8',
        )}
        style={{
          opacity: springs.opacity,
          scale: springs.scale,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-white/10">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {t('rules.title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('rules.close')}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {/* Objective */}
          <section>
            <SectionHeading>{t('rules.objective.heading')}</SectionHeading>
            <SectionBody>{t('rules.objective.body')}</SectionBody>
          </section>

          {/* Number Cards */}
          <section>
            <SectionHeading>{t('rules.numberCards.heading')}</SectionHeading>
            <SectionBody>{t('rules.numberCards.body')}</SectionBody>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <CardImg name="red3.png" />
              <CardImg name="blue7.png" />
              <CardImg name="green1.png" />
              <CardImg name="yellow9.png" />
            </div>
          </section>

          {/* Action Cards */}
          <section>
            <SectionHeading>{t('rules.actionCards.heading')}</SectionHeading>
            <SectionBody>{t('rules.actionCards.body')}</SectionBody>

            <div className="mt-3 space-y-3">
              {/* Skip */}
              <div className="flex items-start gap-3">
                <CardImg name="redSkip.png" />
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white/90">
                    {t('rules.actionCards.skip.name')}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/60">
                    {t('rules.actionCards.skip.desc')}
                  </p>
                </div>
              </div>

              {/* Reverse */}
              <div className="flex items-start gap-3">
                <CardImg name="blueReverse.png" />
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white/90">
                    {t('rules.actionCards.reverse.name')}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/60">
                    {t('rules.actionCards.reverse.desc')}
                  </p>
                </div>
              </div>

              {/* Draw Two */}
              <div className="flex items-start gap-3">
                <CardImg name="greenDrawTwo.png" />
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white/90">
                    {t('rules.actionCards.drawTwo.name')}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/60">
                    {t('rules.actionCards.drawTwo.desc')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Wild Cards */}
          <section>
            <SectionHeading>{t('rules.wildCards.heading')}</SectionHeading>

            <div className="space-y-3">
              {/* Wild */}
              <div className="flex items-start gap-3">
                <CardImg name="wild.png" />
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white/90">
                    {t('rules.wildCards.wild.name')}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/60">
                    {t('rules.wildCards.wild.desc')}
                  </p>
                </div>
              </div>

              {/* Wild Draw Four */}
              <div className="flex items-start gap-3">
                <CardImg name="drawFour.png" />
                <div className="pt-1">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-white/90">
                    {t('rules.wildCards.drawFour.name')}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 dark:text-white/60">
                    {t('rules.wildCards.drawFour.desc')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* UNO Call */}
          <section>
            <SectionHeading>{t('rules.unoCall.heading')}</SectionHeading>
            <SectionBody>{t('rules.unoCall.body')}</SectionBody>
          </section>

          {/* Challenge */}
          <section>
            <SectionHeading>{t('rules.challenge.heading')}</SectionHeading>
            <SectionBody>{t('rules.challenge.body')}</SectionBody>
          </section>

          {/* Scoring */}
          <section>
            <SectionHeading>{t('rules.scoring.heading')}</SectionHeading>
            <SectionBody>{t('rules.scoring.body')}</SectionBody>
            <ul className="mt-2 space-y-1 text-xs text-neutral-500 dark:text-white/60">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-white/40" />
                {t('rules.scoring.numberPoints')}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-white/40" />
                {t('rules.scoring.actionPoints')}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-white/40" />
                {t('rules.scoring.wildPoints')}
              </li>
            </ul>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <CardImg name="yellow5.png" />
              <CardImg name="blueSkip.png" />
              <CardImg name="wild.png" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-neutral-200 px-5 py-3 dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full cursor-pointer rounded-lg border border-neutral-300 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/50"
          >
            {t('rules.close')}
          </button>
        </div>
      </animated.div>
    </>
  );
};
