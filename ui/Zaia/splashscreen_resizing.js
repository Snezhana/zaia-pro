const sharp = require('sharp');
const fs = require('fs');

const sizes = {
  "mipmap-mdpi": 480,
  "mipmap-hdpi": 720,
  "mipmap-xhdpi": 960,
  "mipmap-xxhdpi": 1440,
  "mipmap-xxxhdpi": 1920
};

const inputFile = "splash.png"; // Your original splash image
const outputDir = "android/app/src/main/res/";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

Object.entries(sizes).forEach(([folder, size]) => {
  const folderPath = `${outputDir}${folder}`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  sharp(inputFile)
    .resize(size, size)
    .toFile(`${folderPath}/splash.png`, (err, info) => {
      if (err) console.error(`Error resizing ${folder}:`, err);
      else console.log(`Created ${folder}/splash.png`);
    });
});
