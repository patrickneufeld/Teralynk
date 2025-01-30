"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importing a utility module (example)
const path_1 = __importDefault(require("path"));
/**
 * A simple function to greet a user.
 * @param name - The name of the user.
 * @returns A greeting message.
 */
function greetUser(name) {
    return `Hello, ${name}! Welcome to TypeScript.`;
}
/**
 * Log the current working directory using Node.js path module.
 */
function logCurrentDirectory() {
    const currentDir = path_1.default.resolve(".");
    console.log(`Current directory: ${currentDir}`);
}
/**
 * Main execution flow.
 */
function main() {
    const userName = "Patrick"; // Example user name
    console.log(greetUser(userName)); // Log the greeting
    logCurrentDirectory(); // Log the current directory
}
// Execute the main function
main();
