import fs from 'fs';
import path from 'path';
export default function PlatformerPage(){return null;}
export async function getServerSideProps({res}){
 const html=fs.readFileSync(path.join(process.cwd(),'public/platformer/index.html'),'utf8');
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');res.write(html);res.end();return {props:{}};
}
