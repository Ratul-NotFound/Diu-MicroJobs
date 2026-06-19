import { initializeApp, cert, getApps, getApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminAuthInstance: ReturnType<typeof getAuth> | null = null;

function getAdminAuth() {
  if (adminAuthInstance) return adminAuthInstance;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment variables (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) must be defined');
  }

  let formattedPrivateKey = privateKey;
  if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
  } else if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
    formattedPrivateKey = formattedPrivateKey.slice(1, -1);
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: formattedPrivateKey.replace(/\\n/g, '\n'),
  };

  const adminApp = getApps().length > 0 ? getApp() : initializeApp({ credential: cert(serviceAccount) });
  adminAuthInstance = getAuth(adminApp);
  return adminAuthInstance;
}

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(target, prop, receiver) {
    const auth = getAdminAuth();
    const value = Reflect.get(auth, prop, receiver);
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

/**
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token with uid and email.
 */
export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
