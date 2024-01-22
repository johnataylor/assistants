
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.create({
  instructions: `You are a knowledgable jazz expert and can answer questions about a whole range of jazz artists and recordings. Only use the  uploaded files to answer question otherwise say "I don't know."`,
  model: "gpt-4-1106-preview",
  tools: [{
    "type": "retrieval"
  }]
});

const thread = await openai.beta.threads.create();

const message = await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'where was Tord Gustavsen born?'
});

let run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

do {
  console.log(`run status: ${run.status}`);
  await delay(1000);
  run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  if (run.status == 'requires_action') {
    console.log(`didn't expect requires action!`);
  }
}
while (run.status != 'completed');

console.log(`run status: ${run.status}`);

await dumpMessages(thread.id)

// clean up 
await openai.beta.threads.del(thread.id);
await openai.beta.assistants.del(assistant.id);

async function dumpMessages(threadId) {
  const messages = await openai.beta.threads.messages.list(threadId);

  messages.data.forEach(message => {
    console.log('  ' + message.role + ': ' + message.content[0].text.value);
  });
}


