
const threadId = process.argv[2];
const assistantId = process.argv[3];

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const run = await openai.beta.threads.runs.create(
  threadId,
  {
    assistant_id: assistantId
  }
);

console.log(run.id);
