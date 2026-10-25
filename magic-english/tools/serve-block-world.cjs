const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createRewardApi}=require('./block-reward-api.cjs');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
function createBlockServer(options={}){
 const dataDir=path.resolve(options.dataDir||process.env.BLOCK_REWARD_DATA_DIR||path.join(root,'.block-world-data')),api=createRewardApi({dataDir,apiKey:options.apiKey??process.env.BLOCK_REWARD_API_KEY??''});
 return http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');if(await api(req,res,url))return;const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/block-world/'+url.search});res.end();return;}
  const fileParts=pathname.split('/');let file=path.resolve(root,'.'+pathname);if(fileParts.some(part=>part.startsWith('.'))||!file.startsWith(root+path.sep)||file===dataDir||file.startsWith(dataDir+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'+url.search});res.end();return;}file=path.join(file,'index.html');}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
 }catch{if(!res.headersSent)res.writeHead(400);res.end('Bad request');}});
}
if(require.main===module){const port=Number(process.env.PORT||4175);createBlockServer().listen(port,'127.0.0.1',()=>console.log(`블록 숲: http://localhost:${port}/block-world/\n보상 API: /api/block-world/rewards (POST에는 BLOCK_REWARD_API_KEY 필요)`));}
module.exports={createBlockServer};
