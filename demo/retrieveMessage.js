
const threadId = process.argv[2];
const messageId = process.argv[3];

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const message = await openai.beta.threads.messages.retrieve(threadId, messageId);

console.log(message.id + ' ' + message.content[0].text.value);
