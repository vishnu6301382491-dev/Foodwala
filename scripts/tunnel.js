const localtunnel = require('localtunnel');

let tunnelInstance = null;

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 5000, subdomain: 'foodwala-ai-hotline' });
    tunnelInstance = tunnel;
    console.log('TUNNEL_URL=' + tunnel.url);

    tunnel.on('close', () => {
      console.log('[Tunnel] Disconnected, reconnecting in 2s...');
      setTimeout(startTunnel, 2000);
    });

    tunnel.on('error', (err) => {
      console.error('[Tunnel Error]:', err.message);
    });
  } catch (err) {
    console.error('[Tunnel Startup Error]:', err.message);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();

// Keep process alive indefinitely
setInterval(() => {}, 60000);
