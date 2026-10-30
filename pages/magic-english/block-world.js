import {getUser} from '../../lib/stateManager';
// The original Minecraft implementation remains in magic-english/block-world/ as archived source.
export default function RetiredBlockWorld(){return null;}
export async function getServerSideProps({res,query}){
 res.setHeader('Cache-Control','no-store');
 const id=typeof query.user==='string'?query.user:'';
 const user=/^[A-Za-z0-9]{4,10}$/.test(id)?await getUser(id):null;
 return {redirect:{destination:user?`/${encodeURIComponent(user.id)}/magic-english`:'/magic-english',permanent:false}};
}
