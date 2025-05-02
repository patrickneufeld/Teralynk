module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react'
  ],
  plugins: [
    // Add necessary plugins for improved functionality and compatibility
    '@babel/plugin-transform-runtime', // Helps with async/await and generator functions
    '@babel/plugin-proposal-class-properties', // Allows class properties syntax
    '@babel/plugin-syntax-dynamic-import' // Enables parsing of import()
  ]
};