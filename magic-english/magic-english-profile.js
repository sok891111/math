// Anonymous visits get their own browser profile, never the shared demo ledger.
export const GUEST_PROFILE_KEY='magic-english-guest-profile-v1';
export function magicEnglishProfile(id,storage=localStorage,uuid=()=>crypto.randomUUID()){
 if(typeof id==='string'&&id.trim())return id.trim();
 let profile=storage.getItem(GUEST_PROFILE_KEY);
 if(!/^magic-guest-[a-f0-9-]{36}$/.test(profile||'')){profile='magic-guest-'+uuid();storage.setItem(GUEST_PROFILE_KEY,profile);}
 return profile;
}
