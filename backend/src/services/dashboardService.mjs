// ✅ Get storage usage
export async function getStorageUsage(userId) {
  try {
    // Replace with real DB logic as needed
    return {
      total: 152.7,
      used: 87.3,
      files: 1247,
      folders: 138,
      providers: {
        s3: 46.2,
        gdrive: 29.1,
        dropbox: 12.0
      }
    };
  } catch (err) {
    throw new Error(`getStorageUsage failed: ${err.message}`);
  }
}
