import {getUser} from '../../lib/stateManager';
import {magicEnglishHTML} from '../../lib/magicEnglishPage.cjs';
export default function MagicEnglishWorld(){return null;}
export async function getServerSideProps({res,query}){
 const id=typeof query.user==='string'?query.user:'';
 const sandbox=process.env.NODE_ENV==='development'&&/^stage[34]-test-[a-f0-9-]{36}$/.test(id);
 const user=id&&!sandbox?await getUser(id):null;
 if(id&&!user&&!sandbox)return {notFound:true};
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.end(magicEnglishHTML(true,user));return {props:{}};
}
