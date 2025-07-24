const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const yts = require('yt-search');
const chalk = require('chalk');
const ID3 = require('node-id3').Promise;
const readline = require('readline');

const MUSIC_PATH = '/storage/emulated/0/Music';
const ENCRYPTION_KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(chalk.cyan(query), resolve));

const decrypt = (base64) => {
  const data = Buffer.from(base64, 'base64');
  const iv = data.slice(0, 16);
  const content = data.slice(16);
  const decipher = crypto.createDecipheriv('aes-128-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(content);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};

const downloadSong = async (query) => {
  try {
    const res = await yts.search(query);
    const video = res.videos[0];
    if (!video) {
      console.log(chalk.red('Song not found.'));
      return false;
    }

    console.log(chalk.cyan(`Found: ${video.title}`));

    const headers = {
      accept: '*/*',
      'content-type': 'application/json',
      origin: 'https://yt.savetube.me',
      referer: 'https://yt.savetube.me/',
      'user-agent': 'Postify/1.0.0',
    };

    const cdnRes = await axios.get('https://media.savetube.me/api/random-cdn');
    const cdn = cdnRes.data.cdn;

    const infoRes = await axios.post(
      `https://${cdn}/v2/info`,
      { url: `https://www.youtube.com/watch?v=${video.videoId}` },
      { headers }
    );

    const result = decrypt(infoRes.data.data);

    const dlRes = await axios.post(
      `https://${cdn}/download`,
      { id: video.videoId, downloadType: 'audio', quality: '128', key: result.key },
      { headers }
    );

    const fileUrl = dlRes.data.data.downloadUrl;
    if (!fileUrl) {
      console.log(chalk.red('Failed to get download link.'));
      return false;
    }

    const safeName = query.replace(/[<>:"/\\|?*]+/g, '');
    const mp3Path = path.join(MUSIC_PATH, `${safeName}.mp3`);

    await fs.mkdir(MUSIC_PATH, { recursive: true });
    const response = await axios.get(fileUrl, { responseType: 'stream' });
    await fs.writeFile(mp3Path, response.data);

    const thumbBuffer = (await axios.get(video.thumbnail, { responseType: 'arraybuffer' })).data;
    await ID3.write(
      { title: video.title, artist: video.author.name, album: 'YouTube', APIC: thumbBuffer },
      mp3Path
    );

    console.log(chalk.cyan(`Saved to ${mp3Path}`));
    return true;
  } catch (error) {
    console.log(chalk.red('Error:', error.message));
    return false;
  }
};

const run = async () => {
  while (true) {
    const query = await ask('Song title: ');
    if (!query) break;

    const success = await downloadSong(query);
    if (!success) break;

    const again = await ask('Download another? [y/n]: ');
    if (again.trim().toLowerCase() !== 'y') break;
  }
  rl.close();
};

run();
