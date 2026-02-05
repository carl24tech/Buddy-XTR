// app/buddyxtr/quotes.js
const quotes = {
  life: [
    { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "Get busy living or get busy dying.", author: "Stephen King" },
    { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
    { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
    { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
  ],
  
  love: [
    { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
    { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
    { text: "If I know what love is, it is because of you.", author: "Hermann Hesse" },
    { text: "Love isn't something you find. Love is something that finds you.", author: "Loretta Young" },
    { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
    { text: "The greatest happiness of life is the conviction that we are loved.", author: "Victor Hugo" },
    { text: "Love is when the other person's happiness is more important than your own.", author: "H. Jackson Brown Jr." },
    { text: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
  ],
  
  motivation: [
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  ],
  
  success: [
    { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
    { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
    { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
  ],
  
  wisdom: [
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { text: "The fool doth think he is wise, but the wise man knows himself to be a fool.", author: "William Shakespeare" },
    { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
    { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
    { text: "The wise man doesn't give the right answers, he poses the right questions.", author: "Claude Levi-Strauss" },
    { text: "By three methods we may learn wisdom: First, by reflection, which is noblest; Second, by imitation, which is easiest; and third by experience, which is the bitterest.", author: "Confucius" },
    { text: "Wisdom is the reward you get for a lifetime of listening when you'd have preferred to talk.", author: "Doug Larson" },
  ],
  
  philosophy: [
    { text: "I think, therefore I am.", author: "René Descartes" },
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "Man is condemned to be free.", author: "Jean-Paul Sartre" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "Happiness is the highest good.", author: "Aristotle" },
    { text: "The only thing I know is that I know nothing.", author: "Socrates" },
    { text: "God is dead. God remains dead. And we have killed him.", author: "Friedrich Nietzsche" },
  ],
  
  funny: [
    { text: "I'm not arguing, I'm just explaining why I'm right.", author: "Anonymous" },
    { text: "I used to think I was indecisive, but now I'm not so sure.", author: "Anonymous" },
    { text: "I'm on a seafood diet. I see food and I eat it.", author: "Anonymous" },
    { text: "I don't need a hairstylist, my pillow gives me a new hairstyle every morning.", author: "Anonymous" },
    { text: "I'm not lazy, I'm on energy saving mode.", author: "Anonymous" },
    { text: "My wallet is like an onion. Opening it makes me cry.", author: "Anonymous" },
    { text: "I'm not saying I'm Wonder Woman, I'm just saying no one has ever seen me and Wonder Woman in the same room together.", author: "Anonymous" },
    { text: "I told my wife she was drawing her eyebrows too high. She looked surprised.", author: "Anonymous" },
  ],
  
  friendship: [
    { text: "A real friend is one who walks in when the rest of the world walks out.", author: "Walter Winchell" },
    { text: "Friendship is born at that moment when one person says to another, 'What! You too? I thought I was the only one.'", author: "C.S. Lewis" },
    { text: "There is nothing better than a friend, unless it is a friend with chocolate.", author: "Linda Grayson" },
    { text: "A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
    { text: "Friends show their love in times of trouble, not in happiness.", author: "Euripides" },
    { text: "True friendship comes when the silence between two people is comfortable.", author: "David Tyson Gentry" },
    { text: "A single rose can be my garden... a single friend, my world.", author: "Leo Buscaglia" },
    { text: "Good friends are like stars. You don't always see them, but you know they're always there.", author: "Anonymous" },
  ],
  
  work: [
    { text: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius" },
    { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
    { text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
    { text: "The price of success is hard work, dedication to the job at hand.", author: "Vince Lombardi" },
    { text: "Nothing will work unless you do.", author: "Maya Angelou" },
    { text: "Work until your idols become your rivals.", author: "Drake" },
  ],
  
  time: [
    { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
    { text: "Lost time is never found again.", author: "Benjamin Franklin" },
    { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
    { text: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly-Curtin" },
    { text: "Better three hours too soon than a minute too late.", author: "William Shakespeare" },
    { text: "Time is the most valuable thing a man can spend.", author: "Theophrastus" },
    { text: "The key is in not spending time, but in investing it.", author: "Stephen R. Covey" },
    { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  ],
  
  morning: [
    { text: "Every morning we are born again. What we do today matters most.", author: "Buddha" },
    { text: "Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have.", author: "Lemony Snicket" },
    { text: "When you arise in the morning, think of what a precious privilege it is to be alive - to breathe, to think, to enjoy, to love.", author: "Marcus Aurelius" },
    { text: "The sun is a daily reminder that we too can rise again from the darkness, that we too can shine our own light.", author: "S. Ajna" },
  ],
  
  afternoon: [
    { text: "Rest and be thankful.", author: "William Wordsworth" },
    { text: "The afternoon knows what the morning never suspected.", author: "Robert Frost" },
    { text: "Afternoon: that time of day when you've just had lunch, but it's not acceptable to start drinking yet.", author: "Anonymous" },
    { text: "Some of the best memories are made in flip flops.", author: "Kellie Elmore" },
  ],
  
  evening: [
    { text: "Evenings are about appreciating what you have and looking forward to what you will achieve.", author: "Anonymous" },
    { text: "The evening sings in a voice of amber, the dawn is surely coming.", author: "Dave Matthews" },
    { text: "Sunset is still my favorite color, and rainbow is second.", author: "Mattie Stepanek" },
    { text: "The evening is the best part of the day.", author: "George Eliot" },
  ],
  
  night: [
    { text: "The night is the hardest time to be alive and 4am knows all my secrets.", author: "Poppy Z. Brite" },
    { text: "Night time is really the best time to work. All the ideas are there to be yours because everyone else is asleep.", author: "Catherine O'Hara" },
    { text: "The moon is a friend for the lonesome to talk to.", author: "Carl Sandburg" },
    { text: "The night is the mother of thoughts.", author: "John Florio" },
  ],
  
  authors: {
    "Albert Einstein": [
      { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
      { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
      { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
      { text: "The only source of knowledge is experience.", author: "Albert Einstein" },
    ],
    "Martin Luther King Jr.": [
      { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr." },
      { text: "The time is always right to do what is right.", author: "Martin Luther King Jr." },
      { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr." },
      { text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr." },
    ],
    "Maya Angelou": [
      { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
      { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
      { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
      { text: "Nothing will work unless you do.", author: "Maya Angelou" },
    ],
    "Rumi": [
      { text: "The wound is the place where the Light enters you.", author: "Rumi" },
      { text: "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.", author: "Rumi" },
      { text: "What you seek is seeking you.", author: "Rumi" },
      { text: "Let yourself be silently drawn by the strange pull of what you really love.", author: "Rumi" },
    ],
    "Oscar Wilde": [
      { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
      { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
      { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
      { text: "Always forgive your enemies; nothing annoys them so much.", author: "Oscar Wilde" },
    ],
  }
};

export default quotes;
