
const threadId = process.argv[2];
const runId = process.argv[3];

import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const retrieveRun = await openai.beta.threads.runs.retrieve(threadId, runId);

console.log(retrieveRun.status);
