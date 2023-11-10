
const assistantId = process.argv[2];
const threadId = process.argv[3];
const userInput = process.argv[4];

import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const message = await openai.beta.threads.messages.create(
  threadId,
  {
    role: "user",
    content: userInput
  }
);

const createRun = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });

console.log('runId = ' + createRun.id);
