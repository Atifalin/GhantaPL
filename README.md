# GhantaPL

A FIFA auction platform built with React Native and Supabase.

## Features

- 🎮 Real-time auction system
- 👥 Player management
- 🔄 Live updates and notifications
- 🌓 Dark mode support
- 🔒 Secure authentication

## Recent Updates

### January 26, 2025
- Fixed auction creation UI and functionality
- Added proper modal presentation for create auction screen
- Implemented toast notifications for better user feedback
- Added real-time updates for auctions
- Fixed safe area issues across all screens

## Development

### Prerequisites
- Node.js
- Expo CLI
- Supabase account

### Setup
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
```bash
cp .env.example .env
```
Update the `.env` file with your Supabase credentials.

4. Run database migrations
```bash
supabase db push
```

5. Run the app
```bash
npm start
```

## Database Migrations

All migrations are stored in `supabase/migrations/`. Here's a list of available migrations in order:

### Core Schema
1. `20250126_001_initial_schema.sql`
   - Creates initial tables (users, profiles, players)
   - Sets up basic relationships
   - Adds essential indexes

2. `20250126_002_add_auction_tables.sql`
   - Creates auctions and auction_participants tables
   - Adds foreign key relationships
   - Sets up auction status enum

### Security and Access Control
3. `20250126_003_setup_rls.sql`
   - Enables Row Level Security (RLS)
   - Sets up basic access policies
   - Configures user-based permissions

4. `20250126_004_add_delete_policies.sql`
   - Adds deletion policies for auctions
   - Sets up cascade delete behavior
   - Updates RLS for deletion

### Real-time Features
5. `20250126_005_enable_realtime.sql`
   - Enables real-time functionality
   - Configures publication for relevant tables
   - Sets up change notification triggers

### Auction System Enhancements
6. `20250126_006_add_auction_functions.sql`
   - Adds stored procedures for auction operations
   - Creates triggers for auction state management
   - Sets up auction cleanup functions

7. `20250126_007_add_auto_start.sql`
   - Adds auto_start column to auctions
   - Updates RLS policies
   - Modifies host_id constraints

To apply migrations:
1. Make sure you have Supabase CLI installed
2. Run `supabase db reset` for a fresh start
3. Or run `supabase db push` to apply new migrations

### Migration Notes
- Always backup your database before running migrations
- Migrations are applied in order based on the timestamp prefix
- Test migrations in a development environment first
- Some migrations may require manual data cleanup

## TODOs and Known Issues

### High Priority
- [ ] Fix error handling in notifications system
- [ ] Improve real-time subscription cleanup in auctions page
- [ ] Add proper error boundaries for better error handling
- [ ] Implement proper loading states for auction operations

### Future Improvements
- [ ] Add auction history
- [ ] Implement player statistics
- [ ] Add team management features
- [ ] Improve UI/UX for auction bidding

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
