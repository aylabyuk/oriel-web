import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { SEATS, SEAT_ORDER } from '@/constants';

const LERP_FACTOR = 0.03;

type CameraRigProps = {
  activeSeatIndex: number;
};

export const CameraRig = ({ activeSeatIndex }: CameraRigProps) => {
  const { camera } = useThree();
  const currentTarget = useRef(new Vector3(0, -0.5, 0));
  const goalTarget = useRef(new Vector3());

  const seatKey = SEAT_ORDER[activeSeatIndex] ?? 'south';
  const ct = SEATS[seatKey].cameraTarget;
  goalTarget.current.set(ct[0], ct[1], ct[2]);

  useFrame(() => {
    currentTarget.current.lerp(goalTarget.current, LERP_FACTOR);
    camera.lookAt(currentTarget.current);
  });

  return null;
};
