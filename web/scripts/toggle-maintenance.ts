/**
 * Toggle Firebase Remote Config maintenance mode
 *
 * Usage:
 *   npx tsx scripts/toggle-maintenance.ts <on|off> [project-id]
 *
 * Examples:
 *   npx tsx scripts/toggle-maintenance.ts on wego-dev-a5a13
 *   npx tsx scripts/toggle-maintenance.ts off wego-bac88
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const action = process.argv[2]?.toLowerCase();
const projectId = process.argv[3] || process.env.FIREBASE_PROJECT_ID || 'wego-dev-a5a13';

if (!action || !['on', 'off'].includes(action)) {
  console.error('Usage: npx tsx scripts/toggle-maintenance.ts <on|off> [project-id]');
  process.exit(1);
}

const maintenanceMode = action === 'on';

/**
 * Create a signed JWT for service account authentication
 */
function createServiceAccountJWT(serviceAccount: { client_email: string; private_key: string }): string {
  const header = { alg: 'RS256', typ: 'JWT' };
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
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    return getServiceAccountToken(credentialsPath);
  }
  return getFirebaseCliToken();
}

interface RemoteConfigTemplate {
  parameters: Record<string, {
    defaultValue: { value: string };
    description?: string;
    valueType?: string;
  }>;
  conditions: unknown[];
  parameterGroups: Record<string, unknown>;
}

// Default template with all required parameters
const DEFAULT_TEMPLATE: RemoteConfigTemplate = {
  parameters: {
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
    promo_banner_enabled: {
      defaultValue: { value: 'false' },
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

async function getCurrentTemplate(accessToken: string): Promise<{ template: RemoteConfigTemplate; etag: string }> {
  const response = await fetch(
    `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const etag = response.headers.get('etag') || '*';

  // If no template exists or it's empty, return default template
  if (response.status === 404) {
    console.log('No existing Remote Config template found, creating new one...');
    return { template: { ...DEFAULT_TEMPLATE }, etag };
  }

  const template = await response.json() as RemoteConfigTemplate;

  // If template has no parameters, use defaults
  if (!template.parameters || Object.keys(template.parameters).length === 0) {
    console.log('Remote Config template is empty, using defaults...');
    return { template: { ...DEFAULT_TEMPLATE }, etag };
  }

  // Ensure maintenance_mode parameter exists
  if (!template.parameters.maintenance_mode) {
    console.log('maintenance_mode parameter missing, adding it...');
    template.parameters.maintenance_mode = DEFAULT_TEMPLATE.parameters.maintenance_mode;
  }

  return { template, etag };
}

async function updateTemplate(accessToken: string, template: RemoteConfigTemplate, etag: string): Promise<void> {
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
    throw new Error(`Failed to update: ${JSON.stringify(error, null, 2)}`);
  }
}

async function main() {
  const emoji = maintenanceMode ? '🔧' : '✅';
  const status = maintenanceMode ? 'ON' : 'OFF';

  console.log(`\n${emoji} Turning maintenance mode ${status} for project: ${projectId}`);
  console.log('─'.repeat(50));

  try {
    const accessToken = await getAccessToken();

    // Get current template
    const { template, etag } = await getCurrentTemplate(accessToken);

    // Update maintenance_mode parameter (guaranteed to exist from getCurrentTemplate)
    template.parameters.maintenance_mode.defaultValue.value = maintenanceMode.toString();

    // Publish updated template
    await updateTemplate(accessToken, template, etag);

    console.log(`\n${emoji} Maintenance mode is now ${status}`);
    console.log(`\nView in Firebase Console:`);
    console.log(`  https://console.firebase.google.com/project/${projectId}/config`);

  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

main();
