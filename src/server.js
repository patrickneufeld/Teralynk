const preloadIntegrations = require('./utils/preloadIntegrations');
const authRoutes = require("./api/authRoutes");

app.use("/api/auth", authRoutes);

// Initialize server
preloadIntegrations().then(() => {
  console.log('Integrations preloaded successfully.');
});
