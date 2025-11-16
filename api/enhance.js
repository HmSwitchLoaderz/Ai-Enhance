import Replicate from "replicate";
import { IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = { api: { bodyParser: false } };

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).send("Form parse error: " + err.message);
    }

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!file) return res.status(400).send("No file uploaded");

    const buffer = fs.readFileSync(file.filepath);

    try {
      const output = await replicate.run(
        "xinntao/realesrgan",
        {
          input: { image: buffer, scale: 2, face_enhance: false }
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) throw new Error("No output from Replicate");

      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(imageBuffer));
    } catch (e) {
      console.error("Enhancement error:", e);
      res.status(500).send("Enhancement failed: " + e.message);
    }
  });
}
