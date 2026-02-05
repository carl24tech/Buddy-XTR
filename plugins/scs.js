import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream, unlink, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

const streamPipeline = promisify(pipeline);

// Configuration
const BOT_REPO = 'https://github.com/carl24tech/Buddy-XTR/archive/refs/heads/main.zip';
const COMMANDS = ['sc', 'zip', 'script'];

const scriptDownload = async (m, bot) => {
  try {
    const prefixMatch = m.body.match(/^[\\/!#.]/);
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    
    if (!COMMANDS.includes(cmd)) return;

    // Create temp directory
    const tempDir = tmpdir();
    const timestamp = Date.now();
    const tempZipPath = join(tempDir, `bot_scripts_${timestamp}.zip`);
    const extractPath = join(tempDir, `bot_extracted_${timestamp}`);
    
    // Loading animation frames
    const loadingFrames = [
      '⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%',
      '⬛⬜⬜⬜⬜⬜⬜⬜⬜⬜ 10%',
      '⬛⬛⬜⬜⬜⬜⬜⬜⬜⬜ 20%',
      '⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜ 30%',
      '⬛⬛⬛⬛⬜⬜⬜⬜⬜⬜ 40%',
      '⬛⬛⬛⬛⬛⬜⬜⬜⬜⬜ 50%',
      '⬛⬛⬛⬛⬛⬛⬜⬜⬜⬜ 60%',
      '⬛⬛⬛⬛⬛⬛⬛⬜⬜⬜ 70%',
      '⬛⬛⬛⬛⬛⬛⬛⬛⬜⬜ 80%',
      '⬛⬛⬛⬛⬛⬛⬛⬛⬛⬜ 90%',
      '⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ 100%'
    ];
    
    const animatedFrames = [
      '🔄 *Downloading latest scripts...* ▰▱▱▱▱',
      '🔄 *Downloading latest scripts...* ▰▰▱▱▱',
      '🔄 *Downloading latest scripts...* ▰▰▰▱▱',
      '🔄 *Downloading latest scripts...* ▰▰▰▰▱',
      '🔄 *Downloading latest scripts...* ▰▰▰▰▰'
    ];
    
    const stages = [
      '📥 *Connecting to repository...*',
      '📥 *Downloading zip archive...*',
      '📂 *Extracting files...*',
      '✅ *Complete!*'
    ];
    
    let currentStage = 0;
    let currentFrame = 0;
    let loadingInterval;
    let messageId;
    
    // Send initial loading message
    const initialMessage = await bot.sendMessage(m.from, {
      text: `${stages[0]}\n\n${animatedFrames[0]}`
    }, { quoted: m });
    
    messageId = initialMessage.key?.id;
    
    // Update loading animation
    const updateLoading = async (text) => {
      try {
        await bot.sendMessage(m.from, { 
          text 
        }, { 
          quoted: m,
          edit: messageId 
        });
      } catch (error) {
        console.log('Error updating message:', error.message);
      }
    };
    
    // Start animation
    loadingInterval = setInterval(async () => {
      currentFrame = (currentFrame + 1) % animatedFrames.length;
      await updateLoading(`${stages[currentStage]}\n\n${animatedFrames[currentFrame]}`);
    }, 800);
    
    try {
      // Stage 1: Download zip
      currentStage = 1;
      await updateLoading(`${stages[currentStage]}\n\n${animatedFrames[0]}`);
      
      const response = await fetch(BOT_REPO, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      // Create write stream
      const writeStream = createWriteStream(tempZipPath);
      
      // Track download progress
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      let downloaded = 0;
      
      // Create a custom readable stream to track progress
      const reader = response.body.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        downloaded += value.length;
        
        // Update progress every ~100KB or so
        if (chunks.length % 10 === 0 && contentLength > 0) {
          const percent = Math.round((downloaded / contentLength) * 100);
          const progressBarIndex = Math.min(Math.floor(percent / 10), 10);
          const progressText = `📥 *Downloading:* ${loadingFrames[progressBarIndex]}\n📊 *Size:* ${(downloaded / 1024 / 1024).toFixed(2)}MB`;
          
          await updateLoading(`${stages[currentStage]}\n\n${progressText}`);
        }
      }
      
      // Combine chunks and write to file
      const buffer = Buffer.concat(chunks);
      await promisify(createWriteStream(tempZipPath).write.bind(createWriteStream(tempZipPath)))(buffer);
      
      clearInterval(loadingInterval);
      
      // Stage 2: Extract files
      currentStage = 2;
      await updateLoading(`${stages[currentStage]}\n\n${animatedFrames[0]}`);
      
      // Re-start animation for extraction
      let extractionFrame = 0;
      loadingInterval = setInterval(async () => {
        extractionFrame = (extractionFrame + 1) % animatedFrames.length;
        await updateLoading(`${stages[currentStage]}\n\n${animatedFrames[extractionFrame]}`);
      }, 500);
      
      const zip = new AdmZip(tempZipPath);
      const zipEntries = zip.getEntries();
      
      // Extract all files
      zip.extractAllTo(extractPath, true);
      
      clearInterval(loadingInterval);
      
      // Stage 3: Completion
      currentStage = 3;
      
      // Count files
      const countFiles = (dir) => {
        try {
          const files = readdirSync(dir, { withFileTypes: true });
          let count = 0;
          
          for (const file of files) {
            if (file.isDirectory()) {
              count += countFiles(join(dir, file.name));
            } else {
              count++;
            }
          }
          
          return count;
        } catch (error) {
          return 0;
        }
      };
      
      // Import fs promises for async operations
      import('fs/promises').then(async (fsPromises) => {
        const { readdir } = fsPromises;
        
        // Find the main extracted folder (usually repo-main)
        const extractedFolders = await readdir(extractPath);
        const mainFolder = extractedFolders.find(folder => folder.includes('-main') || folder.includes('-master')) || extractedFolders[0];
        
        if (mainFolder) {
          const folderPath = join(extractPath, mainFolder);
          const allFiles = await readdir(folderPath, { recursive: true });
          const jsFiles = allFiles.filter(file => file.endsWith('.js'));
          const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
          const otherFiles = allFiles.filter(file => !file.endsWith('.js') && !file.endsWith('.json'));
          
          const completionMessage = `✅ *Download Complete!*\n\n📁 *Repository:* ${BOT_REPO}\n📊 *Total Files:* ${allFiles.length}\n• JavaScript: ${jsFiles.length} files\n• JSON: ${jsonFiles.length} files\n• Others: ${otherFiles.length} files\n\n📍 *Extracted to:* ${folderPath}\n\n📝 *Downloaded at:* ${new Date().toLocaleString()}`;
          
          await updateLoading(completionMessage);
          
          // Send a few example files
          if (jsFiles.length > 0) {
            const exampleFiles = jsFiles.slice(0, 5).map((file, i) => `${i + 1}. ${file}`).join('\n');
            await bot.sendMessage(m.from, {
              text: `📄 *Example JavaScript Files:*\n${exampleFiles}\n\n${jsFiles.length > 5 ? `...and ${jsFiles.length - 5} more files` : ''}`
            }, { quoted: m });
          }
        } else {
          await updateLoading(`✅ *Download Complete!*\n\n📁 Files extracted to: ${extractPath}\n\n⚠️ Could not identify main project folder`);
        }
        
        // Cleanup temp files after 30 seconds
        setTimeout(async () => {
          try {
            await unlink(tempZipPath);
            // Clean up extracted directory
            const { rm } = await import('fs/promises');
            await rm(extractPath, { recursive: true, force: true });
          } catch (cleanupError) {
            console.log('Cleanup error:', cleanupError.message);
          }
        }, 30000);
      });
      
    } catch (error) {
      clearInterval(loadingInterval);
      console.error('Download error:', error);
      
      await updateLoading(`❌ *Download Failed!*\n\n⚠️ Error: ${error.message}\n\nPlease check:\n1. Repository URL\n2. Internet connection\n3. Repository accessibility`);
      
      // Cleanup on error
      try {
        await unlink(tempZipPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
  } catch (error) {
    console.error('Fatal error in scriptDownload:', error);
    await bot.sendMessage(m.from, {
      text: `❌ *Critical Error!*\n\n${error.message}\n\nPlease try again later.`
    }, { quoted: m });
  }
};

export default scriptDownload;
