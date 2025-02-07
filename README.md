# GhantaPL

A fantasy football auction app with AI-powered team analysis.

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_CLAUDE_API_KEY`: Your Anthropic Claude API key
- `EXPO_PUBLIC_CLAUDE_API_URL`: Claude API URL (default is https://api.anthropic.com/v1)

⚠️ **Important**: Never commit the `.env` file to version control. It contains sensitive API keys and should be kept private.

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

## Features

- Fantasy football auction system
- Team formation builder with drag-and-drop
- AI-powered team analysis using Claude
- Screenshot and share your team
- Auto-placement of players based on position

## Documentation
- For a comprehensive guide on how to use the app, check out our [User Guide](docs/USER_GUIDE.md)
- For technical documentation, continue reading below

## Features

### Auction System
- Real-time auction updates using Supabase
- Live bidding with automatic bid validation
- Auction history and player statistics
- Wallet management for users

## Live Auction Flow

### LiveAuctionScreen Component
The Live Auction screen (`LiveAuctionScreen.tsx`) manages the real-time auction interface with the following features:

- **Real-time Status Display**: Shows auction details, current player, and bidding status
- **Host Controls**: 
  - Start/Pause auction
  - Skip current player
  - End auction
  - Restart completed auctions
- **Bidding Interface**: 
  - Current bid display
  - Bidding controls
  - Timer management
- **Won Players List**: Real-time updates of acquired players
- **Connection Management**: 
  - Automatic reconnection handling
  - Status indicators
  - Error recovery

### Auction Hook (useAuction)
The `useAuction` hook manages the auction's business logic and state:

- **Real-time Sync**:
  - Supabase channel subscriptions for live updates
  - Heartbeat mechanism for connection monitoring
  - Automatic data refresh on changes
- **Bid Management**:
  - Bid validation against user budget
  - Automatic player transitions
  - No-bid counting
- **State Management**:
  - Current player tracking
  - Budget updates
  - Auction statistics
  - Participant management
- **Host Actions**:
  - Auction flow control (start/pause/end)
  - Player skipping logic
  - Winner determination

### Team Management
- Interactive team formation display (442, 433, 352, etc.)
- Drag-and-drop player positioning
- Visual player position indicators (GK, LB, ST, etc.)
- Team history tracking (current, past, pending)

### Player Database
- Comprehensive FIFA player database
- Player ratings and statistics
- Position-based filtering and search
- Price history and trends

## Tech Stack
- React Native / Expo
- TypeScript
- Supabase (PostgreSQL + Real-time)
- React Native Reanimated

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GhantaPL.git
cd GhantaPL
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase credentials
```

4. Start the development server:
```bash
npm start
```

## Database Schema

The app uses the following main tables:
- `players`: FIFA player database
- `auctions`: Active and past auctions
- `rosters`: User teams and formations
- `playing_xi`: Starting lineup configurations

For detailed schema information, check `supabase/migrations/`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
