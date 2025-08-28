declare const gapi: any;
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            function initTokenClient(config: TokenClientConfig): TokenClient;
            function revoke(token: string, done: () => void): void;
            interface TokenClient {
                requestAccessToken: (overrideConfig?: object) => void;
            }
            interface TokenClientConfig {
                client_id: string | undefined;
                scope: string;
                callback: (response: TokenResponse) => void;
            }
            interface TokenResponse {
                access_token: string;
                error?: any;
            }
        }
    }
}

// This service handles all interactions with Google Drive for backup and restore.

// The Google Client ID should be set in the environment variables.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILE_NAME = 'royaye-shirin-backup.json';

export const isAvailable = !!CLIENT_ID;

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiLoaded = false;
let gisInited = false;
let onAuthChangeCallback: (isSignedIn: boolean) => void = () => {};

/**
 * Loads the GAPI client and initializes it.
 */
function loadGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') return reject(new Error("gapi not loaded"));
        gapi.load('client', () => {
            gapi.client.init({}).then(() => {
                gapiLoaded = true;
                resolve();
            }).catch(reject);
        });
    });
}

/**
 * Initializes the Google Identity Services client.
 */
function initializeGis(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof google === 'undefined') return reject(new Error("google not loaded"));
        if (!CLIENT_ID) return reject(new Error("Google Client ID not configured."));

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (resp: google.accounts.oauth2.TokenResponse) => {
                if (resp.error !== undefined) {
                    console.error('Google token error:', resp);
                    return;
                }
                gapi.client.setToken({ access_token: resp.access_token });
                onAuthChangeCallback(true);
            },
        });
        gisInited = true;
        resolve();
    });
}

/**
 * Initializes the entire Google Drive service.
 * @param onAuthChange - A callback function to be called when auth state changes.
 */
export async function initClient(onAuthChange: (isSignedIn: boolean) => void) {
    if (!isAvailable) {
        console.warn("Google Client ID not configured. Google Drive sync is disabled.");
        return;
    }
    onAuthChangeCallback = onAuthChange;
    try {
        await Promise.all([loadGapiClient(), initializeGis()]);
    } catch (error) {
        console.error("Error initializing Google services:", error);
    }
}

/**
 * Prompts the user to sign in and authorize the app.
 */
export function signIn() {
    if (!isAvailable || !tokenClient) {
        console.error("Google Drive service not available or token client not initialized.");
        return;
    }
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 * Signs the user out.
 */
export function signOut() {
    if (!isAvailable) return;
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            onAuthChangeCallback(false);
        });
    }
}

/**
 * Finds the backup file in the appDataFolder.
 * @returns The file ID if found, otherwise null.
 */
async function findBackupFile(): Promise<string | null> {
    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            q: `name='${BACKUP_FILE_NAME}'`,
        });
        const files = response.result.files;
        return files && files.length > 0 ? files[0].id! : null;
    } catch (error) {
        console.error("Error finding backup file:", error);
        return null;
    }
}

/**
 * Uploads or updates the backup file in the appDataFolder.
 * @param content - The JSON string content to be saved.
 */
export async function uploadBackup(content: string): Promise<boolean> {
    if (!isAvailable) return false;
    const fileId = await findBackupFile();
    const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
        parents: fileId ? undefined : ['appDataFolder'],
    };

    const blob = new Blob([content], { type: 'application/json' });
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const uploadPath = fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files';
    const method = fileId ? 'PATCH' : 'POST';

    try {
        await gapi.client.request({
            path: uploadPath,
            method: method,
            params: { uploadType: 'multipart' },
            body: formData,
        });
        return true;
    } catch (error) {
        console.error("Error uploading backup:", error);
        return false;
    }
}

/**
 * Downloads the backup file content from the appDataFolder.
 * @returns The file content as a string, or null if not found or an error occurs.
 */
export async function restoreBackup(): Promise<string | null> {
    if (!isAvailable) return null;
    const fileId = await findBackupFile();
    if (!fileId) {
        return null;
    }
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return response.body;
    } catch (error) {
        console.error("Error restoring backup:", error);
        return null;
    }
}

/**
 * Gets the user's profile information.
 */
export async function getUserProfile() {
    if (!isAvailable) return null;
    try {
        const response = await gapi.client.oauth2.userinfo.get();
        return response.result;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}
