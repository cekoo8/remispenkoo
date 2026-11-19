// Server multiplayer Grow a Garden 3D (maks 6 pemain). Jalankan: npm install && npm start
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,MAX=6,RESTOCK=120000;
const RAR={wortel:'common',stroberi:'common',tomat:'common',jagung:'common',bawang:'common',semangka:'rare',labu:'rare',jamur:'cool',sakura:'cool',naga:'secret'};
const LIM={common:6,rare:3,cool:2,secret:1},CH={common:1,rare:.8,cool:.5,secret:.3};
const mk=()=>{const stock={};for(const k in RAR){const r=RAR[k];stock[k]=Math.random()<CH[r]?LIM[r]:-1}return{stock,c:Date.now()}};
let st=mk(),nextAt=Date.now()+RESTOCK;
const stMsg=()=>({t:'st',stock:st.stock,c:st.c,in:Math.max(0,nextAt-Date.now())});
const srv=http.createServer((q,r)=>{
  fs.readFile(path.join(__dirname,'Grow_a_Garden_3D.html'),(e,d)=>{
    if(e){r.writeHead(500);return r.end('Grow_a_Garden_3D.html tidak ditemukan di folder yang sama')}
    r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(d)})});
const wss=new WebSocketServer({server:srv,maxPayload:65536});
const slots=Array(MAX).fill(null);
const bc=(o,ex)=>{const s=JSON.stringify(o);wss.clients.forEach(c=>{if(c!==ex&&c.readyState===1)c.send(s)})};
setInterval(()=>{st=mk();nextAt=Date.now()+RESTOCK;bc({...stMsg(),new:1})},RESTOCK);
wss.on('connection',(ws,req)=>{
  const i=slots.indexOf(null);
  if(i<0){ws.send(JSON.stringify({t:'full'}));return ws.close()}
  const n=(new URL(req.url,'http://x').searchParams.get('n')||'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,12)||'Petani';
  const me={id:Math.random().toString(36).slice(2,8),slot:i,n,x:0,z:0,r:0,pl:[]};
  slots[i]=me;
  ws.send(JSON.stringify({t:'init',id:me.id,slot:i,players:slots.filter(p=>p&&p!==me),st:stMsg()}));
  bc({t:'j',p:me},ws);
  ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch(e){return}
    if(m.t==='p'&&[m.x,m.z,m.r].every(Number.isFinite)){me.x=m.x;me.z=m.z;me.r=m.r;bc({t:'p',id:me.id,x:m.x,z:m.z,r:m.r},ws)}
    else if(m.t==='pl'&&Array.isArray(m.pl)&&m.pl.length<=80){me.pl=m.pl;bc({t:'pl',id:me.id,pl:m.pl},ws)}});
  ws.on('close',()=>{slots[i]=null;bc({t:'l',id:me.id})});
});
srv.listen(PORT,()=>console.log(`Server jalan di http://localhost:${PORT} (maks ${MAX} pemain). Teman di jaringan yang sama: http://<IP-komputer-ini>:${PORT}`));
