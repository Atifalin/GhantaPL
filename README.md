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

4. Run the app
```bash
npm start
```

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
