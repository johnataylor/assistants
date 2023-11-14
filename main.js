

import { createInterface } from "readline";

const readlineInterface = createInterface({ input: process.stdin, output: process.stdout });

const question = (str) => new Promise(resolve => readlineInterface.question(str, resolve));
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.create({
  name: "Math Tutor",
  instructions: "You are a personal math tutor. Write and run code to answer math questions.",
  tools: [{ type: "code_interpreter" }],
  model: "gpt-4-1106-preview"
});

const thread = await openai.beta.threads.create();

// the chat loop
while (true) {

  const userInput = await question("user> ");

  const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: userInput
    }
  );

  const createRun = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

  // loop waiting on the response - max iterations being 10 here
  for (var i=0; i<10; i++)
  {
    const retrieveRun = await openai.beta.threads.runs.retrieve(thread.id, createRun.id);

    if (retrieveRun.status == 'completed') {
      break;
    }

    console.log('.');
    await delay(1000);
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  const assistantResponse = messages.data[0].content[0].text.value;

  console.log('assistant> ' + assistantResponse);
}


