# GhantaPL - Expo Authentication Template

A modern authentication template for Expo applications, featuring a complete authentication flow using Supabase.

## Features

- 🔐 Complete authentication flow
  - Sign up with email/password
  - Sign in with email/password
  - Password reset functionality
  - Profile management
- 📱 Modern UI with React Native Elements
- 🎯 TypeScript support
- 📍 Expo Router for file-based routing
- 🔄 Loading states and error handling
- 🎨 Clean and maintainable code structure

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
├── contexts/            # Context providers
├── lib/                # External service setup
└── types/              # TypeScript types
```

## Authentication Flow

1. New users start at the onboarding screen
2. Users can sign up with email/password
3. Existing users can sign in
4. Authenticated users are redirected to the home screen
5. Profile management available in the profile tab
   - View profile information
   - Change password
   - Sign out

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev)
- [Supabase](https://supabase.com)
- [React Native Elements](https://reactnativeelements.com)
