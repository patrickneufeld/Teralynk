import { getStorageClient } from "../config/storageConfig.js";  // Correctly importing storage configuration

// Function to analyze the content of a file in the given storage provider
const analyzeFileContent = async (provider, fileName) => {
  try {
    // Get the storage client based on the provider (e.g., S3, GoogleDrive, Dropbox)
    const storageClient = getStorageClient(provider);
    console.log(`Analyzing file: ${fileName} on provider: ${provider}`);
    
    // Simulate file analysis (this is a placeholder for actual logic)
    const analysisResult = {
      provider,
      fileName,
      analysis: "File analysis successful",
    };
    
    console.log(`File analysis complete:`, analysisResult);

    // Return the analysis result
    return analysisResult;
  } catch (error) {
    console.error("❌ Error analyzing file content:", error.message);
    return null;
  }
};

// Function to auto-organize files based on user preferences
const autoOrganizeFiles = async (userId) => {
  try {
    console.log(`Organizing files for user: ${userId}`);

    const organizationResult = {
      userId,
      organizedFiles: ["file1", "file2", "file3"],  // This is an example result
    };

    console.log(`Files organized successfully:`, organizationResult);

    return organizationResult; // Return the organization result
  } catch (error) {
    console.error("❌ Error organizing files:", error.message);
    return null;
  }
};

// Function to register a new storage provider (dynamically add new storage options)
const registerNewStorageProvider = async (providerName, apiUrl, credentials) => {
  try {
    console.log(`Registering new storage provider: ${providerName}`);

    const newProvider = {
      providerName,
      apiUrl,
      credentials,
    };

    console.log(`New storage provider registered: ${JSON.stringify(newProvider)}`);
    
    return newProvider; // Return the newly registered provider information
  } catch (error) {
    console.error("❌ Error registering new storage provider:", error.message);
    return null;
  }
};

// Function to delete a file from a provider
const deleteFile = async (userId, fileName, provider) => {
  try {
    const storageClient = getStorageClient(provider);

    console.log(`Deleting file: ${fileName} from provider: ${provider}`);
    
    const deleteResult = await storageClient.client.send({
      Bucket: storageClient.bucket,
      Key: `users/${userId}/${fileName}`,
    });

    console.log(`File '${fileName}' deleted successfully from ${provider}`);
    
    return { success: true, deleteResult };
  } catch (error) {
    console.error("❌ Error deleting file:", error.message);
    return { success: false };
  }
};

// Function to get user-specific files across all providers
const getUserFiles = async (userId) => {
  try {
    console.log(`Fetching files for user: ${userId}`);

    const userFiles = [];
    
    for (const provider of ["s3", "googleDrive", "dropbox"]) {
      const storageClient = getStorageClient(provider);
      const files = await storageClient.client.send({
        Bucket: storageClient.bucket,
        Key: `users/${userId}/`,
      });
      userFiles.push(...files); // Aggregate files from all providers
    }

    console.log(`Fetched files for user ${userId}:`, userFiles);
    return userFiles;
  } catch (error) {
    console.error("❌ Error fetching user files:", error.message);
    return [];
  }
};

// Function to list all available storage providers
const listAvailableProviders = () => {
  try {
    console.log("Listing available storage providers...");

    const availableProviders = ["s3", "googleDrive", "dropbox"];
    
    console.log(`Available storage providers:`, availableProviders);
    return availableProviders; 
  } catch (error) {
    console.error("❌ Error listing storage providers:", error.message);
    return [];
  }
};

// Function to monitor usage of each provider
const monitorStorageUsage = async () => {
  try {
    console.log("Monitoring storage usage across providers...");

    const providerUsageStats = [];

    for (const provider of ["s3", "googleDrive", "dropbox"]) {
      const storageClient = getStorageClient(provider);
      
      const usageStats = await storageClient.client.send({
        Bucket: storageClient.bucket,
      });

      providerUsageStats.push({ provider, stats: usageStats });
    }

    console.log("Storage usage stats:", providerUsageStats);
    return providerUsageStats; 
  } catch (error) {
    console.error("❌ Error monitoring storage usage:", error.message);
    return [];
  }
};

// Export all functions to be used in other files
// Ensure that `monitorStorageUsage` is exported only once
export { 
  analyzeFileContent,
  autoOrganizeFiles,
  registerNewStorageProvider,
  deleteFile,
  getUserFiles,
  listAvailableProviders,
  monitorStorageUsage
};
