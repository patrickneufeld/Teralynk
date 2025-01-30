// Importing a utility module (example)
import path from "path";

/**
 * A simple function to greet a user.
 * @param name - The name of the user.
 * @returns A greeting message.
 */
function greetUser(name: string): string {
  return `Hello, ${name}! Welcome to TypeScript.`;
}

/**
 * Log the current working directory using Node.js path module.
 */
function logCurrentDirectory(): void {
  const currentDir = path.resolve(".");
  console.log(`Current directory: ${currentDir}`);
}

/**
 * Main execution flow.
 */
function main(): void {
  const userName = "Patrick"; // Example user name
  console.log(greetUser(userName)); // Log the greeting

  logCurrentDirectory(); // Log the current directory
}

// Execute the main function
main();
