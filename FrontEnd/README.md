# HomeRent Frontend

HomeRent is a social media application built with React and Vite.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Context API** - State management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

Production build will be created in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
FrontEnd/
├── src/
│   ├── pages/        # Page components (Home, Login, Register)
│   ├── context/      # Context providers (AuthContext)
│   ├── utils/        # Utility functions (API client)
│   ├── styles/       # CSS stylesheets
│   └── assets/       # Static assets
├── public/           # Public assets
└── dist/             # Production build output
```

## Environment Variables

Create a `.env.production` file for production builds:

```env
VITE_API_URL=https://your-backend-url.com/api
```

For development, the API URL defaults to `http://localhost:5000/api`.
