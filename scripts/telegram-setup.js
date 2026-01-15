import readline from 'readline';
import https from 'https';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Telegram Bot Setup & Debug Tool ===\n');

  const token = await question('Enter your Telegram Bot Token: ');
  if (!token) {
    console.error('Token is required!');
    process.exit(1);
  }

  // 1. Check Webhook Status
  console.log('\nChecking Webhook Status...');
  try {
    const info = await fetchJson(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    console.log('Webhook Info:', JSON.stringify(info, null, 2));

    if (!info.ok) {
      console.error('Error getting webhook info:', info.description);
    } else if (!info.result.url) {
      console.warn('⚠️  Webhook is NOT set!');
    } else {
      console.log('✅ Webhook is currently set to:', info.result.url);
      if (info.result.last_error_date) {
        console.log('⚠️  Last error date:', new Date(info.result.last_error_date * 1000).toLocaleString());
        console.log('⚠️  Last error message:', info.result.last_error_message);
      }
    }
  } catch (e) {
    console.error('Failed to connect to Telegram API:', e.message);
  }

  // 2. Offer to set Webhook
  const setHook = await question('\nDo you want to set/update the Webhook URL? (y/n): ');
  if (setHook.toLowerCase() === 'y') {
    const workerUrl = await question('Enter your Worker URL (e.g., https://temp-mail.your-subdomain.workers.dev): ');
    if (workerUrl) {
      let cleanUrl = workerUrl.trim();
      if (cleanUrl.endsWith('/')) {cleanUrl = cleanUrl.slice(0, -1);}
      
      const webhookUrl = `${cleanUrl}/telegram/webhook`;
      console.log(`\nSetting webhook to: ${webhookUrl}`);
      
      try {
        const setRes = await fetchJson(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        console.log('Set Webhook Result:', JSON.stringify(setRes, null, 2));
      } catch (e) {
        console.error('Failed to set webhook:', e.message);
      }
    }
  }

  // 3. Check for Pending Updates
  console.log('\n=== Troubleshooting Tips ===');
  console.log('1. If Webhook is set correctly but no response:');
  console.log('   - Check if you set TELEGRAM_CHAT_ID in Cloudflare secrets.');
  console.log('   - If set, ensure it matches YOUR Telegram User ID.');
  console.log('   - If the ID is wrong, the bot will ignore you silently.');
  console.log('   - Try removing TELEGRAM_CHAT_ID secret to allow public access temporarily.');
  
  rl.close();
}

main();
