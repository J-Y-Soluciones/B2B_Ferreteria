module.exports = {
  apps: [
    {
      name: "jypos-backend",
      script: "./dist/server.js",
      instances: "max", // Clona un proceso por cada hilo de CPU
      exec_mode: "cluster", // Balanceador de carga interno de Node.js
      autorestart: true,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
