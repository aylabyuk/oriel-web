import type { AiPersonality } from '@/constants/players';
import { AI_STRATEGIST, AI_TRASH_TALKER, AI_CHILL } from '@/constants/players';

export type PersonalInfoThread = {
  topicKey: string;
  entries: { personality: AiPersonality; text: string }[];
};

export const PERSONAL_INFO_TOPICS: PersonalInfoThread[] = [
  // 1. Guitar / Music
  {
    topicKey: 'guitar',
    entries: [
      { personality: AI_TRASH_TALKER, text: 'This dude built a Les Paul guitar from SCRATCH! Soldered pickups, sanded frets, everything!' },
      { personality: AI_CHILL, text: "He can't code without a guitar next to him. Strums between PRs." },
      { personality: AI_STRATEGIST, text: 'Four guitars total. Strat, acoustic, bass, and the custom Les Paul.' },
    ],
  },
  // 2. CTC Checkout
  {
    topicKey: 'ctc_checkout',
    entries: [
      { personality: AI_STRATEGIST, text: "Oriel built the checkout flow at Canadian Tire. Cart, payments, Triangle Rewards — the full pipeline." },
      { personality: AI_TRASH_TALKER, text: 'Plus he integrated Criteo, Westjet, Petro-Canada, AND RBC into the payment flow! The man does it ALL!' },
      { personality: AI_CHILL, text: 'And he caught a missing pay button before it hit production. Clutch.' },
    ],
  },
  // 3. Trunkrs
  {
    topicKey: 'trunkrs',
    entries: [
      { personality: AI_CHILL, text: "Oriel calls his Trunkrs projects his 'baby projects.' They're still running in production." },
      { personality: AI_TRASH_TALKER, text: 'FIVE apps! DriverApp, CollectionApp, CS Portal, Track and Trace, Sorting. The man does not stop!' },
      { personality: AI_STRATEGIST, text: 'He also configured CI/CD for both web and mobile there. Plus Postgres and AWS exposure.' },
    ],
  },
  // 4. Origins
  {
    topicKey: 'origins',
    entries: [
      { personality: AI_TRASH_TALKER, text: "Oriel started coding on a Windows 98 machine his uncle gave him. HTML, CSS, and Flash ActionScript!" },
      { personality: AI_STRATEGIST, text: 'From Windows 98 to React and Three.js. A significant evolution in the stack.' },
      { personality: AI_CHILL, text: "He's from Quezon City, Philippines. Moved to Toronto in 2023. The grind is real." },
    ],
  },
  // 5. PHIVOLCS (First Job)
  {
    topicKey: 'phivolcs',
    entries: [
      { personality: AI_STRATEGIST, text: "Oriel's first dev job was building a seismic dashboard for PHIVOLCS. React, Google Maps, D3.js." },
      { personality: AI_CHILL, text: 'He worked with geologists and scientists. Learned to translate their needs into code.' },
      { personality: AI_TRASH_TALKER, text: "And he found an old server hiding in a DRAWER to deploy the app! No AWS, no cloud — just pure hustle!" },
    ],
  },
  // 6. Family & Faith
  {
    topicKey: 'family_faith',
    entries: [
      { personality: AI_CHILL, text: "Oriel's kid is on the spectrum. That's what drives him. Family first, always." },
      { personality: AI_TRASH_TALKER, text: 'He served a two-year mission for his church too. The Church of Jesus Christ of Latter-day Saints.' },
      { personality: AI_STRATEGIST, text: "He's in the Bishopric at the first Filipino ward in Eastern Canada. A meaningful role." },
    ],
  },
  // 7. Values & Character
  {
    topicKey: 'values',
    entries: [
      { personality: AI_CHILL, text: 'Oriel values honesty, compassion, and respect above everything. You can tell when you work with him.' },
      { personality: AI_STRATEGIST, text: "He also knows when to say no. Disciplined about capacity — doesn't overcommit." },
      { personality: AI_TRASH_TALKER, text: "And he genuinely enjoys seeing other people succeed. No ego at all. Well... except maybe in UNO!" },
    ],
  },
  // 8. This Portfolio Game
  {
    topicKey: 'portfolio',
    entries: [
      { personality: AI_TRASH_TALKER, text: 'Oriel built this ENTIRE UNO game as his portfolio! Who does that?!' },
      { personality: AI_STRATEGIST, text: 'React, Three.js, Redux Toolkit, TypeScript. A solid architecture for a creative concept.' },
      { personality: AI_CHILL, text: "Pretty cool way to introduce yourself honestly. Creative and genuine. That's Oriel." },
    ],
  },
  // 9. Stratpoint / Globe Telecom
  {
    topicKey: 'stratpoint',
    entries: [
      { personality: AI_STRATEGIST, text: 'Oriel built a CMS from scratch at Stratpoint using React and GraphQL. Client was Globe Telecom.' },
      { personality: AI_TRASH_TALKER, text: 'He even integrated AWS push notifications for Globe subscribers!' },
      { personality: AI_CHILL, text: "They used to ask him to send notifications at odd hours. So he automated the whole thing." },
    ],
  },
  // 10. CTC Admin Tools
  {
    topicKey: 'ctc_admin',
    entries: [
      { personality: AI_STRATEGIST, text: 'Oriel architected the Search Management Console at CTC. Admin tool for filtering and search, built with Material UI and OKTA.' },
      { personality: AI_TRASH_TALKER, text: "He also did the CanadaPost address integration. The man's done more API work than some backend devs!" },
      { personality: AI_CHILL, text: "Search page, Cart page, Checkout, Product Details — he's touched basically every part of the site." },
    ],
  },
  // 11. Skills & Growth
  {
    topicKey: 'skills',
    entries: [
      { personality: AI_CHILL, text: 'Oriel learned TypeScript deeply at Trunkrs. Three-plus years of shipping React and React Native apps.' },
      { personality: AI_STRATEGIST, text: "He's also proficient in GraphQL, Postgres, and the MERN stack. Versatile engineer." },
      { personality: AI_TRASH_TALKER, text: "AND he's learning C++ right now to build a custom guitar effects pedal with a daisy seed! Who DOES that?!" },
    ],
  },
  // 12. Work Style
  {
    topicKey: 'work_style',
    entries: [
      { personality: AI_CHILL, text: 'Oriel asks a lot of questions when solving problems. Good questions though. Breaks things down.' },
      { personality: AI_STRATEGIST, text: 'A methodical approach. He prioritizes what matters and works through problems systematically.' },
      { personality: AI_TRASH_TALKER, text: "He's cool with on-site work too! No ego about remote vs office — whatever helps the team!" },
    ],
  },
  // 13. AI & Modern Tooling
  {
    topicKey: 'ai_tools',
    entries: [
      { personality: AI_STRATEGIST, text: 'Oriel built this entire portfolio using Claude Code — AI-assisted from architecture to implementation.' },
      { personality: AI_TRASH_TALKER, text: "He doesn't just USE AI tools — he ships FASTER with them! The man treats AI like a second pair of hands!" },
      { personality: AI_CHILL, text: "He sees AI as a force multiplier, not a replacement. Knows when to lean on it and when to think for himself." },
    ],
  },
  // 14. Collaboration & Team Fit
  {
    topicKey: 'collaboration',
    entries: [
      { personality: AI_STRATEGIST, text: "He's worked across diverse teams — scientists at PHIVOLCS, partners at CTC, distributed teams at Trunkrs. Adaptable collaborator." },
      { personality: AI_TRASH_TALKER, text: "Oriel's the kind of dev who makes the whole team better! No ego, just vibes and clean code!" },
      { personality: AI_CHILL, text: 'He pairs well. Asks the right questions, listens, then ships. Easy to work with.' },
    ],
  },
];
