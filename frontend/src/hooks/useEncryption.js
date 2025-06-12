// ✅ FILE: /frontend/src/hooks/useEncryption.js

import { encryptData, decryptData } from '@/utils/encryption';
import logger from '@/utils/logging/logging';

/**
 * Hook: useEncryption
 * 
 * Provides simplified access to encrypt and decrypt operations using Web Crypto.
 * Handles errors gracefully and logs problems with traceable context.
 *
 * @returns {{
 *   encrypt: (data: any, passphrase?: string) => Promise<string>,
 *   decrypt: (encryptedPackage: string, passphrase?: string) => Promise<any>
 * }}
 */
const useEncryption = () => {
  /**
   * Encrypt arbitrary JSON-serializable data
   */
  const encrypt = async (data, passphrase) => {
    try {
      const result = await encryptData(data, passphrase);
      logger.debug('🔐 Encryption successful');
      return result;
    } catch (error) {
      logger.error('❌ Web Crypto encryption failed:', error);
      throw new Error('Encryption failed');
    }
  };

  /**
   * Decrypt previously encrypted string
   */
  const decrypt = async (encryptedPackage, passphrase) => {
    try {
      const result = await decryptData(encryptedPackage, passphrase);
      logger.debug('🔓 Decryption successful');
      return result;
    } catch (error) {
      logger.error('❌ Web Crypto decryption failed:', error);
      throw new Error('Decryption failed');
    }
  };

  return { encrypt, decrypt };
};

export default useEncryption;
