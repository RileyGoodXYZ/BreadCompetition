# BreadCompetition
 
A monorepo containing a React/Tailwind/Vite frontend and a Python FastAPI backend for scouting and strategy.

## Directory Structure

```
BreadCompetition/
├── frontend/                   # React (Vite)
│   ├── src/
│   │   ├── pages/              # Route components 
│   │   ├── components/         # UI components
│   │   ├── lib/                # State management
│   │   ├── utils/              # Helper functions and utilities
│   │   └── main.jsx            # Main entry point
│
├── backend/                     # Python backend
│   └── app/                     # Main application code
│
├── .github/workflows/           # CI/CD pipelines
```

## Frontend Subfolders

- **`data-scout`**: Data scouting 
- **`picklist`**: Picklist and robot data
- **`match-strategy`**: Match strategy

## Development Workflow

**Frontend**:
- Install dependencies 
   ```bash
   cd frontend && npm run install
   ```
- Preview 
   ```bash
   cd frontend && npm run dev
   ```
- To preview changes on mobile, run `npm run dev -- --host` and enter the network link on your phone

## CI/CD (GitHub Actions workflows)
- **`mirror.yml`**: Mirrors repo to Liheng's personal GitHub
- **`production.yml`**: Runs on Liheng's perosnal GitHub to deploy frontend to Vercel on all pushes