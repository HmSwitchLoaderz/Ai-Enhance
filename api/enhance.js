import Replicate from "replicate";
import { IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = { api: { bodyParser: false } };

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export default async function handler(req, res) {
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if(err) return res.status(500).send("Form parse error");

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const buffer = fs.readFileSync(file.filepath);

    const smoothness = parseFloat(fields.smoothness || 0.5);
    const brightness = parseFloat(fields.brightness || 0);
    const contrast = parseFloat(fields.contrast || 0);

    try {
      // Call Replicate model (example: Real-ESRGAN) with extra params
      const output = await replicate.run(
        "xinntao/realesrgan",
        {
          input: {
            image: buffer,
            scale: 4,
            face_enhance: true,
            // Extra example parameters: you can implement color/brightness adjustment later
          }
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output;
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(imageBuffer));
    } catch(e) {
      console.error("Enhancement error:", e);
      res.status(500).send("Enhancement failed");
    }
  });
}
