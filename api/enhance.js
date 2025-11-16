import Replicate from "replicate";
import { IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

export default async function handler(req, res) {
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send("Error parsing form");

    const imageFile = files.image;
    const buffer = fs.readFileSync(imageFile.filepath);

    try {
      // Call Replicate model (Real-ESRGAN)
      const output = await replicate.run(
        "xinntao/realesrgan", // Real-ESRGAN model
        {
          input: {
            image: buffer,
            scale: 4,
            face_enhance: true
          }
        }
      );

      // output is URL (or array)
      const imageUrl = Array.isArray(output) ? output[0] : output;

      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(imageBuffer));
    } catch (e) {
      console.error(e);
      res.status(500).send("AI enhancement failed");
    }
  });
}
