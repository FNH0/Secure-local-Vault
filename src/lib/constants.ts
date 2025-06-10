
export const LOCAL_STORAGE_PASSWORD_HASH_KEY = 'fnh_vault_password_hash';
export const LOCAL_STORAGE_SALT_KEY = 'fnh_vault_salt';
export const LOCAL_STORAGE_FILES_METADATA_KEY = 'fnh_vault_files_metadata';
export const LOCAL_STORAGE_FILE_PREFIX = 'fnh_vault_file_';

// Unique Vault ID
export const LOCAL_STORAGE_VAULT_ID = 'fnh_vault_id';

// WebAuthn constants (now functions to be vaultId-specific)
export const getWebAuthnCredentialIdKey = (vaultId: string): string => `fnh_vault_webauthn_cred_id_${vaultId}`;
export const getWebAuthnUserHandleKey = (vaultId: string): string => `fnh_vault_webauthn_user_handle_${vaultId}`;

// Credentials constants
export const LOCAL_STORAGE_CREDENTIALS_METADATA_KEY = 'fnh_vault_credentials_metadata';
export const LOCAL_STORAGE_CREDENTIAL_CONTENT_PREFIX = 'fnh_vault_credential_content_';

