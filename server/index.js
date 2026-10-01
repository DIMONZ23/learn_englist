import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = express();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy:false, crossOriginEmbedderPolicy:false }));
app.use(express.json({ limit:'64kb' }));
app.use('/api', apiRouter);

const publicFiles = new Map([
  ['/styles.css','styles.css'], ['/data.js','data.js'], ['/api-client.js','api-client.js'], ['/app.js','app.js']
]);
for (const [route,file] of publicFiles) app.get(route, (_req,res)=>res.sendFile(path.join(root,file)));
app.get('/', (_req,res)=>res.sendFile(path.join(root,'index.html')));
app.use((_req,res)=>res.status(404).json({error:{message:'Không tìm thấy tài nguyên.'}}));
app.use((error,_req,res,_next)=>{
  const status=error.status||error.statusCode||500;
  if(status>=500)console.error('[server]',error);
  res.status(status).json({error:{message:error.type==='entity.parse.failed'?'JSON gửi lên không hợp lệ.':'Máy chủ gặp lỗi. Vui lòng thử lại.'}});
});

const server = app.listen(config.port, () => console.log(`LingoFlow đang chạy tại http://localhost:${config.port}`));

async function shutdown(signal) {
  console.log(`\n${signal}: đang đóng kết nối...`);
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(()=>process.exit(1),10_000).unref();
}
process.on('SIGINT',()=>shutdown('SIGINT'));
process.on('SIGTERM',()=>shutdown('SIGTERM'));
