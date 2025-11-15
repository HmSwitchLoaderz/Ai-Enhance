import { IncomingForm } from 'formidable';
import fs from 'fs';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false, // important to handle file uploads
  },
};

export default async function handler(req, res) {
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err);

    const file = files.image;
    const buffer = fs.readFileSync(file.filepath);

    // simple "enhance": upscale x2 + sharpen
    const enhancedBuffer = await sharp(buffer)
      .resize({ width: 800 }) // upscale width
      .sharpen()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(enhancedBuffer);
  });
}
