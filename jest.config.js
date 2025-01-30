module.exports = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Transform JS, JSX, TS, and TSX files
    },
    transformIgnorePatterns: [
        '/node_modules/(?!axios)/' // Ensure axios is transformed correctly by Babel
    ],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Handle CSS imports during testing
    },
};
