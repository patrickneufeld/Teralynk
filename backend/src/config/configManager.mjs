// /Users/patrick/Projects/Teralynk/backend/src/config/configManager.js

export class ConfigManager {
    static instance = null;
  
    constructor() {
      if (ConfigManager.instance) {
        return ConfigManager.instance;
      }
      
      // Initialize configuration settings
      this.config = {
        // Add your default configuration values here
      };
      
      ConfigManager.instance = this;
    }
  
    // Static method to get the singleton instance
    static getInstance() {
      if (!ConfigManager.instance) {
        ConfigManager.instance = new ConfigManager();
      }
      return ConfigManager.instance;
    }
  
    // Method to get configuration values
    get(key) {
      return this.config[key];
    }
  
    // Method to set configuration values
    set(key, value) {
      this.config[key] = value;
    }
  
    // Method to load configuration from environment variables or file
    loadConfig() {
      try {
        // Add logic to load configuration from environment variables or config file
        // Example:
        this.config = {
          ...this.config,
          // Add environment-specific configurations
          NODE_ENV: process.env.NODE_ENV || 'development',
          PORT: process.env.PORT || 3000,
          // Add other configuration values
        };
      } catch (error) {
        throw new Error(`Failed to load configuration: ${error.message}`);
      }
    }
  }