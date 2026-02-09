import { Card3D } from '@/components/three/Card3D';
import type { Value, Color } from 'uno-engine';
import type { CardPlacement } from '@/utils/zoneLayout';

type VisibleCardProps = {
  cardId: string;
  value: Value;
  color: Color | undefined;
  to: CardPlacement;
};

export const VisibleCard = ({
  value,
  color,
  to,
}: VisibleCardProps) => (
  <group position={to.position} rotation={to.rotation}>
    <Card3D value={value} color={color} faceUp={to.faceUp} />
  </group>
);
