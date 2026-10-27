import {NextResponse} from 'next/server';
const games=new Set(['tralalerio','magic-english','platformer','island','creative','hanja']);
const valid=id=>/^[A-Za-z0-9]{4,10}$/.test(id||'');
export async function middleware(req){
 const path=req.nextUrl.pathname,parts=path.split('/').filter(Boolean);
 if(parts[0]==='admin'||parts[1]==='parent'||parts[1]==='paused'||parts[1]==='badges')return NextResponse.next();
 let child=null,personal=false,target=null;
 if(valid(parts[0])&&(parts.length===1||games.has(parts[1]))&&!games.has(parts[0])){child=parts[0];personal=true;}
 const world=parts[0]==='magic-english'&&parts[1]==='block-world';
 if(world&&valid(req.nextUrl.searchParams.get('user')))child=req.nextUrl.searchParams.get('user');
 const rawGame=games.has(parts[0])&&(parts.length===1||parts[1]==='index.html'||world&&(parts.length===2||parts[2]==='index.html'));
 const home=path==='/'||path==='/index.html';
 if(!child&&(rawGame||home))child=req.cookies.get('block_child')?.value;
 if(!valid(child))return NextResponse.next();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 let response;
 try{
  response=await fetch(new URL(`/api/user/${child}/access`,req.url),{cache:'no-store',signal:controller.signal});
  if(response.status===404)return NextResponse.next();
  if(!response.ok)throw Error('Access unavailable');
  const access=await response.json();if(access.blocked){const url=req.nextUrl.clone();url.pathname=`/${child}/paused`;url.search='';return NextResponse.redirect(url);}
 }catch{const url=req.nextUrl.clone();url.pathname=`/${child}/paused`;url.search='?reason=connection';return NextResponse.redirect(url);}finally{clearTimeout(timer);}
 // Familiar demo/static URLs on a child's device enter the same managed game.
 if(!personal&&(rawGame||home)){
  target=req.nextUrl.clone();
  if(world){target.pathname='/magic-english/block-world';target.searchParams.set('user',child);}
  else target.pathname=home?`/${child}`:`/${child}/${parts[0]}`;
 }
 const result=target?NextResponse.rewrite(target):NextResponse.next();
 result.headers.set('Cache-Control','no-store');result.cookies.set('block_child',child,{httpOnly:true,sameSite:'lax',path:'/',maxAge:31536000,secure:req.nextUrl.protocol==='https:'});return result;
}
export const config={matcher:['/((?!api/|_next/|favicon.ico|.*\\.(?:js|css|png|jpg|jpeg|svg|mp3|json|wav|woff|woff2)$).*)']};
