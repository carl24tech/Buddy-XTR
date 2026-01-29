import axios from "axios";
import config from '../config.cjs';

const repo = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  if (["repo", "sc", "script", "info"].includes(cmd)) {
    const githubRepoURL = "https://github.com/XdTechPro/JAWAD-MD";

    try {
      // Extract username and repo name from the URL
      const urlMatch = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
      
      if (!urlMatch) {
        throw new Error("Invalid GitHub URL format.");
      }
      
      const [, username, repoName] = urlMatch;

      // Fetch repository details using GitHub API
      const response = await axios.get(
        `https://api.github.com/repos/${username}/${repoName}`,
        {
          headers: {
            'User-Agent': 'Buddy-XTR', // GitHub API requires a user-agent
            'Accept': 'application/vnd.github.v3+json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.status !== 200 || !response.data) {
        throw new Error("GitHub API request failed.");
      }

      const repoData = response.data;

      // Format the repository information
      const formattedInfo = `*BOT NAME:* ${repoData.name}\n\n*OWNER NAME:* ${repoData.owner.login}\n\n*STARS:* ${repoData.stargazers_count}\n\n*FORKS:* ${repoData.forks_count}\n\n*LANGUAGE:* ${repoData.language || "Not specified"}\n\n*CREATED:* ${new Date(repoData.created_at).toLocaleDateString()}\n\n*LAST UPDATED:* ${new Date(repoData.updated_at).toLocaleDateString()}\n\n*GITHUB LINK:* ${repoData.html_url}\n\n*DESCRIPTION:* ${repoData.description || "No description"}\n\n*Don't Forget To Star and Fork Repository*\n\n> *© Powered By JawadTechX 🖤*`;

      // Send image with repo info
      await gss.sendMessage(
        m.from,
        {
          image: { 
            url: "https://files.catbox.moe/juroe8.jpg" 
          },
          caption: formattedInfo,
          contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
              title: `${repoData.name} Repository`,
              body: `⭐ ${repoData.stargazers_count} Stars | 🍴 ${repoData.forks_count} Forks`,
              mediaType: 1,
              thumbnailUrl: repoData.owner.avatar_url,
              sourceUrl: repoData.html_url
            }
          }
        },
        { quoted: m }
      );

      // Optional: Send audio file
      try {
        await gss.sendMessage(
          m.from,
          {
            audio: { 
              url: "https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/menunew.m4a" 
            },
            mimetype: "audio/mp4",
            ptt: true,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 999,
              isForwarded: true
            }
          },
          { quoted: m }
        );
      } catch (audioError) {
        console.log("Audio file not sent:", audioError.message);
        // Continue without audio - it's optional
      }

    } catch (error) {
      console.error("Error in repo command:", error);
      
      // More specific error messages
      let errorMessage = "Sorry, something went wrong while fetching the repository information.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The GitHub API is taking too long to respond.";
      } else if (error.response?.status === 404) {
        errorMessage = "Repository not found. It may have been moved or deleted.";
      } else if (error.response?.status === 403) {
        errorMessage = "API rate limit exceeded. Please try again later.";
      } else if (error.message.includes("Invalid GitHub URL")) {
        errorMessage = "Invalid repository URL configured.";
      }
      
      await m.reply(errorMessage);
    }
  }
};

export default repo;