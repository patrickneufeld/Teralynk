// File Path: /Users/patrick/Projects/Teralynk/backend/tools/fixAdminCode.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const XAI_ENDPOINT = "https://xai.codefixer.api/v1";  // Replace with actual API endpoint

const filesToFix = {
    adminController: path.join(__dirname, "../src/controllers/adminController.js"),
    adminRoutes: path.join(__dirname, "../src/routes/adminRoutes.js")
};

/**
 * Reads a file and returns its content.
 */
const readFileContent = (filePath) => {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
};

/**
 * Sends code to XAI CodeFixer for automated corrections.
 */
const requestXaiFix = async (code, filename) => {
    try {
        const response = await axios.post(XAI_ENDPOINT, {
            code,
            filename
        });

        if (response.data && response.data.fixedCode) {
            return response.data.fixedCode;
        } else {
            console.error(`XAI CodeFixer returned an invalid response for ${filename}`);
            return null;
        }
    } catch (error) {
        console.error(`Error requesting XAI fix for ${filename}:`, error);
        return null;
    }
};

/**
 * Writes corrected content to the respective file.
 */
const writeFileContent = (filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, "utf-8");
        console.log(`✅ Successfully updated: ${filePath}`);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
    }
};

/**
 * Main function to process both files and fix them using XAI.
 */
const fixAdminFiles = async () => {
    console.log("🔍 Reading files...");
    const adminControllerContent = readFileContent(filesToFix.adminController);
    const adminRoutesContent = readFileContent(filesToFix.adminRoutes);

    if (!adminControllerContent || !adminRoutesContent) {
        console.error("🚨 One or both files could not be read. Exiting...");
        return;
    }

    console.log("🛠 Sending files to XAI CodeFixer...");
    const fixedAdminController = await requestXaiFix(adminControllerContent, "adminController.js");
    const fixedAdminRoutes = await requestXaiFix(adminRoutesContent, "adminRoutes.js");

    if (fixedAdminController) writeFileContent(filesToFix.adminController, fixedAdminController);
    if (fixedAdminRoutes) writeFileContent(filesToFix.adminRoutes, fixedAdminRoutes);

    console.log("✅ Code fixing complete!");
};

// Run the script
fixAdminFiles();
