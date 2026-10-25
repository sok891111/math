import {magicEnglishHTML} from '../../../lib/magicEnglishPage.cjs';
export default function Stage3Test(){return null;}
export async function getServerSideProps({res}){
 if(process.env.NODE_ENV!=='development')return {notFound:true};
 let html=magicEnglishHTML();
 html=html.replace('</head>','<script>window.__MAGIC_ENGLISH_TEST_STAGE3__=true;</script></head>');
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html);return {props:{}};
}
