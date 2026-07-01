# DIU MicroJobs & Connected Campus Freelance Network

A premium, modern web application designed for campus freelancing, microjobs, and peer collaboration. The platform connects verified students and faculty across leading universities in Bangladesh (such as DIU, BUET, DU, and NSU) for secure, peer-to-peer deals with zero commission fees.

---

## 🚀 Key Features

### 1. Multi-University Network Isolation
- **Domain-Verified Signups**: Automated validation checks that restrict account creation and logins to registered institutional email domains (e.g., `@diu.edu.bd`, `@buet.ac.bd`, `@nsuedu.bd`).
- **Campus-Scoped Operations**: Complete database separation and query isolation for job postings, proposals, secure contracts, real-time messaging, and in-app notifications based on the user's specific university scope.

### 2. High-Fidelity UI/UX & 3D Interactive Design
- **Spotlight Glow overlays**: Interactive, brand-color-matched glassmorphism overlays that track cursor coordinates at 60fps/120fps with zero-re-renders.
- **3D Perspective Entrance Reveals**: Scroll reveals where elements glide smoothly forward out of 3D depth, rotate slightly, and settle flat into place.
- **Compositor-Layer Spring Lift**: Clean, GPU-accelerated spring transformations on hover for interactive elements to guarantee buttery smooth transitions.

### 3. Comprehensive Contract & Milestone Management
- **Milestone-Based Gigs**: Projects broken down into defined milestones, allowing step-by-step progress tracking, deliverables uploads, and secure payments.
- **Real-Time Client/Freelancer Communication**: Unified chat dashboard with instant messaging, system event notifications, and automatic task assignments.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack support)
- **Language**: TypeScript (Strict Type Safety)
- **Styling**: Vanilla CSS Modules (Glassmorphism & Curated Theme Tokens)
- **Database**: MongoDB (Mongoose Schema Models & Compound Scoping Indexes)
- **Authentication**: Firebase Authentication (Client-side signup & server-side Admin Token Verification middleware)
- **Animations**: Framer Motion (GPU Composited Spring Physics)

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router pages and API handlers
│   ├── (auth)/           # Email validation, Login, and Registration routes
│   ├── (dashboard)/      # User dashboards, profile views, and contract portals
│   ├── admin/            # Central admin dashboard routes
│   └── api/              # MongoDB API endpoint handlers (Jobs, Messages, Users, Admin)
├── components/           # Reusable layout and custom UI components
├── context/              # Global application contexts (e.g., Firebase AuthContext)
├── hooks/                # Custom React hook utilities
├── lib/                  # MongoDB client connection, Firebase Admin SDK, and api-client wrapper
├── models/               # Mongoose schemas (User, Job, Proposal, Contract, Message, University)
├── public/               # Static assets and UI graphics
├── types/                # TypeScript interface declarations
└── package.json          # Dependency scripts and metadata
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **MongoDB**: A running local MongoDB instance or a MongoDB Atlas URI connection
- **Firebase Project**: A Firebase project with Email/Password & Google Sign-In providers enabled

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   cd diu-microjobs
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables. Create a `.env.local` file in the root directory based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```
   Provide your:
   - MongoDB connection URI (`MONGODB_URI`)
   - Firebase Client Credentials (API Key, Auth Domain, Project ID, etc.)
   - Firebase Admin Service Account JSON configuration (`FIREBASE_SERVICE_ACCOUNT_KEY`)

### Development & Build Commands

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your web browser.

- **Build for Production**:
  ```bash
  npm run build
  ```

- **Run Production Server**:
  ```bash
  npm run start
  ```
