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

const DOWN_ANGLE = 90;
const UP_ANGLE = 155;

export type RepPhase = 'up' | 'down';

// data is the raw object from the ML Kit frame processor plugin
export function detectRepPhase(
  data: Record<string, {x: number; y: number}>,
  currentPhase: RepPhase,
): RepPhase {
  const ls = data.leftShoulderPosition;
  const le = data.leftElbowPosition;
  const lw = data.leftWristPosition;
  const rs = data.rightShoulderPosition;
  const re = data.rightElbowPosition;
  const rw = data.rightWristPosition;

  let angle = 180;

  if (ls && le && lw && rs && re && rw) {
    const leftAngle = angleBetween(ls, le, lw);
    const rightAngle = angleBetween(rs, re, rw);
    angle = (leftAngle + rightAngle) / 2;
  } else if (ls && le && lw) {
    angle = angleBetween(ls, le, lw);
  } else if (rs && re && rw) {
    angle = angleBetween(rs, re, rw);
  } else {
    return currentPhase;
  }

  if (angle < DOWN_ANGLE) return 'down';
  if (angle > UP_ANGLE) return 'up';
  return currentPhase;
}
