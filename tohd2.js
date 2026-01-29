import { createRequire } from 'module';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import { fileTypeFromBuffer } from 'file-type';

const require = createRequire(import.meta.url);
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

class ImgLarger {
    constructor() {
        this.baseURL = 'https://get1.imglarger.com/api/Upscaler';
        this.headers = {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://imgupscaler.com',
            'Referer': 'https://imgupscaler.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'X-Forwarded-For': Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.')
        };
        this.retryLimit = 3;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
        this.requestTimeout = 60000; // 60 seconds timeout
        this.statusCheckInterval = 3000; // Check every 3 seconds
        this.maxProcessingTime = 120000; // Max 2 minutes processing time
    }

    async validateImageBuffer(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer');
        }
        
        if (buffer.length === 0) {
            throw new Error('Image buffer is empty');
        }
        
        if (buffer.length > this.maxFileSize) {
            throw new Error(`Image size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
        }
        
        // Check if it's a valid image
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType || !fileType.mime.startsWith('image/')) {
            throw new Error('Invalid image format');
        }
        
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedMimes.includes(fileType.mime)) {
            throw new Error(`Unsupported image type. Supported: ${allowedMimes.join(', ')}`);
        }
        
        return fileType;
    }

    async uploadImage(input, scaleRadio = 2, isLogin = 0, progressCallback = null) {
        const fileType = await this.validateImageBuffer(input);
        
        const formData = new FormData();
        const filename = `uploaded_image.${fileType.ext}`;
        formData.append('myfile', input, { filename });
        formData.append('scaleRadio', scaleRadio);
        formData.append('isLogin', isLogin);

        try {
            const response = await axios.post(`${this.baseURL}/Upload`, formData, {
                headers: { 
                    ...this.headers, 
                    ...formData.getHeaders() 
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: this.requestTimeout,
                onUploadProgress: progressEvent => {
                    if (progressCallback && progressEvent.total) {
                        const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        progressCallback(percentage, 'upload');
                    }
                }
            });

            if (response.data.code === 999) {
                throw new Error('API limit exceeded. Please try again later.');
            }
            
            if (!response.data || !response.data.data || !response.data.data.code) {
                throw new Error('Invalid response from upload server');
            }

            return response.data;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Upload timeout. Please try again.');
            } else if (error.response) {
                switch (error.response.status) {
                    case 413:
                        throw new Error('Image too large for processing');
                    case 429:
                        throw new Error('Too many requests. Please wait before trying again.');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('Server is temporarily unavailable. Please try again later.');
                    default:
                        throw new Error(`Upload failed (Status: ${error.response.status})`);
                }
            }
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    async checkStatus(code, scaleRadio, isLogin) {
        const payload = { code, scaleRadio, isLogin };
        
        try {
            const response = await axios.post(`${this.baseURL}/CheckStatus`, payload, { 
                headers: this.headers,
                timeout: 10000
            });
            
            if (!response.data || typeof response.data.data === 'undefined') {
                throw new Error('Invalid status response');
            }
            
            return response.data;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Status check timeout');
            }
            throw new Error(`Failed to check task status: ${error.message}`);
        }
    }

    async processImage(input, scaleRadio = 2, isLogin = 0, retries = 0, progressCallback = null) {
        try {
            const uploadResult = await this.uploadImage(input, scaleRadio, isLogin, progressCallback);
            const { data: { code } } = uploadResult;
            
            const startTime = Date.now();
            let lastProgressUpdate = 0;
            
            // Poll for status
            while (true) {
                const status = await this.checkStatus(code, scaleRadio, isLogin);
                
                // Update progress if callback provided
                if (progressCallback) {
                    const elapsed = Date.now() - startTime;
                    if (elapsed - lastProgressUpdate > 2000) { // Update every 2 seconds
                        lastProgressUpdate = elapsed;
                        const progress = Math.min(90, Math.round((elapsed / this.maxProcessingTime) * 90));
                        progressCallback(progress, 'processing');
                    }
                }
                
                // Check status
                if (status.data.status === 'success') {
                    if (progressCallback) progressCallback(100, 'complete');
                    return status;
                } else if (status.data.status === 'waiting') {
                    // Still processing
                    if (Date.now() - startTime > this.maxProcessingTime) {
                        throw new Error('Processing timeout. The server is taking too long.');
                    }
                    await this.delay(this.statusCheckInterval);
                } else if (status.data.status === 'error' || status.data.status === 'failed') {
                    throw new Error(status.data.message || 'Processing failed on server');
                } else {
                    // Unknown status, continue waiting
                    await this.delay(this.statusCheckInterval);
                }
            }
        } catch (error) {
            if (retries < this.retryLimit && !error.message.includes('timeout')) {
                if (progressCallback) progressCallback(0, 'retry');
                return await this.processImage(input, scaleRadio, isLogin, retries + 1, progressCallback);
            } else {
                throw new Error(`Process failed after ${retries + 1} attempts: ${error.message}`);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Cache to prevent duplicate processing
const processingCache = new Map();
const CACHE_TTL = 30000; // 30 seconds cache

const hd = async (m, gss) => {
    const prefixMatch = m.body.match(/^[\\/!#.]/);
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const body = m.body || '';
    
    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    const validCommands = ['hdr', 'hd', 'remini', 'enhance', 'upscale'];

    if (!validCommands.includes(cmd)) return;

    const quoted = m.quoted;
    const senderId = m.from;

    // Check if user has a request in progress
    if (processingCache.has(senderId)) {
        const lastRequest = processingCache.get(senderId);
        if (Date.now() - lastRequest < 10000) { // 10 second cooldown
            return m.reply(`Please wait before making another request. You can try again in ${Math.ceil((10000 - (Date.now() - lastRequest)) / 1000)} seconds.`);
        }
    }

    if (!quoted || quoted.mtype !== 'imageMessage') {
        return m.reply(`*Please reply to an image with* ${prefix}${cmd}\n\n_Supported formats: JPEG, PNG, WebP_\n_Max size: 10MB_`);
    }

    // Update cache
    processingCache.set(senderId, Date.now());
    
    try {
        const media = await quoted.download();
        
        // Send initial response
        await m.reply(`🔄 *Enhancing your image...*\n\nThis may take 30-60 seconds. Please wait...\n\n_Quality: 4x Upscale_\n_Format: HD Enhanced_`);
        
        const imgLarger = new ImgLarger();
        
        // Progress tracking
        let progressMessage = null;
        let lastProgress = 0;
        
        const progressCallback = async (percentage, stage) => {
            if (!progressMessage && percentage > 0) {
                progressMessage = await m.reply(`📤 *Uploading image...* ${percentage}%`);
            } else if (progressMessage && Math.abs(percentage - lastProgress) >= 10) {
                lastProgress = percentage;
                let stageText = '';
                switch(stage) {
                    case 'upload': stageText = 'Uploading'; break;
                    case 'processing': stageText = 'Processing'; break;
                    case 'complete': stageText = 'Complete'; break;
                    case 'retry': stageText = 'Retrying'; break;
                }
                await gss.updateMessage(progressMessage, `🔄 *Enhancing Image...*\n\n${stageText}: ${percentage}%\n\n_Please wait, this may take a moment..._`);
            }
        };
        
        const result = await imgLarger.processImage(media, 4, 0, 0, progressCallback);
        
        if (!result.data || !result.data.downloadUrls || !result.data.downloadUrls[0]) {
            throw new Error('No enhanced image URL received');
        }
        
        const enhancedImageUrl = result.data.downloadUrls[0];
        
        // Clean up progress message if exists
        if (progressMessage) {
            try {
                await gss.deleteMessage(progressMessage.key);
            } catch (e) {
                // Ignore delete errors
            }
        }
        
        // Send enhanced image with better caption
        const caption = `✅ *Image Enhanced Successfully!*\n\n👤 *For:* ${m.pushName || 'User'}\n🔍 *Quality:* 4x HD Upscale\n⚡ *Powered by:* Buddy-XTR\n\n_Download the enhanced image for best quality._`;
        
        await gss.sendMessage(m.from, { 
            image: { url: enhancedImageUrl }, 
            caption: caption
        }, { quoted: m });
        
    } catch (error) {
        console.error('HD Command Error:', error);
        
        let errorMessage = '❌ *Enhancement Failed*\n\n';
        
        if (error.message.includes('timeout')) {
            errorMessage += 'The operation timed out. The server might be busy.\n';
            errorMessage += 'Please try again in a few moments.';
        } else if (error.message.includes('limit exceeded')) {
            errorMessage += 'API limit reached for now.\n';
            errorMessage += 'Please try again after some time.';
        } else if (error.message.includes('too large')) {
            errorMessage += 'Image is too large (max 10MB).\n';
            errorMessage += 'Please try with a smaller image.';
        } else if (error.message.includes('Unsupported')) {
            errorMessage += 'Image format not supported.\n';
            errorMessage += 'Please use JPEG, PNG, or WebP format.';
        } else {
            errorMessage += `Error: ${error.message}\n`;
            errorMessage += 'Please try again later.';
        }
        
        m.reply(errorMessage);
    } finally {
        // Clean up cache after reasonable time
        setTimeout(() => {
            processingCache.delete(senderId);
        }, 60000);
    }
};

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamp] of processingCache.entries()) {
        if (now - timestamp > CACHE_TTL) {
            processingCache.delete(userId);
        }
    }
}, 60000); // Clean every minute

export default hd;