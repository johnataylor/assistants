
const threadId = process.argv[2];

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const messages = await openai.beta.threads.messages.list(threadId);

for (var i=0; i<messages.data.length; i++) {
  var message = messages.data[i];
  console.log(message.id + ' ' + message.content[0].text.value);
}
