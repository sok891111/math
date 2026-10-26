// Stable casting shared by the browser player and the ElevenLabs server route.
const fena={voiceId:'BlgEcC0TfWpBak7FmvHW',voice:'Fena',effect:'none',settings:{speed:.8,stability:.8,similarity_boost:.8,style:.1,use_speaker_boost:true}};
const bill={voiceId:'pqHfZKP75CvOlQylNhV4',voice:'Bill',effect:'none',settings:{speed:.8,stability:.8,similarity_boost:.8,style:.1,use_speaker_boost:true}};
export const CHARACTER_VOICES=Object.freeze({
 mob_zombie:{...bill,effect:'villain',settings:{...bill.settings,speed:.75,stability:.85}},mob_creeper:{...fena,effect:'robot',settings:{...fena.settings,speed:.85,style:.2}},mob_pig:{...bill,settings:{...bill.settings,speed:.85,style:.4}},mob_chicken:{...fena,settings:{...fena.settings,speed:.95,style:.4}},
 daisy:fena,teacher:bill,tommy:fena,shadow:{...bill,effect:'villain'},
 staff:bill,traveler:bill,pilot:bill,guard:bill,cafe:fena,kid:fena,hwalbin:fena,gildong:fena,
 amy:{voiceId:'BlgEcC0TfWpBak7FmvHW',voice:'Fena',effect:'none',settings:{speed:.8,stability:.8,similarity_boost:.8,style:.1,use_speaker_boost:true}},
 ringo:{voiceId:'BlgEcC0TfWpBak7FmvHW',voice:'Fena',effect:'robot',settings:{speed:.85,stability:.9,similarity_boost:.8,style:0,use_speaker_boost:true}},
 misspell:{voiceId:'pqHfZKP75CvOlQylNhV4',voice:'Bill',effect:'villain',settings:{speed:.85,stability:.8,similarity_boost:.8,style:.6,use_speaker_boost:true}},
});
export function dialogueCharacter(speaker='',text=''){
 if(/데이지|Daisy/i.test(speaker))return 'daisy';
 if(/조리사/i.test(speaker))return 'staff';
 if(/배식 도우미/i.test(speaker))return 'cafe';
 if(/사일런트|Silent Shadow/i.test(speaker))return 'shadow';
 if(/릴리|Lily|도우미 친구|학교 친구|반 친구|등교하는 친구/i.test(speaker))return 'kid';
 if(/관리인|Custodian/i.test(speaker))return 'staff';
 if(/선생님|Teacher/i.test(speaker))return 'teacher';
 if(/토미|Tommy/i.test(speaker))return 'tommy';
 const prefix=String(text).match(/^\s*(링고|에이미|미스터 미스스펠|노노|웅얼이|따라쟁이)\s*[:：]/)?.[1]||String(speaker);
 if(/미스스펠|Misspell|노노|웅얼이|Nono|Ungeori/i.test(prefix))return 'misspell';
 if(/따라쟁이|Copycat/i.test(prefix))return 'kid';
 if(/링고|Ringo/i.test(prefix))return 'ringo';
 if(/에이미|Amy/i.test(prefix))return 'amy';
 if(/카페|Cafe/i.test(prefix))return 'cafe';
 if(/안내.*직원|기사|Information|Staff|Driver/i.test(prefix))return 'staff';
 if(/기장|파일럿|Pilot/i.test(prefix))return 'pilot';
 if(/심사관|Officer|Guard/i.test(prefix))return 'guard';
 if(/꼬마|아이|Little Kid|Student/i.test(prefix))return 'kid';
 if(/여행객|승객|Traveler|Commuter|Passenger/i.test(prefix))return 'traveler';
 if(/활빈|딩고|Hwalbin/i.test(prefix))return 'hwalbin';
 if(/길동|Gildong/i.test(prefix))return 'gildong';
 return 'amy';
}
export function clipCharacter(clip){
 const prefix=clip?.id?.split('_')[0];
 const aliases={ringo:'ringo',amy:'amy',misspell:'misspell',traveler:'traveler',pilot:'pilot',guard:'guard',cafe:'cafe',kid:'kid',hwalbin:'hwalbin',staff:'staff',gildong:'gildong'};
 return aliases[prefix]||(clip?.voice==='Bill'?'staff':'amy');
}
export function characterRequest(character,text){
 if(!Object.hasOwn(CHARACTER_VOICES,character))throw Error('지원하지 않는 배역입니다.');
 if(typeof text==='string')text=text.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,'...');
 if(typeof text!=='string'||!text.trim()||text.length>350||/[^\x20-\x7e\n]/.test(text))throw Error('영어 대사는 1~350자로 지정하세요.');
 const cast=CHARACTER_VOICES[character];return {character,text:text.trim(),voiceId:cast.voiceId,model_id:'eleven_multilingual_v2',voice_settings:{...cast.settings}};
}
