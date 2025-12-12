
export const APP_CONFIG = {
  name: 'Roast Live',
  version: '1.0.0',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.roastlive.com',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://ws.roastlive.com',
};

export const STREAM_CONFIG = {
  maxDuration: 4 * 60 * 60 * 1000, // 4 hours
  minViewersForTrending: 100,
  maxTitleLength: 100,
  maxDescriptionLength: 500,
};

export const CHAT_CONFIG = {
  maxMessageLength: 500,
  messageLoadLimit: 50,
  typingIndicatorTimeout: 3000,
};

export const COIN_PACKAGES = [
  { id: '1', coins: 100, price: 0.99, bonus: 0 },
  { id: '2', coins: 500, price: 4.99, bonus: 50 },
  { id: '3', coins: 1000, price: 9.99, bonus: 150 },
  { id: '4', coins: 5000, price: 49.99, bonus: 1000 },
  { id: '5', coins: 10000, price: 99.99, bonus: 2500 },
];

export const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    features: [
      'Ad-free viewing',
      'Custom emotes',
      'Chat badges',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    features: [
      'All Basic features',
      'Priority chat',
      'Exclusive content',
      'Monthly coins bonus',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 24.99,
    features: [
      'All Premium features',
      'VIP badge',
      'Private streams access',
      'Direct messaging',
      'Double coins bonus',
    ],
  },
];
