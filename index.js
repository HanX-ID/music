/*

Creator : HanX - ID
Upload : 26 - Juni - 2025

*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const yts = require('yt-search');
const chalk = require('chalk');
const ID3 = require('node-id3');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const musicPath = "/storage/emulated/0/Music";

function ask(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const decrypt = (base64) => {
  const key = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');
  const data = Buffer.from(base64, 'base64');
  const iv = data.slice(0, 16);
  const content = data.slice(16);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decrypted = decipher.update(content);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};

async function run() {
  const query = await ask(chalk.cyanBright('[ ? ] judul lagu: ') + chalk.white(''));
  if (!query) return rl.close();

  console.log(chalk.yellowBright('\n[ ! ] mencari...'));
  const res = await yts.search(query);
  const video = res.videos[0];
  if (!video) {
    console.log(chalk.red('[ X ] tidak ditemukan.'));
    return rl.close();
  }

  const videoId = video.videoId;
  const thumbUrl = video.thumbnail;

  console.log(chalk.blueBright(`[ ✓ ] ${video.title}`));
  console.log(chalk.gray(`      ${video.author.name} • ${video.timestamp}`));

  try {
    const cdnRes = await axios.get("https://media.savetube.me/api/random-cdn");
    const cdn = cdnRes.data.cdn;

    const headers = {
      'accept': '*/*',
      'content-type': 'application/json',
      'origin': 'https://yt.savetube.me',
      'referer': 'https://yt.savetube.me/',
      'user-agent': 'Postify/1.0.0'
    };

    const infoRes = await axios.post(`https://${cdn}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${videoId}`
    }, { headers });

    const result = decrypt(infoRes.data.data);

    const dlRes = await axios.post(`https://${cdn}/download`, {
      id: videoId,
      downloadType: 'audio',
      quality: '128',
      key: result.key
    }, { headers });

    const fileUrl = dlRes.data.data.downloadUrl;
    if (!fileUrl) {
      console.log(chalk.red('[ X ] gagal ambil link.'));
      return rl.close();
    }

    if (!fs.existsSync(musicPath)) fs.mkdirSync(musicPath, { recursive: true });

    const safeName = query.replace(/[<>:"/\\|?*]+/g, '');
    const mp3Path = path.join(musicPath, `${safeName}.mp3`);

    console.log(chalk.cyanBright(`[ ! ] menyimpan: ${mp3Path}`));
    const writer = fs.createWriteStream(mp3Path);
    const response = await axios.get(fileUrl, { responseType: 'stream' });
    response.data.pipe(writer);

    writer.on('finish', async () => {
      const thumbBuffer = (await axios.get(thumbUrl, { responseType: 'arraybuffer' })).data;
      ID3.write({
        title: video.title,
        artist: video.author.name,
        album: 'YouTube',
        APIC: thumbBuffer
      }, mp3Path);

      console.log(chalk.magentaBright('\n[ ✓ ] selesai.\n'));
      const again = await ask(chalk.magentaBright('[ ? ] unduh lagi? [y/n]: '));
      if (again.trim().toLowerCase() === 'y') {
        run();
      } else {
        rl.close();
      }
    });

    writer.on('error', err => {
      console.log(chalk.red('[ X ] gagal simpan file.'));
      rl.close();
    });

  } catch (e) {
    console.log(chalk.red('[ X ] error:'), e.message);
    rl.close();
  }
}

run();
