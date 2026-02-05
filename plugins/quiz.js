// app/plugins/quiz.js
import fs from 'fs';
import config from '../config.cjs';

let quizData = [];
let activeQuizzes = new Map(); // Store active quizzes by chat ID

// Load quiz questions
try {
  const quizModule = await import('../william/quiz.js');
  quizData = Array.isArray(quizModule.default) ? quizModule.default : [];
} catch (error) {
  console.error('Failed to load quiz data:', error);
}

const quiz = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  
  if (cmd !== 'quiz') return;
  
  // Check if there's already an active quiz in this chat
  const chatId = m.from;
  if (activeQuizzes.has(chatId)) {
    try {
      await Matrix.sendMessage(chatId, {
        text: "⏳ There's already an active quiz in this chat! Please wait for it to finish before starting a new one."
      }, { quoted: m });
    } catch (error) {
      console.error('Quiz error:', error);
    }
    return;
  }
  
  // If no quiz questions are loaded
  if (quizData.length === 0) {
    try {
      await Matrix.sendMessage(chatId, {
        text: "❌ Quiz questions are not available at the moment. Please contact the bot administrator."
      }, { quoted: m });
    } catch (error) {
      console.error('Quiz error:', error);
    }
    return;
  }
  
  // Select a random question
  const randomQuestion = quizData[Math.floor(Math.random() * quizData.length)];
  
  // Validate the question structure
  if (!randomQuestion || !randomQuestion.question || !randomQuestion.answer) {
    try {
      await Matrix.sendMessage(chatId, {
        text: "❌ Invalid quiz question format. Please check the quiz data file."
      }, { quoted: m });
    } catch (error) {
      console.error('Quiz error:', error);
    }
    return;
  }
  
  const questionText = randomQuestion.question;
  const correctAnswer = randomQuestion.answer;
  
  // Store active quiz
  activeQuizzes.set(chatId, {
    question: questionText,
    answer: correctAnswer,
    startTime: Date.now(),
    participants: new Set()
  });
  
  try {
    const imagePath = './media/quiz.jpg';
    
    if (fs.existsSync(imagePath)) {
      await Matrix.sendMessage(chatId, {
        image: fs.readFileSync(imagePath),
        caption: `🎯 *Quiz Time!*\n\n📝 *Question:* ${questionText}\n\n⏰ _Answer will be revealed in 10 seconds..._\n\n💡 _Try to answer before time runs out!_`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363313938933929@newsletter',
            newsletterName: "Buddy-XTR Quiz",
            serverMessageId: 888
          }
        }
      }, { quoted: m });
    } else {
      await Matrix.sendMessage(chatId, {
        text: `🎯 *Quiz Time!*\n\n📝 *Question:* ${questionText}\n\n⏰ _Answer will be revealed in 10 seconds..._\n\n💡 _Try to answer before time runs out!_\n\n_Note: Quiz image not found at app/media/quiz.jpg_`
      }, { quoted: m });
    }
    
    // Set timeout to reveal answer after 10 seconds
    setTimeout(async () => {
      if (activeQuizzes.has(chatId)) {
        const quizInfo = activeQuizzes.get(chatId);
        const participants = [...quizInfo.participants];
        
        let participantsText = '';
        if (participants.length > 0) {
          const mentions = participants.map(p => `@${p.split('@')[0]}`).join(', ');
          participantsText = `\n\n🏆 *Participants who answered:* ${mentions}`;
        } else {
          participantsText = "\n\n😢 No one attempted to answer!";
        }
        
        try {
          await Matrix.sendMessage(chatId, {
            text: `⏰ *Time's Up!*\n\n📝 *Question:* ${quizInfo.question}\n\n✅ *Correct Answer:* ${quizInfo.answer}${participantsText}\n\n🎮 _Type ${prefix}quiz to play again!_`
          });
        } catch (error) {
          console.error('Quiz answer reveal error:', error);
        }
        
        // Remove quiz from active quizzes
        activeQuizzes.delete(chatId);
      }
    }, 10000);
    
  } catch (error) {
    console.error('Quiz command error:', error);
    // Clean up if there was an error
    if (activeQuizzes.has(chatId)) {
      activeQuizzes.delete(chatId);
    }
    
    try {
      await Matrix.sendMessage(chatId, {
        text: `❌ An error occurred while starting the quiz. Please try again.\n\nError: ${error.message}`
      }, { quoted: m });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
};

// Export default handler
export default quiz;
