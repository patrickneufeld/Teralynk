// frontend/src/services/aws/secrets.js

/**
 * Get AWS secrets from environment variables or configuration
 */
export const getAwsSecrets = () => {
    return {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      // Add other secrets as needed
    };
  };
  
  export default getAwsSecrets;