import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath: string) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  let newContent = content
    .replace(/bg-\[#0A0A0A\]/g, 'bg-[#121214]')
    .replace(/from-\[#0A0A0A\]/g, 'from-[#121214]')
    .replace(/via-\[#0A0A0A\]/g, 'via-[#121214]')
    .replace(/to-\[#0A0A0A\]/g, 'to-[#121214]')
    .replace(/bg-\[#0F0F0F\]/g, 'bg-[#18181B]')
    .replace(/bg-\[#1A1A1A\]/g, 'bg-[#27272A]')
    .replace(/bg-black/g, 'bg-[#09090B]')
    .replace(/hover:bg-black/g, 'hover:bg-[#09090B]')
    .replace(/text-black/g, 'text-[#09090B]')
    .replace(/hover:text-black/g, 'hover:text-[#09090B]')
    .replace(/border-black/g, 'border-[#09090B]')
    .replace(/fill="#0a0a0a"/g, 'fill="#121214"');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Updated ' + filePath);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
// Also process public if needed, wait, public is not matched here.
