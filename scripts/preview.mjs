import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from './build.mjs';
const base = path.join(root,'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    let file = path.resolve(base, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(base+path.sep) && file!==base) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    res.end(await readFile(file));
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(path.join(base,'404.html')));
  }
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
