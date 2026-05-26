This is a React + JavaScript + Vite project. 
- To get started, run: `npm install`
- To preview changes, run `npm run dev`
- To verify build, run `npm run build`

# File structure
- **`.github/workflows/`** – Contains GitHub Actions for CI/CD, including mirroring and production deployment pipelines.

- **`public/`** – Static files, like favicon

- **`src/`** – Main source code directory.
  - **`assets/`** – Images and media
  - **`pages/`** – Top-level route components representing different app screens
  - **`utils/`** – Reusable logic and helpers
  - **`index.css`** – Global CSS styles applied across the app
  - **`main.jsx`** – React main entry point

# Deploy workflow
GitHub Actions is used to ensure everyone can push to main by mirroring onto a personal repository, which is deployed on Vercel. This is done by:
- **`mirror.yml`** – Mirrors the repository to Liheng's personal repository
- **`production.yml`** – Triggers deploy on Vercel