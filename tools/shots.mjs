import {chromium} from '/opt/npm-tools/node_modules/playwright/index.mjs';import http from 'http';import fs from 'fs';import path from 'path';
const root=process.cwd();const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,res)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});res.end(d)})}).listen(8766);
const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const pg=await b.newPage({viewport:{width:1400,height:1750}});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8766/tools/render.html');await pg.waitForFunction('window.ready',null,{timeout:120000});
for(const [name,c,yaw,pitch,dist,ty,fov,w,h,alpha] of JSON.parse(process.argv[2])){await pg.setViewportSize({width:w,height:h});await pg.evaluate(a=>window.shot(...a),[c,yaw,pitch,dist,ty,fov,w,h,alpha]);await pg.waitForTimeout(150);await pg.locator('#c').screenshot({path:`tools/out/${name}.png`,omitBackground:!!alpha});}
await b.close();srv.close();
