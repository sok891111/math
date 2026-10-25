export function dialogueAction({dialog,locked=false,modal=false,pending=false,settled=false,choices=false}){
 if(modal)return 'none';
 if(dialog){if(pending)return 'wait';if(choices)return 'choose';return dialog.type==='speak'&&!settled?'speak':'advance';}
 return locked?'none':'interact';
}
export function nextChoiceIndex(index,direction,length){if(!length)return -1;const step=['left','up'].includes(direction)?-1:1;return ((index<0?(step>0?-1:0):index)+step+length)%length;}
