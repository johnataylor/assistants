
const assistantId = process.argv[2];

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.retrieve(assistantId);

console.log(`${assistant.id} ${assistant.object} ${assistant.name} ${assistant.description} ${assistant.instructions} ${assistant.model}`);

