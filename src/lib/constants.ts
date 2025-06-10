
// Key for storing the username of the currently active/logged-in user
export const ACTIVE_USERNAME_KEY = 'fnh_vault_active_username';

// --- User-Specific Data Keys (Scoped by Username) ---
// These keys store information directly tied to a user's login identity.

// Stores the hash of the user's master password.
export const getPasswordHashKey = (username: string): string => `fnh_vault_user_${username}_password_hash`;

// Stores the salt used for hashing the user's master password.
export const getSaltKey = (username: string): string => `fnh_vault_user_${username}_salt`;

// Stores the unique ID for this specific user's vault. This vaultId is then used to scope all their actual data.
export const getVaultIdKey = (username: string): string => `fnh_vault_user_${username}_vault_id`;


// --- Vault-Specific Data Keys (Scoped by Vault ID) ---
// These keys store the actual encrypted data and metadata, namespaced by the vaultId associated with a user.

// Stores the metadata for all files in a specific vault.
export const getFilesMetadataKey = (vaultId: string): string => `fnh_vault_${vaultId}_files_metadata`;

// Prefix for storing the encrypted content of individual files in a specific vault.
export const getFileKeyPrefix = (vaultId: string): string => `fnh_vault_${vaultId}_file_`;

// Stores the WebAuthn (biometric) credential ID for a specific vault.
export const getWebAuthnCredentialIdKey = (vaultId: string): string => `fnh_vault_${vaultId}_webauthn_cred_id`;

// Stores the WebAuthn (biometric) user handle for a specific vault.
export const getWebAuthnUserHandleKey = (vaultId: string): string => `fnh_vault_${vaultId}_webauthn_user_handle`;

// Stores the metadata for all credentials (passwords, API keys, etc.) in a specific vault.
export const getCredentialsMetadataKey = (vaultId: string): string => `fnh_vault_${vaultId}_credentials_metadata`;

// Prefix for storing the encrypted content of individual credentials in a specific vault.
export const getCredentialContentPrefix = (vaultId: string): string => `fnh_vault_${vaultId}_credential_content_`;
