const fs = require('fs');
const path = require('path');
const http = require('http');
const PORT = Number(process.env.PORT || 5000);
const clientDir = path.resolve(__dirname, '../../client');

function mime(file){
  const ext = path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[ext]) || 'application/octet-stream';
}

function send(res,status,type,body){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);}

function handler(req,res){
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if(url.pathname === '/api/health') return send(res,200,'application/json; charset=utf-8',JSON.stringify({ok:true,service:'KIRA preview',port:PORT}));
  let pathname = decodeURIComponent(url.pathname);
  if(pathname === '/') pathname = '/index.html';
  const target = path.normalize(path.join(clientDir, pathname));
  if(!target.startsWith(clientDir)) return send(res,403,'text/plain; charset=utf-8','Forbidden');
  fs.readFile(target,(err,data)=>{
    if(err){
      if(path.extname(pathname)==='') return fs.readFile(path.join(clientDir,'index.html'),(e,d)=>e?send(res,500,'text/plain; charset=utf-8',e.message):send(res,200,mime('index.html'),d));
      return send(res,404,'text/plain; charset=utf-8','Not found');
    }
    send(res,200,mime(target),data);
  });
}

// Express is optional for this local preview. If installed, the same routes are exposed through Express.
try {
  const express = require('express');
  const app = express();
  app.get('/api/health',(req,res)=>res.json({ok:true,service:'KIRA preview',port:PORT}));
  app.use(express.static(clientDir));
  app.get('*',(req,res)=>res.sendFile(path.join(clientDir,'index.html')));
  app.listen(PORT,()=>console.log(`KIRA preview (Express) listening on http://localhost:${PORT}`));
} catch (e) {
  http.createServer(handler).listen(PORT,()=>console.log(`KIRA preview (native fallback) listening on http://localhost:${PORT}`));
}
