// powered by xtr softwares.
const facts = {
  science: [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
    "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
    "The human nose can detect over 1 trillion different scents.",
    "Bananas are berries, but strawberries aren't.",
    "Octopuses have three hearts: two pump blood to the gills, and one pumps it to the rest of the body.",
    "Water can boil and freeze at the same time under the right conditions (triple point).",
    "A day on Venus is longer than a year on Venus.",
    "There's enough DNA in the average human body to stretch from the Sun to Pluto and back 17 times.",
  ],
  
  history: [
    "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.",
    "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
    "The Ancient Romans used urine as mouthwash. The ammonia in urine acted as a cleansing agent.",
    "Albert Einstein was offered the presidency of Israel in 1952, but he declined.",
    "In ancient Greece, throwing an apple at someone was a declaration of love.",
    "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief.",
    "The longest year in history was 46 BC, when Julius Caesar added 80 days to the year to realign the calendar.",
    "Vikings used the bones of slain animals to skate on ice.",
  ],
  
  animal: [
    "A group of flamingos is called a 'flamboyance'.",
    "Cows have best friends and get stressed when they're separated.",
    "A snail can sleep for three years straight.",
    "Butterflies taste with their feet.",
    "Polar bears have black skin under their white fur to better absorb sunlight.",
    "An octopus has nine brains: one central brain and eight mini-brains in each arm.",
    "A shrimp's heart is located in its head.",
    "Koalas have fingerprints that are almost indistinguishable from human fingerprints.",
  ],
  
  space: [
    "There's a planet made of diamonds called 55 Cancri e. It's twice Earth's size and about 40 light-years away.",
    "One day on Mercury is 58 Earth days, but a year is only 88 Earth days.",
    "If two pieces of the same type of metal touch in space, they will permanently bond (cold welding).",
    "The footprints on the Moon will last for 100 million years because there's no wind or water to erase them.",
    "There's a giant cloud of alcohol in Sagittarius B that contains enough ethyl alcohol to make 400 trillion trillion pints of beer.",
    "The Sun makes up 99.86% of the mass in our Solar System.",
    "A neutron star is so dense that a teaspoon of it would weigh about 10 million tons.",
    "There are more stars in the universe than grains of sand on all the beaches on Earth.",
  ],
  
  weird: [
    "In Japan, there's a cafe where you can rent a handsome man to cry with you for 7,850 yen per hour.",
    "There's a town in Norway called 'Hell' that freezes over every winter.",
    "The electric chair was invented by a dentist.",
    "In 1945, a chicken named Mike lived for 18 months without a head.",
    "The word 'nerd' was first coined by Dr. Seuss in his book 'If I Ran the Zoo'.",
    "Scotland has 421 words for 'snow'.",
    "A woman from Michigan lost her wedding ring and found it 16 years later on a carrot in her garden.",
    "The first product to have a barcode was Wrigley's chewing gum.",
  ],
  
  tech: [
    "The first computer virus was created in 1983 and was called 'Elk Cloner'.",
    "The first 1GB hard drive cost $40,000 and weighed over 500 pounds in 1980.",
    "The 'QWERTY' keyboard layout was designed to slow typists down to prevent typewriter jams.",
    "The world's first website is still online: http://info.cern.ch",
    "The first computer mouse was made of wood.",
    "CAPTCHA stands for 'Completely Automated Public Turing test to tell Computers and Humans Apart'.",
    "About 90% of the world's currency exists only on computers.",
    "The first webcam was invented to monitor a coffee pot at Cambridge University.",
  ],
  
  human: [
    "Your brain uses about 20-25% of the oxygen you breathe and 20% of the calories you consume.",
    "Humans are the only animals that blush.",
    "Your stomach gets a new lining every 3-4 days to prevent it from digesting itself.",
    "Babies have about 100 more bones than adults (300 vs 206).",
    "The human eye can distinguish about 10 million different colors.",
    "You're about 1cm taller in the morning than in the evening due to spinal compression.",
    "Fingerprints form during the 10th week of pregnancy and are fully developed by the 17th week.",
    "Your heart beats about 100,000 times per day, pumping approximately 7,570 liters of blood.",
  ],
  
  food: [
    "Peanuts aren't nuts; they're legumes, related to beans and lentils.",
    "Hawaiian pizza was invented in Canada, not Hawaii.",
    "Carrots were originally purple, not orange. Orange carrots were bred by the Dutch in the 17th century.",
    "The world's most expensive coffee comes from beans eaten and excreted by civet cats.",
    "Ketchup was sold as medicine in the 1830s to treat diarrhea and indigestion.",
    "The world's rarest coffee, Black Ivory, comes from beans eaten and excreted by elephants.",
    "A single spaghetti is called a 'spaghetto'.",
    "The world's oldest known recipe is for beer, dating back over 4,000 years.",
  ],
  
  nature: [
    "Trees can communicate with each other through an underground fungal network called the 'Wood Wide Web'.",
    "Some species of bamboo can grow up to 91cm (35 inches) in a single day.",
    "The Amazon Rainforest produces 20% of the world's oxygen.",
    "A single oak tree can produce up to 10,000 acorns in a good year.",
    "The world's largest living organism is a fungus in Oregon that covers 2,385 acres (965 hectares).",
    "Some plants can 'hear' insects chewing on them and release chemicals to defend themselves.",
    "The smell of freshly cut grass is actually a distress signal released by the grass.",
    "A sunflower is not one flower, but a cluster of hundreds of tiny flowers.",
  ],
  
  ocean: [
    "The ocean contains about 20 million tons of gold dissolved in seawater.",
    "We have better maps of Mars than of our own ocean floor.",
    "The pressure at the deepest part of the ocean is equivalent to about 50 jumbo jets stacked on top of you.",
    "The longest mountain range on Earth is underwater (Mid-Ocean Ridge, about 65,000 km long).",
    "More people have been to the Moon than to the deepest part of the ocean.",
    "The ocean produces over half of the world's oxygen.",
    "There are more historical artifacts in the ocean than in all the world's museums combined.",
    "The world's largest living structure, the Great Barrier Reef, is visible from space.",
  ],
  
  day: [
    "Morning people are called 'larks', while night owls are called... well, 'owls'.",
    "Your brain is most active and creative between 10 AM and 2 PM.",
    "The first hour after waking up is when your brain is at its sharpest.",
    "Daylight can improve your mood and energy levels by increasing serotonin production.",
  ],
  
  night: [
    "Humans are the only mammals that willingly delay sleep.",
    "Your body temperature drops to its lowest point around 2 AM.",
    "Night owls tend to be more creative than morning people.",
    "Dreams are more vivid and memorable during REM sleep, which occurs more frequently in the second half of the night.",
  ]
};

export default facts;
