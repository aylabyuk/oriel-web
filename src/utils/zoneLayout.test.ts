import { describe, it, expect } from 'vitest';
import { SEATS } from '@/constants/seats';
import { TABLE_SURFACE_Y } from '@/components/three/Table/Table';
import {
  getDeckPlacement,
  getDiscardPilePlacement,
  getDiscardFloatPlacement,
  getPlayerFrontPlacement,
  getPlayerHandPlacement,
  getHandPreviewPlacement,
} from './zoneLayout';

describe('zoneLayout', () => {
  describe('getDeckPlacement', () => {
    it('stacks cards upward by index', () => {
      const p0 = getDeckPlacement(0);
      const p5 = getDeckPlacement(5);
      expect(p5.position[1]).toBeGreaterThan(p0.position[1]);
    });

    it('returns faceUp=false', () => {
      expect(getDeckPlacement(0).faceUp).toBe(false);
    });

    it('returns deterministic rotation for same index', () => {
      const a = getDeckPlacement(3);
      const b = getDeckPlacement(3);
      expect(a.yaw).toEqual(b.yaw);
      expect(a.tilt).toEqual(b.tilt);
      expect(a.roll).toEqual(b.roll);
    });
  });

  describe('getDiscardPilePlacement', () => {
    it('returns faceUp=true', () => {
      expect(getDiscardPilePlacement(0).faceUp).toBe(true);
    });

    it('stacks cards upward by index', () => {
      const p0 = getDiscardPilePlacement(0);
      const p5 = getDiscardPilePlacement(5);
      expect(p5.position[1]).toBeGreaterThan(p0.position[1]);
    });

    it('has scatter — different indices produce different XZ', () => {
      const p0 = getDiscardPilePlacement(0);
      const p1 = getDiscardPilePlacement(1);
      const xzDiffers =
        p0.position[0] !== p1.position[0] || p0.position[2] !== p1.position[2];
      expect(xzDiffers).toBe(true);
    });
  });

  describe('getDiscardFloatPlacement', () => {
    it('is elevated above table surface', () => {
      const p = getDiscardFloatPlacement();
      expect(p.position[1]).toBeGreaterThan(TABLE_SURFACE_Y + 0.3);
    });

    it('returns faceUp=true', () => {
      expect(getDiscardFloatPlacement().faceUp).toBe(true);
    });
  });

  describe('getPlayerFrontPlacement', () => {
    it('returns faceUp=false', () => {
      expect(getPlayerFrontPlacement(0, SEATS.south).faceUp).toBe(false);
    });

    it('positions near seat (shorter pull than hand)', () => {
      const front = getPlayerFrontPlacement(0, SEATS.south);
      const hand = getPlayerHandPlacement(0, 1, SEATS.south);
      // Front should be closer to table center than hand
      const frontDist = Math.hypot(front.position[0], front.position[2]);
      const handDist = Math.hypot(hand.position[0], hand.position[2]);
      expect(frontDist).toBeLessThan(handDist);
    });

    it('stacks cards by index', () => {
      const p0 = getPlayerFrontPlacement(0, SEATS.west);
      const p3 = getPlayerFrontPlacement(3, SEATS.west);
      expect(p3.position[1]).toBeGreaterThan(p0.position[1]);
    });
  });

  describe('getPlayerHandPlacement', () => {
    it('returns faceUp=true', () => {
      expect(getPlayerHandPlacement(0, 5, SEATS.south).faceUp).toBe(true);
    });

    it('spreads cards along perpendicular axis', () => {
      const p0 = getPlayerHandPlacement(0, 5, SEATS.south);
      const p4 = getPlayerHandPlacement(4, 5, SEATS.south);
      // South seat: perpendicular is X axis
      expect(p0.position[0]).not.toBeCloseTo(p4.position[0], 2);
    });

    it('centers the spread around the seat', () => {
      const mid = getPlayerHandPlacement(2, 5, SEATS.south);
      const left = getPlayerHandPlacement(0, 5, SEATS.south);
      const right = getPlayerHandPlacement(4, 5, SEATS.south);
      // Middle card should be between left and right
      expect(mid.position[0]).toBeGreaterThan(
        Math.min(left.position[0], right.position[0]),
      );
      expect(mid.position[0]).toBeLessThan(
        Math.max(left.position[0], right.position[0]),
      );
    });
  });

  describe('getHandPreviewPlacement', () => {
    it('is elevated above the hand', () => {
      const preview = getHandPreviewPlacement(SEATS.south);
      const hand = getPlayerHandPlacement(0, 1, SEATS.south);
      expect(preview.position[1]).toBeGreaterThan(hand.position[1]);
    });

    it('returns faceUp=true', () => {
      expect(getHandPreviewPlacement(SEATS.south).faceUp).toBe(true);
    });
  });
});
