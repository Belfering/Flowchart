module.exports = {
  apps: [{
    name: 'quantnexus',
    script: 'server/index.mjs',
    interpreter_args: '--max-old-space-size=12000',
    node_args: '--max-old-space-size=12000',
    env: {
      NODE_ENV: 'production',
      PORT: 8787,
      NODE_OPTIONS: '--max-old-space-size=12000',
    },
    // DEPLOY_SECRET should be set in environment, not committed here
  }]
}
