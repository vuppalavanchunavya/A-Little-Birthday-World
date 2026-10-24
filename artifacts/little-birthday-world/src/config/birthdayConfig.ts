export function assetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

export const birthdayConfig = {
  name: 'Cherry',
  birthday: '2026-10-30',
  timezone: 'Asia/Kolkata',
  letter: `To my favorite human,

Happy Birthday!

No matter how much we fight, laugh, annoy each other, or go through together, you'll always be someone incredibly special to me.

I'm so lucky to have you as my sister. I hope this new year of your life brings you happiness, beautiful memories, endless laughter, and everything your heart wishes for.

No website could ever fit all the love I have for you, but I wanted to make this little corner of the internet just for you.

Happy Birthday, my forever person.`,
  finalMessage: `Happy Birthday to the girl who makes life a little more beautiful just by being in it.

You're not just my sister; you're a part of my world that I will always cherish.

I hope you smile a little more today, feel a little more loved, and remember how special you are—not just on your birthday, but every single day.

This little website is just a small reminder of how much you mean to me.

Love you always. Happy Birthday!`,
  photos: [
    {
      src: assetUrl('/images/cherry/cherry-traditional-blue.jpg'),
      caption: 'Radiant & full of grace',
      date: 'Celebration Day',
      memory: 'Looking like royalty in blue, with that signature bright smile that lights up every room.',
    },
    {
      src: assetUrl('/images/cherry/cherry-family-selfie.jpg'),
      caption: 'Together with the ones we love',
      date: 'Family Moments',
      memory: 'Our hearts in one frame. Blessed with the best family and the sweetest sister.',
    },
    {
      src: assetUrl('/images/cherry/cherry-puja-flowers.jpg'),
      caption: 'Festive warmth & blessings',
      date: 'Tradition & Love',
      memory: 'Carrying marigold flowers and prayers for a year full of peace and happiness.',
    },
    {
      src: assetUrl('/images/cherry/cherry-plaid-smile.jpg'),
      caption: 'Casual elegance & happy vibes',
      date: 'Cherished Days',
      memory: 'Just being effortlessly gorgeous, confident, and full of wonderful energy.',
    },
    {
      src: assetUrl('/images/cherry/cherry-botanical-art.jpg'),
      caption: 'Surrounded by nature & calm',
      date: 'Peaceful Moments',
      memory: 'A beautiful frame for a beautiful soul. Your kindness blooms everywhere.',
    },
    {
      src: assetUrl('/images/cherry/cherry-glasses-lenskart.jpg'),
      caption: 'Smart, chic & stylish',
      date: 'Everyday Magic',
      memory: 'Rocking the coolest frames and an even cooler attitude!',
    },
    {
      src: assetUrl('/images/cherry/cherry-airport-travel.jpg'),
      caption: 'Chasing dreams & high skies',
      date: 'Adventure Time',
      memory: 'Ready to take flight! May you always reach higher and higher in life.',
    },
  ],
};

export interface GiftDayConfig {
  id: string;
  dayNumber: number;
  unlockDate: string;
  displayDate: string;
  title: string;
  subtitle: string;
  lockedTitle: string;
  lockedSubtitle: string;
  badge: string;
  image: string;
  screen: 'reasons' | 'letter' | 'trivia' | 'album' | 'promises' | 'final';
}

export const birthdayGifts: GiftDayConfig[] = [
  {
    id: 'gift-1',
    dayNumber: 1,
    unlockDate: '2026-10-25',
    displayDate: '25 Oct',
    title: 'The Jar of Reasons',
    subtitle: '6 sweet notes & sister vouchers made just for you.',
    lockedTitle: 'Day 1 · Mystery Surprise 🔒',
    lockedSubtitle: 'A sweet sisterly keepsake sealed in Shin-chan’s vault. Unlocks on 25 Oct! 🤫',
    badge: 'Day 1 · 25 Oct',
    image: assetUrl('/images/shinchan/accept.jpg'),
    screen: 'reasons',
  },
  {
    id: 'gift-2',
    dayNumber: 2,
    unlockDate: '2026-10-26',
    displayDate: '26 Oct',
    title: 'The Little Letter',
    subtitle: 'A heartfelt sealed note from your sister.',
    lockedTitle: 'Day 2 · Sealed Secret 💌',
    lockedSubtitle: 'Sealed tight with wax & sibling love. No peeking until 26 Oct!',
    badge: 'Day 2 · 26 Oct',
    image: assetUrl('/images/shinchan/letter.jpg'),
    screen: 'letter',
  },
  {
    id: 'gift-3',
    dayNumber: 3,
    unlockDate: '2026-10-27',
    displayDate: '27 Oct',
    title: 'Sister Secret Trivia',
    subtitle: 'A funny sibling quiz with Shin-chan reactions.',
    lockedTitle: 'Day 3 · Top-Secret Mystery 🙈',
    lockedSubtitle: 'A playful sibling surprise guarded by Shin-chan. Unlocks on 27 Oct!',
    badge: 'Day 3 · 27 Oct',
    image: assetUrl('/images/shinchan/how-dare-you.jpg'),
    screen: 'trivia',
  },
  {
    id: 'gift-4',
    dayNumber: 4,
    unlockDate: '2026-10-28',
    displayDate: '28 Oct',
    title: 'Our Little World',
    subtitle: 'A photo scrapbook with Shin-chan, Shiro & our memories.',
    lockedTitle: 'Day 4 · Memory Vault 🐾',
    lockedSubtitle: 'A special treasure locked under Shiro’s paw. Opens on 28 Oct!',
    badge: 'Day 4 · 28 Oct',
    image: assetUrl('/images/shinchan/camera.jpg'),
    screen: 'album',
  },
  {
    id: 'gift-5',
    dayNumber: 5,
    unlockDate: '2026-10-29',
    displayDate: '29 Oct',
    title: 'Birthday Eve Promises',
    subtitle: '5 golden promises on the night before your birthday.',
    lockedTitle: 'Day 5 · Golden Mystery ✨',
    lockedSubtitle: 'The special eve before the big birthday! Unlocks on 29 Oct!',
    badge: 'Day 5 · 29 Oct',
    image: assetUrl('/images/shinchan/countdown.jpg'),
    screen: 'promises',
  },
  {
    id: 'gift-6',
    dayNumber: 6,
    unlockDate: '2026-10-30',
    displayDate: '30 Oct',
    title: 'The Big Reveal',
    subtitle: 'The grand celebration, cake blowing & song!',
    lockedTitle: 'Day 6 · The Big Birthday Reveal 🎂',
    lockedSubtitle: 'The biggest surprise of all! Strictly locked until 30 Oct at 00:00 IST! 🌟',
    badge: 'Day 6 · 30 Oct · Birthday!',
    image: assetUrl('/images/shinchan/big-gift.jpg'),
    screen: 'final',
  },
];

export const reasonsData = [
  {
    title: 'Your Contagious Laugh',
    emoji: '😂',
    text: 'You can turn the most ordinary situation into an uncontrollable laughing fit. That laugh is purely healing and lights up the whole house.',
  },
  {
    title: 'My Inbuilt Best Friend',
    emoji: '👯‍♀️',
    text: "Friends may come and go, but having you as my sister means I never have to walk through life alone. You're my forever person.",
  },
  {
    title: 'Effortlessly Iconic',
    emoji: '💅',
    text: 'Whether you are dressed up in royal traditional blue or chilling in comfy clothes at home, you carry yourself with so much grace, elegance, and charm.',
  },
  {
    title: 'The Best Advice Giver',
    emoji: '🧠',
    text: "Even when I am too stubborn to admit it right away, you always give the wisest, most honest advice when I need it most.",
  },
  {
    title: 'Our Sibling Telepathy',
    emoji: '✨',
    text: "We don't even need words — just one look across the room and we already know what the other is thinking and trying not to burst out laughing.",
  },
  {
    title: 'Your Big, Kind Heart',
    emoji: '💖',
    text: 'Beneath all the teasing and playful fights, you have the sweetest, most caring, and most generous soul in the world.',
  },
];

export const sisterVouchers = [
  {
    id: 'v1',
    title: '24-Hour Argument Immunity',
    desc: 'You win every debate, argument, or disagreement today with zero pushback!',
    icon: '🛡️',
  },
  {
    id: 'v2',
    title: 'Midnight Treat on Demand',
    desc: 'Redeem anytime for your favorite snack, ice cream, or takeout on me!',
    icon: '🍕',
  },
  {
    id: 'v3',
    title: 'Free Chore Pass',
    desc: 'I will complete any one chore of your choice without complaining.',
    icon: '🧹',
  },
  {
    id: 'v4',
    title: 'Unlimited Hugs & Pep Talks',
    desc: 'Whenever you need cheering up, a hug, or a hype speech — valid for life!',
    icon: '🤗',
  },
];

export const triviaQuestions = [
  {
    question: 'Who takes longer to pick an outfit and take aesthetic pictures?',
    options: ['Cherry (Gotta get that perfect angle!)', 'Me', 'Both of us take 2 hours!'],
    reaction: 'Looking iconic takes time, effort, and dedication! Absolutely worth it! 📸✨',
  },
  {
    question: 'Who is more protective of the other?',
    options: ['Cherry is the fierce protector 🛡️', "I've got her back forever 🤝", 'We protect each other against the world! 💖'],
    reaction: 'Nobody messes with either of us! Sibling power is unbeatable! 💥',
  },
  {
    question: 'What is our official sister language?',
    options: ['Teasing each other 24/7 😜', 'Sending funny reels at 2 AM 📱', 'Deep late-night life talks ☕', 'All of the above! 🌟'],
    reaction: "All of the above! That's the unbreakable sister code! 💯",
  },
  {
    question: 'What is the ultimate golden rule of our sisterhood?',
    options: ['Always share snacks', 'No secrets allowed', 'Love and support each other through thick and thin ❤️'],
    reaction: 'No matter where life takes us, we are always a team forever and always! 👭',
  },
];

export const sisterPromises = [
  {
    number: '01',
    title: 'Your Loudest Cheerleader',
    promise: 'I promise to always celebrate your victories, big or small, louder than anyone else in the room.',
  },
  {
    number: '02',
    title: 'Your Safe Haven',
    promise: 'I promise to be your safe space whenever life feels overwhelming, where you can just be yourself without judgment.',
  },
  {
    number: '03',
    title: 'Always Truthful',
    promise: 'I promise to always tell you the truth, keep your secrets safe, and guide you with honesty and love.',
  },
  {
    number: '04',
    title: 'By Your Side Through Any Storm',
    promise: 'I promise to stand right beside you through every storm and celebrate every rainbow with you.',
  },
  {
    number: '05',
    title: 'Unconditional Love',
    promise: 'I promise that as the years go by, our bond will only grow stronger, deeper, and more cherished.',
  },
];
