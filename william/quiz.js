// app/william/quiz.js
const quizQuestions = [
  {
    question: "What is the capital of France?",
    answer: "Paris"
  },
  {
    question: "Which planet is known as the Red Planet?",
    answer: "Mars"
  },
  {
    question: "What is the largest mammal in the world?",
    answer: "Blue Whale"
  },
  {
    question: "Who painted the Mona Lisa?",
    answer: "Leonardo da Vinci"
  },
  {
    question: "What is the chemical symbol for gold?",
    answer: "Au"
  },
  {
    question: "How many continents are there on Earth?",
    answer: "7"
  },
  {
    question: "What is the tallest mountain in the world?",
    answer: "Mount Everest"
  },
  {
    question: "Which gas do plants absorb from the atmosphere?",
    answer: "Carbon dioxide (CO2)"
  },
  {
    question: "What year did the Titanic sink?",
    answer: "1912"
  },
  {
    question: "What is the hardest natural substance on Earth?",
    answer: "Diamond"
  },

  // 🌍 General Knowledge
  { question: "What is the largest ocean on Earth?", answer: "Pacific Ocean" },
  { question: "Which country has the largest population?", answer: "China" },
  { question: "What is the smallest country in the world?", answer: "Vatican City" },
  { question: "Which language has the most native speakers?", answer: "Mandarin Chinese" },
  { question: "What is the longest river in the world?", answer: "Nile River" },
  { question: "Which desert is the largest in the world?", answer: "Sahara Desert" },
  { question: "What is the capital of Japan?", answer: "Tokyo" },
  { question: "Which continent is the coldest?", answer: "Antarctica" },
  { question: "What is the currency of the United Kingdom?", answer: "Pound Sterling" },
  { question: "Which country gifted the Statue of Liberty to the USA?", answer: "France" },

  // 🔬 Science
  { question: "What planet is closest to the Sun?", answer: "Mercury" },
  { question: "What gas do humans breathe in to survive?", answer: "Oxygen" },
  { question: "What part of the plant conducts photosynthesis?", answer: "Leaf" },
  { question: "What force keeps us on the ground?", answer: "Gravity" },
  { question: "What is the boiling point of water in Celsius?", answer: "100°C" },
  { question: "What is the freezing point of water in Celsius?", answer: "0°C" },
  { question: "Which organ pumps blood through the body?", answer: "Heart" },
  { question: "What is the largest organ in the human body?", answer: "Skin" },
  { question: "Which vitamin is produced when skin is exposed to sunlight?", answer: "Vitamin D" },
  { question: "What is H2O commonly known as?", answer: "Water" },

  // 🧮 Mathematics
  { question: "What is 10 × 10?", answer: "100" },
  { question: "What is the square root of 64?", answer: "8" },
  { question: "What is the value of Pi (approx)?", answer: "3.14" },
  { question: "How many sides does a triangle have?", answer: "3" },
  { question: "How many degrees are in a right angle?", answer: "90" },
  { question: "What is 15 + 27?", answer: "42" },
  { question: "What is 100 ÷ 4?", answer: "25" },
  { question: "What is the smallest prime number?", answer: "2" },
  { question: "What is 7 × 8?", answer: "56" },
  { question: "How many sides does a hexagon have?", answer: "6" },

  // 💻 Technology
  { question: "What does CPU stand for?", answer: "Central Processing Unit" },
  { question: "What does HTML stand for?", answer: "HyperText Markup Language" },
  { question: "What does CSS stand for?", answer: "Cascading Style Sheets" },
  { question: "What company developed Windows?", answer: "Microsoft" },
  { question: "Who founded Apple?", answer: "Steve Jobs" },
  { question: "What does URL stand for?", answer: "Uniform Resource Locator" },
  { question: "What programming language is used for web styling?", answer: "CSS" },
  { question: "What does RAM stand for?", answer: "Random Access Memory" },
  { question: "Which company owns Android?", answer: "Google" },
  { question: "What symbol is used for comments in JavaScript?", answer: "//" },

  // 🏛 History
  { question: "Who was the first President of the United States?", answer: "George Washington" },
  { question: "In which year did World War II end?", answer: "1945" },
  { question: "Who discovered America?", answer: "Christopher Columbus" },
  { question: "Which ancient civilization built the pyramids?", answer: "Egyptians" },
  { question: "Who was known as the Iron Lady?", answer: "Margaret Thatcher" },
  { question: "What wall fell in 1989?", answer: "Berlin Wall" },
  { question: "Who was the first man on the Moon?", answer: "Neil Armstrong" },
  { question: "Which empire was ruled by Julius Caesar?", answer: "Roman Empire" },
  { question: "Who wrote the Declaration of Independence?", answer: "Thomas Jefferson" },
  { question: "Which country started World War I?", answer: "Austria-Hungary" },

  // 🎭 Arts & Culture
  { question: "Who wrote Romeo and Juliet?", answer: "William Shakespeare" },
  { question: "What musical instrument has keys, pedals, and strings?", answer: "Piano" },
  { question: "Which art movement did Picasso belong to?", answer: "Cubism" },
  { question: "What is the national dance of Spain?", answer: "Flamenco" },
  { question: "Who composed the Fifth Symphony?", answer: "Beethoven" },
  { question: "Which movie features the character Jack Sparrow?", answer: "Pirates of the Caribbean" },
  { question: "What is the art of paper folding called?", answer: "Origami" },
  { question: "Which country is famous for anime?", answer: "Japan" },
  { question: "Who painted Starry Night?", answer: "Vincent van Gogh" },
  { question: "What is the main language spoken in Brazil?", answer: "Portuguese" },

  // ⚽ Sports
  { question: "How many players are on a football (soccer) team?", answer: "11" },
  { question: "Which country won the FIFA World Cup in 2018?", answer: "France" },
  { question: "What sport uses a shuttlecock?", answer: "Badminton" },
  { question: "Which sport is known as the 'king of sports'?", answer: "Football" },
  { question: "How many rings are on the Olympic flag?", answer: "5" },
  { question: "Which country hosts Wimbledon?", answer: "England" },
  { question: "What sport does Serena Williams play?", answer: "Tennis" },
  { question: "In which sport can you score a touchdown?", answer: "American Football" },
  { question: "What is the maximum score in a single frame of bowling?", answer: "30" },
  { question: "Which sport uses the term 'home run'?", answer: "Baseball" }
];

export default quizQuestions;
