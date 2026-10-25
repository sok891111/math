import {getUser} from '../../lib/stateManager';
import {magicEnglishHTML} from '../../lib/magicEnglishPage.cjs';
export default function UserMagicEnglish(){return null;}
export async function getServerSideProps({params,res}){if(!/^[A-Za-z0-9]{4,10}$/.test(params.userId))return {notFound:true};const user=await getUser(params.userId);if(!user)return {notFound:true};res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(magicEnglishHTML(false,user));return {props:{}};}
