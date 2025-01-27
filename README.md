# GhantaPL - FIFA Player Auction Platform

A mobile app for conducting FIFA player auctions with friends. Built with React Native, Expo, and Supabase.

## Features

### Auction System
- Real-time auction updates using Supabase
- Live bidding with automatic bid validation
- Auction history and player statistics
- Wallet management for users

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
