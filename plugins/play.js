// app/plugins/play.js (ESM)
import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

async function getFfmpegBin() {
  // Try ffmpeg-static first (best on Heroku)
  try {
    const mod = await import("ffmpeg-static");
    const ffmpegPath = mod.default || mod;
    if (ffmpegPath) return ffmpegPath;
  } catch (_) {
    // ignore
  }
  // Fallback to system ffmpeg if available (if you use buildpack)
  return "ffmpeg";
}

async function downloadToFile(url, outPath) {
  const res = await axios.get(url, {
    responseType: "stream",
    timeout: 60000,
    maxRedirects: 5,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(outPath);
    res.data.pipe(w);
    w.on("finish", resolve);
    w.on("error", reject);
  });
}

async function convertToOpus(inputPath, outputPath) {
  const ffmpegBin = await getFfmpegBin();

  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i", inputPath,
      "-vn",
      "-ac", "1",
      "-ar", "48000",
      "-b:a", "128k",
      "-c:a", "libopus",
      outputPath,
    ];

    const ff = spawn(ffmpegBin, args);
    let err = "";

    ff.stderr.on("data", (d) => (err += d.toString()));
    ff.on("error", (e) => reject(e));
    ff.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error("ffmpeg failed: " + err.slice(-2000)));
    });
  });
}

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase()
    : "";

  const args = body.startsWith(prefix)
    ? body.slice(prefix.length).trim().split(/\s+/).slice(1)
    : [];

  if (cmd !== "play") return;

  let inputFile, outputFile;

  try {
    if (!args.length) return m.reply("*Example:* .play shape of you");

    const query = args.join(" ");
    await m.reply(`🔍 *Searching:* ${query}`);

    const search = await yts(query);
    const video = search?.videos?.[0];
    if (!video) return m.reply("❌ *No song found*");

    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    await m.reply(`🎧 *Processing:* ${video.title}`);

    const apiUrl = `https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(youtubeUrl)}`;
    const apiRes = await axios.get(apiUrl, { timeout: 30000 });

    if (!apiRes.data?.status || !apiRes.data?.result) {
      return m.reply("❌ *Audio API failed*");
    }

    const audioUrl = apiRes.data.result;
    if (typeof audioUrl !== "string" || !audioUrl.startsWith("http")) {
      return m.reply("❌ *Invalid audio URL*");
    }

    const tmp = os.tmpdir();
    const id = Date.now();
    inputFile = path.join(tmp, `play_${id}.input`);
    outputFile = path.join(tmp, `play_${id}.ogg`);

    await downloadToFile(audioUrl, inputFile);
    await convertToOpus(inputFile, outputFile);

    const size = fs.statSync(outputFile).size;
    if (size > 18 * 1024 * 1024) {
      return m.reply("❌ *Audio too large. Try a shorter song*");
    }

    // 🎙️ send as voice note
    await gss.sendMessage(
      m.from,
      {
        audio: fs.readFileSync(outputFile),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      },
      { quoted: m }
    );

    await m.reply(`🎙️ *Voice note sent:* ${video.title}`);
  } catch (err) {
    console.error("PLAY ERROR:", err?.response?.data || err);

    // Give a helpful message when ffmpeg is missing
    const msg = String(err?.message || "");
    if (msg.includes("spawn ffmpeg") || msg.includes("ENOENT")) {
      return m.reply(
        "❌ *ffmpeg not found.* Install `ffmpeg-static` in dependencies OR add an ffmpeg buildpack."
      );
    }

    return m.reply("❌ *Failed to send audio*");
  } finally {
    try { if (inputFile && fs.existsSync(inputFile)) fs.unlinkSync(inputFile); } catch {}
    try { if (outputFile && fs.existsSync(outputFile)) fs.unlinkSync(outputFile); } catch {}
  }
};

export default play;
