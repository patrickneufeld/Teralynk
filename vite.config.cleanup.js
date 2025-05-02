import { rm } from 'fs/promises';
import { join } from 'path';

async function cleanup() {
  try {
    await rm(join(process.cwd(), 'node_modules', '.vite'), { recursive: true, force: true });
    await rm(join(process.cwd(), '.vite'), { recursive: true, force: true });
    console.log('Cleaned up Vite cache');
  } catch (err) {
    console.error('Error cleaning up:', err);
  }
}

cleanup();
