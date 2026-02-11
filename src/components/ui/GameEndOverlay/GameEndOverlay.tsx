import { useSpring, useTrail, animated } from '@react-spring/web';
import type { GameEndInfo } from '@/types/game';
import { useTranslation } from '@/hooks/useTranslation';

type GameEndOverlayProps = {
  open: boolean;
  endInfo: GameEndInfo | null;
  isVisitorWinner: boolean;
  onPlayAgain: () => void;
};

export const GameEndOverlay = ({
  open,
  endInfo,
  isVisitorWinner,
  onPlayAgain,
}: GameEndOverlayProps) => {
  const springs = useSpring({
    opacity: open ? 1 : 0,
    scale: open ? 1 : 0.9,
    config: { tension: 200, friction: 22 },
  });

  const scoreSpring = useSpring({
    val: open ? (endInfo?.score ?? 0) : 0,
    delay: open ? 400 : 0,
    config: { tension: 40, friction: 14 },
  });

  const breakdownCount = endInfo?.breakdown.length ?? 0;
  const trail = useTrail(breakdownCount, {
    opacity: open ? 1 : 0,
    x: open ? 0 : 20,
    delay: open ? 700 : 0,
    config: { tension: 220, friction: 24 },
  });

  const { t } = useTranslation();

  if (!endInfo) return null;

  return (
    // @ts-expect-error animated.div children type mismatch with React 19
    <animated.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: springs.opacity,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* @ts-expect-error animated.div children type mismatch with React 19 */}
      <animated.div
        className="relative z-10 flex w-80 flex-col items-center gap-5 rounded-3xl bg-neutral-900/90 px-8 py-8 backdrop-blur-md"
        style={{ scale: springs.scale }}
      >
        <h2 className="text-2xl font-bold text-white">
          {isVisitorWinner
            ? t('game.youWin')
            : t('game.playerWins', { name: endInfo.winner })}
        </h2>

        <div className="flex flex-col items-center gap-1">
          {/* @ts-expect-error animated.span children type mismatch with React 19 */}
          <animated.span className="text-4xl font-extrabold text-amber-400 tabular-nums">
            {scoreSpring.val.to((v) => Math.floor(v))}
          </animated.span>
          <span className="text-xs font-medium tracking-wide text-white/50 uppercase">
            {t('game.points')}
          </span>
        </div>

        {breakdownCount > 0 && (
          <div className="w-full space-y-2">
            <span className="text-xs font-medium tracking-wide text-white/40 uppercase">
              {t('game.remainingCards')}
            </span>
            {trail.map((style, i) => {
              const player = endInfo.breakdown[i];
              return (
                // @ts-expect-error animated.div children type mismatch with React 19
                <animated.div
                  key={player.name}
                  className="flex items-center justify-between text-sm text-white/70"
                  style={{
                    opacity: style.opacity,
                    transform: style.x.to((x) => `translateX(${x}px)`),
                  }}
                >
                  <span>{player.name}</span>
                  <span className="tabular-nums">
                    {player.cardCount}{' '}
                    {player.cardCount === 1 ? t('game.card') : t('game.cards')}{' '}
                    &middot; {player.points} {t('game.pts')}
                  </span>
                </animated.div>
              );
            })}
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="mt-1 w-full cursor-pointer rounded-xl bg-white/90 px-6 py-2.5 text-sm font-semibold text-neutral-900 transition-transform hover:scale-105 focus:ring-2 focus:ring-white/50 focus:outline-none"
        >
          {t('game.playAgain')}
        </button>
      </animated.div>
    </animated.div>
  );
};
