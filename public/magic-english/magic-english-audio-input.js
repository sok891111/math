// Detect short spoken words using local windows rather than silence-diluted clip RMS.
export function prepareSpeechSamples(input,sampleRate){
 const windowSize=Math.max(1,Math.round(sampleRate*.03));let strongest=0,start=-1,end=0;
 for(let at=0;at<input.length;at+=windowSize){let energy=0;const stop=Math.min(input.length,at+windowSize);for(let i=at;i<stop;i++)energy+=input[i]*input[i];const rms=Math.sqrt(energy/Math.max(1,stop-at));strongest=Math.max(strongest,rms);if(rms>=.003){if(start<0)start=at;end=stop;}}
 if(start<0)return {samples:new Float32Array(input),rms:strongest};
 const pad=Math.round(sampleRate*.18),samples=input.slice(Math.max(0,start-pad),Math.min(input.length,end+pad));
 let peak=0;for(const value of samples)peak=Math.max(peak,Math.abs(value));const gain=peak>0?Math.min(4,.85/peak):1;
 for(let i=0;i<samples.length;i++)samples[i]*=gain;
 return {samples,rms:strongest};
}
