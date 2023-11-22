
import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistants = await openai.beta.assistants.list();

for (var i=0; i<assistants.data.length; i++) {
  const assistant = assistants.data[i];
  console.log('deleting: ' + assistant.id);
  await openai.beta.assistants.del(assistant.id);
}


