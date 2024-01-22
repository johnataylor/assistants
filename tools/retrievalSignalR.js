
import * as  signalR from '@microsoft/signalr';
import { OpenAI } from "openai";

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

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:3000/notificationhub")
    .configureLogging(signalR.LogLevel.Information)
    .build();

async function start() {
    try {
        await connection.start();
        console.log("SignalR Connected.");
    } catch (err) {
        console.log(err);
        setTimeout(start, 5000);
    }
};

connection.onclose(async () => {
    await start();
});

connection.on('notification', async (notification) => {
  console.log(`>>> notification: ${notification.thread_id} ${notification.run_id} ${notification.status}`);
  await retrieveAndAct(notification.thread_id, notification.run_id, notification.status);
});

// Start the connection.
await start();

// Start the run
var run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

console.log(`run status: ${run.status}`)

async function retrieveAndAct(threadId, runId, status) {
  const run = await openai.beta.threads.runs.retrieve(threadId, runId);
  if (run.status == 'requires_action') {
    console.log(`didn't expect requires action!`);
  }
  if (run.status == 'completed') {
    const messages = await openai.beta.threads.messages.list(threadId);
    messages.data.forEach(message => {
      console.log('  ' + message.role + ': ' + message.content[0].text.value);
    });
  }
}
