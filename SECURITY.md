# DIU MicroJobs — Security & Lockdown Guide

This document outlines the security architecture of the DIU MicroJobs platform and provides instructions for locking down the system in production.

---

## 1. Backend Security Architecture

Our hybrid architecture divides concerns between **Firebase Auth** (identity management) and **MongoDB Atlas** (application database).

```
┌──────────────┐       Authentication Token        ┌──────────────────┐
│  Client      │──────────────────────────────────▶│  Next.js Server  │
│  (Browser)   │                                   │  (API Routes)    │
│              │◀──────────────────────────────────│                  │
└──────────────┘         Verified Data             └──────────────────┘
       │                                                     │
       │ Direct Secure                                       │ Secure Driver
       │ Uploads                                             │ connection
       ▼                                                     ▼
┌──────────────┐                                   ┌──────────────────┐
│   Firebase   │                                   │  MongoDB Atlas   │
│   Storage    │                                   │  Database        │
└──────────────┘                                   └──────────────────┘
```

1. **Token Authentication**: All state-modifying API endpoints (POST, PATCH, DELETE) require a valid Firebase ID Token sent in the `Authorization: Bearer <Token>` header.
2. **Server Verification**: The Next.js API endpoints use `verifyAuth` from `lib/firebase-admin.ts` to decode and verify the cryptographically signed JWT token via the Firebase Admin SDK.
3. **Context Association**: The system verifies the user's corresponding MongoDB record before modifying or creating postings, preventing cross-tenant spoofing.

---

## 2. Firebase Storage Security Rules

To prevent unauthorized file access, overwrites, or massive data uploads, paste the following rules into the **Rules** tab of your **Firebase Storage Console**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Profile pictures: Anyone can read, but only the owner can upload/update/delete
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*'); // Images only
    }
    
    // Portfolio project images
    match /portfolios/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024 // Max 10MB
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Job attachments (contracts, requirements)
    match /attachments/{jobId}/{allPaths=**} {
      // Allow signed-in users to read job attachments
      allow read: if request.auth != null;
      // Allow upload only if authenticated and file size is under 20MB
      allow write: if request.auth != null 
                   && request.resource.size < 20 * 1024 * 1024; // Max 20MB
    }
    
    // Secure chats (attachments sent in messages)
    match /chats/{conversationId}/{allPaths=**} {
      allow read, write: if request.auth != null; // Refined in production to matching conversation participants
    }
  }
}
```

---

## 3. MongoDB Atlas Database Lockdown

For development, setting network access to `0.0.0.0/0` (Allow all IP addresses) is convenient. **For production, lock this down:**

1. Go to your **MongoDB Atlas Console**.
2. Click **Network Access** under *Security* in the left sidebar.
3. **Delete** the `0.0.0.0/0` (Allow Access from Anywhere) entry.
4. Add **specific IP addresses**:
   - Add your local home/development machine IP address.
   - If hosting on **Vercel** or **Render**, add their specific outbound IP ranges (or use Vercel's MongoDB Integration which securely negotiates network paths).

---

## 4. Environment Variables Security

- **Never commit `.env.local` to git**: The project `.gitignore` already contains `.env*` which blocks environment variables files.
- **Service Account JSON Cleanup**: Ensure the downloaded `service-account.json` credential file is deleted or kept in a folder outside of your git workspace repository.
- **Production Variables**: When deploying (e.g., to Vercel), enter the variables from `.env.local` manually in the **Project Settings → Environment Variables** dashboard. Vercel encrypts these secrets at rest.
