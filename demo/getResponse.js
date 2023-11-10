
const threadId = process.argv[2];

import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const messages = await openai.beta.threads.messages.list(threadId);
const assistantResponse = messages.data[0].content[0].text.value;

console.log(assistantResponse);