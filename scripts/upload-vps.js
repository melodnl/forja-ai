const { Client } = require('C:/Users/Pichau/AppData/Local/Temp/node_modules/ssh2');
const fs = require('fs');

const LOCAL_BASE = 'c:/Users/Pichau/Downloads/projeto/Forjaai/forja-ai';
const REMOTE_BASE = '/root/forja-ai';

const filesToUpload = [
  'src/components/canvas/ForgeCanvas.tsx',
  'src/components/canvas/nodes/NodeWrapper.tsx',
  'src/components/canvas/nodes/CreativeNode.tsx',
  'src/components/canvas/nodes/PromptNode.tsx',
  'src/components/canvas/nodes/AssistantNode.tsx',
  'src/components/canvas/nodes/VoiceNode.tsx',
  'src/components/canvas/nodes/CopyNode.tsx',
  'src/hooks/useGeneration.ts',
  'src/app/[locale]/(app)/library/page.tsx',
  'src/app/[locale]/(app)/dashboard/page.tsx',
  'src/store/canvas.store.ts',
  'src/lib/download.ts',
  'src/components/canvas/nodes/ImageNode.tsx',
  'src/components/canvas/nodes/VideoNode.tsx',
  'src/components/canvas/nodes/UpscaleNode.tsx',
  'src/components/canvas/nodes/RemoveBgNode.tsx',
  'src/components/canvas/nodes/UGCAvatarNode.tsx',
  'src/components/canvas/nodes/ReferenceNode.tsx',
  'src/components/canvas/nodes/MentionTextarea.tsx',
  'src/lib/mentions.ts',
  'src/types/nodes.ts',
  'src/hooks/useNodeConnections.ts',
  'src/components/canvas/NodePalette.tsx',
  'src/components/canvas/nodes/AvatarNode.tsx',
  'src/app/api/webhooks/kie/route.ts',
  'src/lib/storage/upload.ts',
  'src/components/layout/Sidebar.tsx',
  'src/app/api/generate/face-swap/route.ts',
  'src/lib/ai/providers/google.ts',
  'src/app/api/upload/route.ts',
  'src/app/api/jobs/[id]/route.ts',
];

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Uploading files...');
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    let uploaded = 0;
    filesToUpload.forEach(file => {
      const localPath = LOCAL_BASE + '/' + file;
      const remotePath = REMOTE_BASE + '/' + file;
      const content = fs.readFileSync(localPath);
      sftp.writeFile(remotePath, content, (writeErr) => {
        if (writeErr) console.error('Error: ' + file + ' - ' + writeErr.message);
        else console.log('OK: ' + file);
        uploaded++;
        if (uploaded === filesToUpload.length) {
          console.log('All files uploaded!');
          conn.end();
        }
      });
    });
  });
}).on('error', e => console.error('SSH Error:', e.message))
.connect({ host: '76.13.121.80', port: 22, username: 'root', password: 'H@r2Mdo9jnCnuNnX,h4r' });
