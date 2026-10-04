export interface NavLink {
  label: string;
  href: string;
}

export interface MicroTrustItem {
  icon: string;
  label: string;
}

export interface FeatureItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  overlayType: 'subscription' | 'message' | 'live' | 'bundle' | 'tips' | 'vault';
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  image: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface PersonaItem {
  id: string;
  role: string;
  name: string;
  handle: string;
  sells: string;
  image: string;
}

export interface ProtectionItem {
  title: string;
  description: string;
  icon: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const landingContent = {
  ageGate: {
    title: 'Lumora is for adults 18+',
    description: 'Please confirm your age to continue. You must be at least 18 years old to access this platform.',
    confirmButton: "I'm 18 or older",
    leaveButton: 'Leave',
  },

  navbar: {
    brand: 'Lumora',
    links: [
      { label: 'Discover', href: '#features' },
      { label: 'Creators', href: '#creators' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Live', href: '#live' },
      { label: 'Safety', href: '#safety' },
      { label: 'Pricing', href: '#pricing' },
    ] as NavLink[],
    loginCta: 'Log In',
    signupCta: 'Join free',
  },

  hero: {
    eyebrow: 'The creator-owned 18+ platform',
    titleLine1: 'Your fans. Your rules.',
    titleLine2: 'Your',
    titleHighlight: 'income.',
    subtitle:
      'Subscriptions, paid messages, live shows and content drops in one place, with 80% of every dollar going straight to you.',
    primaryCta: 'Start creating →',
    secondaryCta: 'Explore creators',
    microTrust: [
      { icon: 'shield-check', label: 'ID-verified creators' },
      { icon: 'calendar-check', label: 'Payouts weekly' },
      { icon: 'key-round', label: '2FA on every creator account' },
    ] as MicroTrustItem[],
    image: '/landing/hero-creator.webp',
    imageAlt: 'Creator looking out over city skyline holding smartphone with confident smile',
    floatingCards: {
      subscriber: {
        title: 'New subscriber',
        subtitle: '@demo_fan joined · just now',
      },
      earnings: {
        label: 'This week',
        amount: '$1,240.00',
        caption: 'Example dashboard',
      },
      live: {
        status: 'LIVE',
        details: 'Friday 8:00 PM · 214 waiting',
      },
    },
  },

  trustStrip: [
    'Fitness',
    'Music',
    'Art',
    'Fashion',
    'Travel',
    'Coaching',
    'Cosplay',
    'Cooking',
    'Gaming',
    'Wellness',
    'Comedy',
    'Photography',
  ],

  featureSwitcher: {
    eyebrow: 'All in one place',
    title: "Everything you need to earn, nothing you don't.",
    features: [
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        tagline: 'Monthly memberships, multi-month discounts and free trials.',
        description: 'Set your own recurring tiers with optional upfront bundle discounts to build dependable recurring revenue.',
        image: '/landing/feature-subscriptions.webp',
        overlayType: 'subscription',
      },
      {
        id: 'messages',
        name: 'Paid messages',
        tagline: 'Lock photos and videos inside DMs and set your price.',
        description: 'Engage 1-on-1 with pay-to-view media attachments, audio messages, and tiered tipping.',
        image: '/landing/feature-messages.webp',
        overlayType: 'message',
      },
      {
        id: 'live',
        name: 'Live shows',
        tagline: 'Go live from your browser or OBS, with tip goals.',
        description: 'Low-latency broadcast streams with interactive live chats, milestone goal meters, and instant stream tips.',
        image: '/landing/feature-live.webp',
        overlayType: 'live',
      },
      {
        id: 'bundles',
        name: 'Bundles',
        tagline: 'Package your best content into one-time drops.',
        description: 'Release high-value collections, behind-the-scenes masterclasses, and curated photo vaults with single checkout.',
        image: '/landing/feature-bundles.webp',
        overlayType: 'bundle',
      },
      {
        id: 'tips',
        name: 'Tips',
        tagline: 'Fans can tip on posts, chats and streams.',
        description: 'Allow loyal supporters to send spontaneous appreciation anytime across your feed, timeline, and private DMs.',
        image: '/landing/feature-live.webp',
        overlayType: 'tips',
      },
      {
        id: 'vault',
        name: 'Vault',
        tagline: 'One private library, reused everywhere.',
        description: 'Organize your media assets in a secure, taggable media vault. Drag and attach to any post or message in seconds.',
        image: '/landing/feature-vault.webp',
        overlayType: 'vault',
      },
    ] as FeatureItem[],
  },

  dashboardPreview: {
    eyebrow: 'Built for creators',
    title: 'Run your page like a business.',
    description: 'Get deep clarity into your audience growth, content performance, and revenue streams without spreadsheet gymnastics.',
    capabilities: [
      { title: 'Earnings by source', desc: 'Break down income across subscriptions, tips, paid DMs, and live streams.' },
      { title: 'Top fans and churn', desc: 'Identify your most dedicated champions and track renewal retention curves.' },
      { title: 'Payout status in real time', desc: 'Full transparency on pending balance maturation and weekly bank transfers.' },
    ],
    cta: 'See the creator tools',
    avatar: '/landing/avatar-1.webp',
    mock: {
      creatorName: 'Elena Rostova',
      handle: '@elena',
      subscribersCount: '1,420',
      messagesCount: '84 unread',
      upcomingLive: 'Tonight, 9 PM EST',
      recentActivity: [
        { type: 'sub', text: 'New tier 1 subscriber', time: '2m ago' },
        { type: 'unlock', text: 'Paid message unlocked ($15)', time: '14m ago' },
        { type: 'tip', text: 'Tip received ($50)', time: '1h ago' },
      ],
    },
  },

  profilePreview: {
    eyebrow: 'Creator-first',
    title: 'Own your audience. Keep your edge.',
    description:
      'You build the direct relationship. No black-box algorithms hiding your posts or cutting you off from the fans who support your work.',
    cta: 'Become a creator →',
    image: '/landing/profile-creator.webp',
    caption: 'Example profile',
    card: {
      avatar: '/landing/avatar-2.webp',
      displayName: 'Ava Monroe (example)',
      handle: '@ava.example',
      verified: true,
      bio: 'Editorial portraiture, creative direction & behind-the-scenes workflow drops.',
      stats: {
        posts: '148',
        fans: '2.4K',
        likes: '38K',
      },
      buttons: {
        follow: 'Follow',
        subscribe: 'Subscribe · $9.99/mo',
      },
    },
  },

  calculator: {
    eyebrow: 'Transparent earnings',
    title: 'Calculate your monthly income.',
    subtitle: 'See what you keep with Lumora’s creator-first 80% payout split.',
    fansLabel: 'Paying fans',
    priceLabel: 'Monthly subscription price',
    footnote: 'Estimate before taxes and payment processing adjustments. Minimum payout withdrawal is $50.00.',
  },

  howItWorks: {
    eyebrow: 'Simple from day one',
    title: 'Live in three steps.',
    steps: [
      {
        step: 1,
        title: 'Create and verify',
        description: 'Set up your page and verify your ID in minutes with fast, automated identity screening.',
        image: '/landing/step-1-setup.webp',
      },
      {
        step: 2,
        title: 'Post, message, go live',
        description: 'Share exclusive drops, chat one-to-one, and host interactive live broadcasts.',
        image: '/landing/step-2-share.webp',
      },
      {
        step: 3,
        title: 'Get paid weekly',
        description: 'Watch earnings land and withdraw directly to your verified bank account every week.',
        image: '/landing/step-3-earn.webp',
      },
    ] as HowItWorksStep[],
  },

  liveShowcase: {
    eyebrow: 'Real-time engagement',
    title: 'Go live. Get closer.',
    description:
      'High-definition, low-latency streaming built right in. Host subscriber-only streams, set group tip goals, and connect in real time without third-party plugins.',
    cta: 'Learn about live',
    image: '/landing/live-stage.webp',
    mockChat: [
      { user: '@alex_m', message: 'The lighting setup looks incredible tonight!' },
      { user: '@sam_k', message: 'Tipped $25 toward the goal 🚀' },
      { user: '@chloe_99', message: 'Can you show the camera angle settings?' },
      { user: '@marcus_v', message: 'Just upgraded my membership!' },
      { user: '@devon_art', message: 'Sound quality is crystal clear 🙌' },
    ],
  },

  categories: {
    eyebrow: 'Every passion belongs',
    title: 'Built for every kind of creator.',
    items: [
      { id: 'fitness', name: 'Fitness', description: 'Workouts, nutrition guides & form coaching', image: '/landing/cat-fitness.webp' },
      { id: 'music', name: 'Music', description: 'Stems, acoustic sessions & studio breakdowns', image: '/landing/cat-music.webp' },
      { id: 'art', name: 'Art', description: 'Digital painting, speedpaints & PSD archives', image: '/landing/cat-art.webp' },
      { id: 'fashion', name: 'Fashion', description: 'Lookbooks, styling guides & capsule curations', image: '/landing/cat-fashion.webp' },
      { id: 'travel', name: 'Travel', description: 'Expedition vlogs, guides & photography packs', image: '/landing/cat-travel.webp' },
      { id: 'coaching', name: 'Coaching', description: 'Mentorship, 1-on-1 Q&A & tactical workshops', image: '/landing/cat-coaching.webp' },
      { id: 'cosplay', name: 'Cosplay', description: 'Armor blueprints, fabrication & photoshoots', image: '/landing/cat-cosplay.webp' },
      { id: 'cooking', name: 'Cooking', description: 'Artisan recipes, masterclasses & meal preps', image: '/landing/cat-cooking.webp' },
    ] as CategoryItem[],
  },

  personas: {
    eyebrow: 'Creators like you',
    title: 'However you create, it fits.',
    items: [
      {
        id: 'fitness',
        role: 'Fitness Coach',
        name: 'Jordan K.',
        handle: '@jordank_fit',
        sells: 'Monthly strength cycles, form-check direct messages, and weekly live mobility classes.',
        image: '/landing/persona-fitness.webp',
      },
      {
        id: 'music',
        role: 'Music Producer',
        name: 'Marcus Vance',
        handle: '@vancemusic',
        sells: 'Sample packs, beat breakdown masterclasses, and VIP subscriber feedback streams.',
        image: '/landing/persona-music.webp',
      },
      {
        id: 'cosplay',
        role: 'Cosplay Artist',
        name: 'Aria Chen',
        handle: '@ariacos',
        sells: 'Prop crafting pattern PDFs, exclusive 4K gallery drops, and cosplay workshop streams.',
        image: '/landing/persona-cosplay.webp',
      },
      {
        id: 'chef',
        role: 'Home Chef',
        name: 'Chef Mateo',
        handle: '@mateocooks',
        sells: 'Weekly seasonal recipe guides, step-by-step video vaults, and live interactive cooking dinners.',
        image: '/landing/persona-chef.webp',
      },
    ] as PersonaItem[],
  },

  protection: {
    eyebrow: 'Creator protection',
    title: 'Your business, protected.',
    description:
      'We treat creator safety and copyright sovereignty with institutional-grade safeguards built directly into our infrastructure.',
    image: '/landing/safety-shield.webp',
    cta: 'Read our safety approach →',
    items: [
      {
        title: 'Secure payments',
        description: 'Compliant merchant processing with proactive fraud mitigation and chargeback shielding.',
        icon: 'lock',
      },
      {
        title: 'Privacy and geo-blocking',
        description: 'Block specific countries, postal areas, or IP ranges to protect your offline privacy.',
        icon: 'globe',
      },
      {
        title: 'Watermarked media',
        description: 'Dynamic forensic watermarking tags content with individual viewer identifiers to discourage leaks.',
        icon: 'shield',
      },
      {
        title: 'Copyright takedowns',
        description: 'Automated DMCA processing and dedicated legal support teams assisting with copyright enforcement.',
        icon: 'file-text',
      },
      {
        title: 'Verified creators only',
        description: 'Strict mandatory biometric ID check ensures every creator on Lumora is a verified adult.',
        icon: 'user-check',
      },
      {
        title: 'Real human support',
        description: '24/7 dedicated creator support team that understands your business and responds promptly.',
        icon: 'headphones',
      },
    ] as ProtectionItem[],
  },

  pricing: {
    eyebrow: 'Transparent economics',
    title: 'Free to join. We only earn when you do.',
    subtitle: 'No monthly platform fees. No hidden gatekeeping. A fair 80/20 split on every dollar generated.',
    split: {
      creatorPercentage: 80,
      platformPercentage: 20,
      creatorLabel: 'You keep 80%',
      platformLabel: 'Lumora 20%',
    },
    bullets: [
      'No upfront setup or subscription fees',
      'No monthly software maintenance charges',
      'Reliable weekly payouts directly to your bank',
      'Full access to all platform features and live streaming',
    ],
    cta: 'Start creating free →',
  },

  faq: {
    eyebrow: 'Got questions?',
    title: 'Questions, answered.',
    helpCta: 'Visit help center →',
    items: [
      {
        question: 'How do I get paid?',
        answer:
          'Earnings move from pending to available after a short holding period, then you withdraw weekly to your verified payout method.',
      },
      {
        question: 'What can I post?',
        answer:
          'Original content you own, featuring only verified adults who have consented. See our content rules for prohibited categories.',
      },
      {
        question: 'How do subscriptions work?',
        answer:
          'Fans pay monthly or choose a discounted multi-month bundle; you set the price and retain full autonomy over your subscription tiers.',
      },
      {
        question: 'Is my content protected?',
        answer:
          'Media is private by default, streamed via expiring secure links and dynamically watermarked with each viewer’s handle.',
      },
      {
        question: 'Can fans cancel anytime?',
        answer:
          'Yes. Access continues until the end of the current billing cycle, with no penalties or complicated cancellation steps.',
      },
      {
        question: 'Who can see my page?',
        answer:
          'You control geo-blocking, blocked users, and exactly what public visitors versus paid subscribers are allowed to preview.',
      },
    ] as FaqItem[],
  },

  closingCta: {
    title: 'Your next chapter starts tonight.',
    subtitle: 'Join the next generation of independent creators building sustainable, creator-owned businesses.',
    cta: 'Start creating →',
    exploreCta: 'Explore creators',
    bgImage: '/landing/cta-aurora.webp',
  },

  footer: {
    brand: 'Lumora',
    tagline: 'The creator-owned 18+ platform designed for sustainable independent careers.',
    columns: [
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'Brand', href: '/brand' },
          { label: 'Press', href: '/press' },
        ],
      },
      {
        title: 'Creators',
        links: [
          { label: 'Start Creating', href: '/signup?role=creator' },
          { label: 'Earnings Guide', href: '/creators/guide' },
          { label: 'Live Streaming', href: '/creators/live' },
          { label: 'Creator Academy', href: '/creators/academy' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Help Center', href: '/help' },
          { label: 'Trust & Safety', href: '/safety' },
          { label: 'Community Guidelines', href: '/guidelines' },
          { label: 'Contact Us', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: '18 U.S.C. §2257', href: '/compliance/2257' },
          { label: 'Law Enforcement', href: '/compliance/law' },
        ],
      },
    ] as FooterColumn[],
    complianceNote: '© 2026 Lumora Inc. All rights reserved. 18+ adults only. Compliant with 18 U.S.C. §2257 record-keeping requirements.',
  },
};
