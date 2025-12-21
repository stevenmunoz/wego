/**
 * Deploy Firebase Remote Config template
 *
 * Usage:
 *   npx tsx scripts/deploy-remote-config.ts [project-id]
 *
 * Examples:
 *   npx tsx scripts/deploy-remote-config.ts wego-dev-a5a13
 *   FIREBASE_PROJECT_ID=wego-bac88 npx tsx scripts/deploy-remote-config.ts
 *
 * Authentication (in order of preference):
 *   1. GOOGLE_APPLICATION_CREDENTIALS env var (for CI/CD)
 *   2. Firebase CLI login token (for local dev)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const projectId = process.argv[2] || process.env.FIREBASE_PROJECT_ID || 'wego-dev-a5a13';

// Remote Config template
const template = {
  parameters: {
    // Emergency Kill Switch
    maintenance_mode: {
      defaultValue: { value: 'false' },
      description: 'Emergency kill switch - set to true to show maintenance page',
      valueType: 'BOOLEAN',
    },
    maintenance_title: {
      defaultValue: { value: 'Estamos en mantenimiento' },
      description: 'Title shown on maintenance page',
      valueType: 'STRING',
    },
    maintenance_message: {
      defaultValue: { value: 'Estamos realizando mejoras en la plataforma. Por favor, intenta de nuevo más tarde.' },
      description: 'Message shown on maintenance page',
      valueType: 'STRING',
    },

    // Dynamic Content
    promo_banner_enabled: {
      defaultValue: { value: 'true' },
      description: 'Show promotional banner',
      valueType: 'BOOLEAN',
    },
    promo_banner_text: {
      defaultValue: { value: 'Bienvenido a WeGo - Tu plataforma de transporte seguro' },
      description: 'Promotional banner text',
      valueType: 'STRING',
    },
  },
  conditions: [],
  parameterGroups: {},
};

/**
 * Create a signed JWT for service account authentication
 */
function createServiceAccountJWT(serviceAccount: { client_email: string; private_key: string }): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.remoteconfig',
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Get access token from service account
 */
async function getServiceAccountToken(credentialsPath: string): Promise<string> {
  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const jwt = createServiceAccountJWT(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json() as { access_token?: string; error?: string; error_description?: string };

  if (data.error) {
    throw new Error(`Service account token failed: ${data.error} - ${data.error_description}`);
  }

  return data.access_token!;
}

/**
 * Get access token from Firebase CLI (for local development)
 */
async function getFirebaseCliToken(): Promise<string> {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const refreshToken = config.tokens?.refresh_token;

  if (!refreshToken) {
    throw new Error('No Firebase CLI refresh token found');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json() as { access_token?: string; error?: string };

  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error}`);
  }

  return data.access_token!;
}

/**
 * Get access token (tries service account first, then Firebase CLI)
 */
async function getAccessToken(): Promise<string> {
  // Try GOOGLE_APPLICATION_CREDENTIALS first (CI/CD)
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    console.log('Using service account credentials');
    return getServiceAccountToken(credentialsPath);
  }

  // Fallback to Firebase CLI (local development)
  console.log('Using Firebase CLI credentials');
  return getFirebaseCliToken();
}

async function getCurrentEtag(accessToken: string): Promise<string> {
  const response = await fetch(
    `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 404) {
    return '*';
  }

  const etag = response.headers.get('etag');
  return etag || '*';
}

async function publishTemplate(accessToken: string, etag: string): Promise<void> {
  const response = await fetch(
    `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'If-Match': etag,
      },
      body: JSON.stringify(template),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to publish: ${JSON.stringify(error, null, 2)}`);
  }

  const newEtag = response.headers.get('etag');
  console.log(`New etag: ${newEtag}`);
}

async function main() {
  console.log(`\nDeploying Remote Config to project: ${projectId}`);
  console.log('─'.repeat(50));

  try {
    // Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    // Get current etag
    console.log('Fetching current template...');
    const etag = await getCurrentEtag(accessToken);
    console.log(`Current etag: ${etag}`);

    // Publish template
    console.log('Publishing template...');
    await publishTemplate(accessToken, etag);

    console.log('\nRemote Config deployed successfully!');
    console.log('\nParameters:');
    Object.entries(template.parameters).forEach(([key, param]) => {
      console.log(`  - ${key}: ${param.defaultValue.value || '(empty)'}`);
    });

    console.log(`\nView in Firebase Console:`);
    console.log(`  https://console.firebase.google.com/project/${projectId}/config`);

  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

main();
