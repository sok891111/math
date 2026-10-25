export const CYCLE_SECONDS=360, NIGHT_START=.65;
export const normalizeTime=time=>((Number.isFinite(time)?time:.27)%1+1)%1;
export const isNight=time=>normalizeTime(time)>=NIGHT_START;
export function advanceTime(time,dt,enabled=true){return normalizeTime(normalizeTime(time)+(enabled?Math.max(0,dt)/CYCLE_SECONDS:0));}
export function daylight(time){const t=normalizeTime(time);if(t>=NIGHT_START)return .2;return .2+.8*Math.sin(t/NIGHT_START*Math.PI);}
export function skyAngle(time){const t=normalizeTime(time);return t<NIGHT_START?t/NIGHT_START*Math.PI:Math.PI+(t-NIGHT_START)/(1-NIGHT_START)*Math.PI;}
