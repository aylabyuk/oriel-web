import { DisclaimerModal } from '@/components/ui/DisclaimerModal';
import { DrawChoiceModal } from '@/components/ui/DrawChoiceModal';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { ChallengeModal } from '@/components/ui/ChallengeModal';
import { GameEndOverlay } from '@/components/ui/GameEndOverlay';
import { RestartConfirmModal } from '@/components/ui/RestartConfirmModal';
import { FreeLookExplainer } from '@/components/ui/FreeLookExplainer';
import { RulesModal } from '@/components/ui/RulesModal';
import type { GameEndInfo } from '@/types/game';
import type { Color } from 'uno-engine';

type GameModalsProps = {
  // Disclaimer
  disclaimerOpen: boolean;
  visitorName: string;
  onDisclaimerAck: () => void;
  // Draw choice
  drawChoiceOpen: boolean;
  onDrawPlay: () => void;
  onDrawSkip: () => void;
  // Wild color
  wildPickerOpen: boolean;
  onWildColorSelect: (color: Color) => void;
  onWildDismiss: () => void;
  // Challenge
  challengeOpen: boolean;
  blufferName: string;
  onChallengeAccept: () => void;
  onChallengeIssue: () => void;
  // Game end
  gameEnded: boolean;
  endInfo: GameEndInfo | null;
  isVisitorWinner: boolean;
  onPlayAgain: () => void;
  // Restart confirm
  restartConfirmOpen: boolean;
  onRestartConfirm: () => void;
  onRestartCancel: () => void;
  // Free look explainer
  freeLookExplainerOpen: boolean;
  onFreeLookExplainerDismiss: () => void;
  // Rules
  rulesOpen: boolean;
  onRulesClose: () => void;
};

export const GameModals = ({
  disclaimerOpen,
  visitorName,
  onDisclaimerAck,
  drawChoiceOpen,
  onDrawPlay,
  onDrawSkip,
  wildPickerOpen,
  onWildColorSelect,
  onWildDismiss,
  challengeOpen,
  blufferName,
  onChallengeAccept,
  onChallengeIssue,
  gameEnded,
  endInfo,
  isVisitorWinner,
  onPlayAgain,
  restartConfirmOpen,
  onRestartConfirm,
  onRestartCancel,
  freeLookExplainerOpen,
  onFreeLookExplainerDismiss,
  rulesOpen,
  onRulesClose,
}: GameModalsProps) => (
  <>
    <DisclaimerModal
      open={disclaimerOpen}
      visitorName={visitorName}
      onAcknowledge={onDisclaimerAck}
    />
    <DrawChoiceModal
      open={drawChoiceOpen}
      onPlay={onDrawPlay}
      onSkip={onDrawSkip}
    />
    <WildColorPicker
      open={wildPickerOpen}
      onColorSelect={onWildColorSelect}
      onDismiss={onWildDismiss}
    />
    <ChallengeModal
      open={challengeOpen}
      blufferName={blufferName}
      onAccept={onChallengeAccept}
      onChallenge={onChallengeIssue}
    />
    <GameEndOverlay
      open={gameEnded}
      endInfo={endInfo}
      isVisitorWinner={isVisitorWinner}
      onPlayAgain={onPlayAgain}
    />
    <RestartConfirmModal
      open={restartConfirmOpen}
      onConfirm={onRestartConfirm}
      onCancel={onRestartCancel}
    />
    <FreeLookExplainer
      open={freeLookExplainerOpen}
      onDismiss={onFreeLookExplainerDismiss}
    />
    <RulesModal open={rulesOpen} onClose={onRulesClose} />
  </>
);
