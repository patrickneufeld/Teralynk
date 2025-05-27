"use strict";

import path from "path";

function greetUser(name = "Guest") {
    return `Hello, ${name.trim() || "Guest"}! Welcome to TypeScript.`;
}

function logCurrentDirectory() {
    const currentDir = path.resolve(".");
    console.info(`Current directory: ${currentDir}`);
}

function main() {
    const userName = process.argv[2] || "Patrick"; 
    console.log(greetUser(userName));
    logCurrentDirectory();
}

main();
