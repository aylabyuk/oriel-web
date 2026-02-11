export const PULL_DISTANCE = 1.2;
export const DEFAULT_COLOR = '#9b59b6';
export const TURN_DURATION_S = 10;

export const LABEL_CSS = `
@property --timer-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes timer-trace {
  to { --timer-angle: 360deg; }
}
@keyframes label-drop {
  0%   { opacity: 0; transform: translateY(-40px); }
  60%  { opacity: 1; transform: translateY(4px); }
  80%  { transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes toast-up {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.6); }
  12%  { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1.05); }
  20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }
}
@keyframes toast-down {
  0%   { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.6); }
  12%  { opacity: 1; transform: translateX(-50%) translateY(2px) scale(1.05); }
  20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
}
@keyframes dialogue-bubble {
  0%   { opacity: 0; transform: translateY(4px) scale(0.85); }
  10%  { opacity: 1; transform: translateY(-1px) scale(1.02); }
  18%  { opacity: 1; transform: translateY(0) scale(1); }
  82%  { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
}`;
