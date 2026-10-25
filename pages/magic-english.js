import {magicEnglishHTML} from '../lib/magicEnglishPage.cjs';
export default function MagicEnglish(){return null;}
export async function getServerSideProps({res}){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(magicEnglishHTML());return {props:{}};}
