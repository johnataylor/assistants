
const assistantId = process.argv[2];
const threadId = process.argv[3];
const userInput = process.argv[4];

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const message = await openai.beta.threads.messages.create(
  threadId,
  {
    role: "user",
    content: userInput
  }
);

const createRun = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });

console.log('runId = ' + createRun.id);
