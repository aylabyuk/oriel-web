type AnimationTimelineProps = {
  stepIndex: number;
  totalSteps: number;
  playing: boolean;
  onSeek: (step: number) => void;
  onToggle: () => void;
  onReset: () => void;
};

export const AnimationTimeline = ({
  stepIndex,
  totalSteps,
  playing,
  onSeek,
  onToggle,
  onReset,
}: AnimationTimelineProps) => (
  <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-black/80 px-4 py-2 text-white">
    <button onClick={onReset} className="text-lg hover:opacity-70">
      {'|<'}
    </button>
    <button onClick={onToggle} className="text-lg hover:opacity-70">
      {playing ? '||' : '>'}
    </button>
    <input
      type="range"
      min={0}
      max={totalSteps - 1}
      value={stepIndex}
      onChange={(e) => onSeek(Number(e.target.value))}
      className="w-64 accent-white"
    />
    <span className="min-w-16 text-center font-mono text-sm">
      {stepIndex} / {totalSteps - 1}
    </span>
  </div>
);
