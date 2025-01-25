# GhantaPL - FIFA Auction Platform

A modern FIFA player auction platform built with Expo and Supabase, featuring a complete player management system and auction functionality.

## Features

- 🎮 Complete Player Management
  - Browse players with compact, interactive cards
  - Filter by tier (Elite, Gold, Silver, Bronze)
  - Filter by position (ATT, MID, DEF, GK)
  - Sort by various attributes (OVR, Pace, Shot, etc.)
  - Search players by name, team, or nation
  - 3D Touch support for detailed player stats
- 🔐 Authentication System
  - Sign up with email/password
  - Sign in with email/password
  - Password reset functionality
  - Profile management
- 📱 Modern UI with React Native
- 🎯 TypeScript support
- 📍 Expo Router for file-based routing
- 🔄 Loading states and error handling
- 🎨 Clean and maintainable code structure

## Player Features

### Player Cards
- Compact view showing essential info
- Long press to expand and view detailed stats
- Interactive 3D Touch feedback
- Color-coded tiers:
  - ⭐️ Elite (88+ OVR)
  - 🥇 Gold (83-87 OVR)
  - 🥈 Silver (79-82 OVR)
  - 🥉 Bronze (<79 OVR)

### Filtering System
- Position-based filters:
  - ⚔️ ATT (Attackers)
  - 🎯 MID (Midfielders)
  - 🛡️ DEF (Defenders)
  - 🧤 GK (Goalkeepers)
- Tier-based filters
- Search functionality
- Multiple sorting options

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/Atifalin/GhantaPL.git
   cd GhantaPL
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Start the development server
   ```bash
   npx expo start
   ```

## Project Structure

```
GhantaPL/
├── app/
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main app tabs
│   └── _layout.tsx       # Root layout
├── components/           # Reusable components
│   ├── PlayerCard.tsx    # Interactive player card component
│   └── ...              # Other components
├── contexts/            # Context providers
├── lib/                # External service setup
└── types/              # TypeScript types
```

## Database Schema

The project uses Supabase with the following main tables:
- `players`: Stores player information and stats
- `users`: Manages user accounts
- `profiles`: Stores user preferences and settings

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev)
- [Supabase](https://supabase.com)
- [React Native](https://reactnative.dev)
