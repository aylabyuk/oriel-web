import { Shape, ShapeGeometry, ExtrudeGeometry } from 'three';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_DEPTH,
  CARD_RADIUS,
} from '@/constants/cardGeometry';

export { FACE_OFFSET } from '@/constants/cardGeometry';

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

export const faceGeo = (() => {
  const geo = new ShapeGeometry(cardShape);
  const uvAttr = geo.attributes.uv;
  const posAttr = geo.attributes.position;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(
      i,
      (posAttr.getX(i) + CARD_WIDTH / 2) / CARD_WIDTH,
      (posAttr.getY(i) + CARD_HEIGHT / 2) / CARD_HEIGHT,
    );
  }
  uvAttr.needsUpdate = true;
  return geo;
})();
