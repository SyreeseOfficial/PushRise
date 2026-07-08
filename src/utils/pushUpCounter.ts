type Point = {x: number; y: number};

function angleBetween(a: Point, b: Point, c: Point): number {
  const ab = {x: a.x - b.x, y: a.y - b.y};
  const cb = {x: c.x - b.x, y: c.y - b.y};
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))) * 180) / Math.PI;
}

const DOWN_ANGLE = 125; // user's bottom range is 90-120°, so 125 catches all of it
const UP_ANGLE = 150;   // user's top is 176°, 150 gives clean 25° hysteresis gap

export type RepPhase = 'up' | 'down';

export function detectRepPhase(
  data: Record<string, {x: number; y: number}>,
  currentPhase: RepPhase,
): {phase: RepPhase; angle: number} {
  const ls = data.leftShoulderPosition;
  const le = data.leftElbowPosition;
  const lw = data.leftWristPosition;
  const rs = data.rightShoulderPosition;
  const re = data.rightElbowPosition;
  const rw = data.rightWristPosition;

  let angle = 180;

  if (ls && le && lw && rs && re && rw) {
    angle = (angleBetween(ls, le, lw) + angleBetween(rs, re, rw)) / 2;
  } else if (ls && le && lw) {
    angle = angleBetween(ls, le, lw);
  } else if (rs && re && rw) {
    angle = angleBetween(rs, re, rw);
  } else {
    return {phase: currentPhase, angle: 180};
  }

  if (angle < DOWN_ANGLE) return {phase: 'down', angle};
  if (angle > UP_ANGLE) return {phase: 'up', angle};
  return {phase: currentPhase, angle};
}
