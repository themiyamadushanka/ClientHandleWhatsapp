import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ytsearch from 'yt-search';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cross-platform: use local .exe on Windows, or system yt-dlp on Linux (hosting)
function getYtdlpCommand() {
    if (platform() === 'win32') {
        const localExe = path.join(__dirname, 'yt-dlp.exe');
        if (fs.existsSync(localExe)) return `"${localExe}"`;
    }
    return 'yt-dlp'; // Use system-installed yt-dlp on Linux/hosting
}

export async function YoutubeDownloader(sock, jid, promt) {
    const query = promt.trim();
    if (!query) throw new Error("empty query");

    // Search for the video
    const result = await ytsearch(query);
    const video = result.videos[0];
    if (!video) {
        throw new Error('No video found.');
    }

    const videoUrl = video.url;
    const cleanTitle = video.title.replace(/[^\w\s]/gi, '').trim();
    const tempFilePath = path.join(__dirname, `${cleanTitle || 'audio'}.mp3`);

    // Download audio using yt-dlp
    const ytdlp = getYtdlpCommand();
    await new Promise((resolve, reject) => {
        const cmd = `${ytdlp} -x --audio-format mp3 --audio-quality 128K -o "${tempFilePath}" "${videoUrl}"`;
        exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
            if (error) {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                reject(new Error(`yt-dlp failed: ${stderr || error.message}`));
            } else {
                resolve();
            }
        });
    });

    try {
        await sock.sendMessage(jid, {
            audio: { url: tempFilePath },
            mimetype: 'audio/mp4',
            fileName: `${video.title}.mp3`
        });
    } finally {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}