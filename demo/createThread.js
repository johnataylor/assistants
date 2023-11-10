
import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const thread = await openai.beta.threads.create();

console.log(thread.id);
