# Badminton Match Generator

A web application that helps generate fair matchups for badminton sessions with multiple players and courts.

## Features

- Add and remove players (4-8 players)
- Support for 1-2 courts
- Generates matches ensuring:
  - Everyone plays with everyone
  - Players get to play on both sides of the court
  - Fair distribution of matches across courts

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Deployment

This project is configured for deployment on Netlify. To deploy:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Netlify will automatically detect the build settings from `netlify.toml`

## Usage

1. Add players by entering their names and clicking "Add" or pressing Enter
2. Select the number of courts (1 or 2)
3. Click "Generate Matches" when you have at least 4 players
4. View the generated matches with court assignments and player positions

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Vite
- Netlify
