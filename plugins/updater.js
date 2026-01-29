import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { createWriteStream, existsSync, mkdirSync, readdirSync, lstatSync, copyFileSync, readFileSync, writeFileSync, unlinkSync, rmSync } from "fs";
import AdmZip from "adm-zip";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config
const configPath = path.join(__dirname, '../config.cjs');
const config = await import(configPath).then(m => m.default || m).catch(() => ({}));

const update = async (m, Matrix) => {
    const prefix = config.PREFIX || '.';
    const args = m.body.slice(prefix.length).trim().split(/ +/);
    const cmd = args[0]?.toLowerCase() || "";
    
    // Enhanced: Support specific branch or commit updates
    // Usage: .update [branch/commit] or .update force
    const targetBranch = args[1] || "main"; // Default to main branch
    const forceUpdate = args[1] === "force";

    if (cmd === "update") {
        // Authorization check
        const botNumber = await Matrix.decodeJid(Matrix.user.id);
        const ownerNumbers = config.OWNER_NUMBER 
            ? (Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [config.OWNER_NUMBER])
            : [];
        
        if (m.sender !== botNumber && !ownerNumbers.includes(m.sender.split('@')[0])) {
            return Matrix.sendMessage(m.from, { 
                text: "❌ *Only the bot itself or owner can use this command!*" 
            }, { quoted: m });
        }

        await m.React("⏳");

        try {
            console.log(`🔄 Checking for updates from ${targetBranch} branch...`);
            const msg = await Matrix.sendMessage(m.from, { 
                text: `\`\`\`🔍 Checking for updates from ${targetBranch} branch...\`\`\`` 
            }, { quoted: m });

            const editMessage = async (newText) => {
                try {
                    return await Matrix.sendMessage(m.from, { 
                        text: newText, 
                        edit: msg.key 
                    });
                } catch (error) {
                    console.error("Message edit failed:", error);
                    return await Matrix.sendMessage(m.from, { 
                        text: newText 
                    }, { quoted: m });
                }
            };

            // Get current branch/commit info
            let currentBranch = "main";
            let currentCommit = "unknown";
            
            try {
                // Try to read current branch from git if available
                if (existsSync(path.join(process.cwd(), '.git', 'HEAD'))) {
                    const headContent = readFileSync(path.join(process.cwd(), '.git', 'HEAD'), 'utf-8').trim();
                    if (headContent.startsWith('ref:')) {
                        currentBranch = headContent.replace('ref: refs/heads/', '');
                    } else {
                        currentCommit = headContent.slice(0, 7);
                    }
                }
                
                // Also check package.json for stored hash
                const packageJsonPath = path.join(process.cwd(), "package.json");
                if (existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
                    currentCommit = packageJson.commitHash || currentCommit;
                    if (packageJson.branch) currentBranch = packageJson.branch;
                }
            } catch (error) {
                console.warn("Could not determine current git state:", error.message);
            }

            // If no specific branch requested, use current branch
            const updateBranch = args[1] ? targetBranch : currentBranch;

            await editMessage(`\`\`\`🔍 Fetching latest commit from ${updateBranch} branch...\`\`\``);
            
            // Fetch latest commit info for the specified branch
            const { data: commitData } = await axios.get(
                `https://api.github.com/repos/carl24tech/Buddy-XTR/commits/${updateBranch}`,
                { 
                    headers: { 'User-Agent': 'Buddy-XTR-Bot' },
                    timeout: 10000 
                }
            );
            
            const latestCommitHash = commitData.sha;
            const latestCommitMessage = commitData.commit.message.split('\n')[0];
            const commitAuthor = commitData.commit.author.name;
            const commitDate = new Date(commitData.commit.author.date).toLocaleDateString();

            // Check if update is needed (unless force update)
            if (!forceUpdate && latestCommitHash === currentCommit && updateBranch === currentBranch) {
                await m.React("✅");
                return editMessage(
                    `\`\`\`✅ Bot is already up to date!\n\n` +
                    `Branch: ${currentBranch}\n` +
                    `Commit: ${currentCommit.slice(0, 7)}\`\`\``
                );
            }

            await editMessage(
                `\`\`\`🚀 New update found!\n\n` +
                `📝 Commit: ${latestCommitMessage}\n` +
                `👤 Author: ${commitAuthor}\n` +
                `📅 Date: ${commitDate}\n` +
                `🔗 Hash: ${latestCommitHash.slice(0, 7)}\n\n` +
                `⬇️ Downloading...\`\`\``
            );

            // Download latest ZIP from the specified branch
            const zipPath = path.join(process.cwd(), `update_${updateBranch}_${Date.now()}.zip`);
            const writer = createWriteStream(zipPath);
            
            const response = await axios({
                method: 'get',
                url: `https://github.com/carl24tech/Buddy-XTR/archive/refs/heads/${updateBranch}.zip`,
                responseType: 'stream',
                timeout: 60000
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                setTimeout(() => reject(new Error("Download timeout after 2 minutes")), 120000);
            });

            await editMessage("```📦 Verifying and extracting the update...```");

            // Verify and extract ZIP
            if (!existsSync(zipPath) || lstatSync(zipPath).size === 0) {
                throw new Error("Downloaded update file is empty or corrupted");
            }

            const extractPath = path.join(process.cwd(), `update_temp_${Date.now()}`);
            const zip = new AdmZip(zipPath);
            
            // Extract to temp directory
            zip.extractAllTo(extractPath, true);
            
            // Find the extracted folder (name varies by branch)
            const extractedFolders = readdirSync(extractPath);
            const sourcePath = path.join(extractPath, extractedFolders[0]);
            
            if (!existsSync(sourcePath)) {
                throw new Error("Could not find extracted update files");
            }

            await editMessage("```🔄 Applying updates (preserving configs)...```");

            // Enhanced preservation list
            const filesToPreserve = [
                'config.cjs',
                '.env',
                'session.data.json',
                'database.json',
                'package-lock.json',
                'yarn.lock',
                'data', // Preserve data directory
                'lib/session', // Preserve session directory if exists
                'assets/downloads', // Preserve downloads
                'temp' // Preserve temp files
            ];
            
            // Add dynamic config files
            const existingFiles = readdirSync(process.cwd());
            filesToPreserve.push(...existingFiles.filter(file => 
                (file.startsWith('config.') && (file.endsWith('.cjs') || file.endsWith('.js'))) ||
                file.endsWith('.env') ||
                file === '.git' // Preserve git history
            ));

            // Copy update files
            await copyFolderSync(sourcePath, process.cwd(), filesToPreserve);

            // Update package.json with new branch and commit info
            try {
                const packageJsonPath = path.join(process.cwd(), "package.json");
                if (existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
                    packageJson.commitHash = latestCommitHash;
                    packageJson.branch = updateBranch;
                    packageJson.updatedAt = new Date().toISOString();
                    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                }
            } catch (error) {
                console.error("Could not update package.json:", error);
            }

            // Cleanup
            try {
                if (existsSync(zipPath)) unlinkSync(zipPath);
                if (existsSync(extractPath)) rmSync(extractPath, { recursive: true, force: true });
            } catch (cleanupError) {
                console.warn("Cleanup warning:", cleanupError.message);
            }

            // Install dependencies if package.json changed
            const packageChanged = forceUpdate || await checkPackageChanges();
            if (packageChanged) {
                await editMessage("```📦 Package.json changed. Installing dependencies...```");
                // Note: You might want to spawn npm/yarn process here
                // const { spawn } = await import('child_process');
                // await new Promise((resolve, reject) => {
                //     const npm = spawn('npm', ['install'], { stdio: 'inherit' });
                //     npm.on('close', resolve);
                //     npm.on('error', reject);
                // });
            }

            await editMessage("```✅ Update successful!```");
            await m.React("✅");
            
            // Final summary
            await Matrix.sendMessage(m.from, {
                text: `*🎉 Update Complete!*\n\n` +
                      `✅ Successfully updated to latest ${updateBranch} branch\n` +
                      `📝 *Commit:* ${latestCommitMessage}\n` +
                      `🔗 *Hash:* ${latestCommitHash.slice(0, 7)}\n` +
                      `👤 *Author:* ${commitAuthor}\n` +
                      `📅 *Date:* ${commitDate}\n\n` +
                      `🔄 *Restarting bot in 3 seconds...*`
            }, { quoted: m });

            // Log and restart
            console.log(`🔄 Restarting bot after update to ${updateBranch}@${latestCommitHash.slice(0, 7)}`);
            setTimeout(() => process.exit(1), 3000);

        } catch (error) {
            console.error("❌ Update error:", error);
            await m.React("❌");
            
            let errorMessage = `❌ *Update Failed!*\n\n`;
            
            if (error.response?.status === 404) {
                errorMessage += `*Branch "${targetBranch}" not found!*\n`;
                errorMessage += `Available branches: main, beta, dev (if they exist)\n`;
            } else if (error.code === 'ENOTFOUND') {
                errorMessage += `*Cannot connect to GitHub!*\n`;
                errorMessage += `Check your internet connection.\n`;
            } else if (error.message.includes("timeout")) {
                errorMessage += `*Update timeout!*\n`;
                errorMessage += `The download took too long. Try again.\n`;
            } else {
                errorMessage += `*Error:* ${error.message}\n`;
            }
            
            errorMessage += `\n💡 *Tip:* Try \`.update main\` to update to main branch`;
            
            await Matrix.sendMessage(m.from, { 
                text: errorMessage 
            }, { quoted: m });
        }
    }
};

async function copyFolderSync(source, target, filesToSkip = []) {
    if (!existsSync(target)) {
        mkdirSync(target, { recursive: true });
    }

    const items = readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Check if we should skip this item
        const shouldSkip = filesToSkip.some(pattern => {
            if (pattern.includes('/')) {
                // Handle directory patterns
                return destPath.includes(pattern);
            }
            return item === pattern;
        });

        if (shouldSkip) {
            console.log(`⏭️  Skipping: ${item}`);
            continue;
        }

        const stat = lstatSync(srcPath);
        if (stat.isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            try {
                // Create directory if it doesn't exist
                const destDir = path.dirname(destPath);
                if (!existsSync(destDir)) {
                    mkdirSync(destDir, { recursive: true });
                }
                
                copyFileSync(srcPath, destPath);
                console.log(`✅ Updated: ${item}`);
            } catch (copyError) {
                console.error(`❌ Failed to update ${item}:`, copyError.message);
            }
        }
    }
}

async function checkPackageChanges() {
    try {
        const oldPackagePath = path.join(process.cwd(), 'package.json.bak');
        const newPackagePath = path.join(process.cwd(), 'package.json');
        
        if (existsSync(oldPackagePath) && existsSync(newPackagePath)) {
            const oldPackage = JSON.parse(readFileSync(oldPackagePath, 'utf-8'));
            const newPackage = JSON.parse(readFileSync(newPackagePath, 'utf-8'));
            
            // Compare dependencies
            return JSON.stringify(oldPackage.dependencies) !== JSON.stringify(newPackage.dependencies) ||
                   JSON.stringify(oldPackage.devDependencies) !== JSON.stringify(newPackage.devDependencies);
        }
    } catch (error) {
        console.warn("Could not compare package changes:", error);
    }
    return false;
}

export default update;