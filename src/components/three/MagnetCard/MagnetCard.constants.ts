import { Shape, ExtrudeGeometry } from 'three';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_DEPTH,
  CARD_RADIUS,
} from '@/constants/cardGeometry';

export {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_DEPTH,
  FACE_OFFSET,
} from '@/constants/cardGeometry';

const createRoundedRectShape = (w: number, h: number, r: number) => {
  const shape = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

const cardShape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);

export const bodyGeo = new ExtrudeGeometry(cardShape, {
  depth: CARD_DEPTH,
  bevelEnabled: false,
});
bodyGeo.translate(0, 0, -CARD_DEPTH / 2);
