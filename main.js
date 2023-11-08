
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (str) => new Promise(resolve => rl.question(str, resolve));

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions: "You are a personal math tutor. Write and run code to answer math questions.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4-1106-preview"
  });

const thread = await openai.beta.threads.create();

let prompt = "user> ";

// the chat loop
while (true) {

    const userInput = await question(prompt);

  const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: userInput
    }
  );

  const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

  // the waiting on the response loop
  for (var i=0; i<10; i++)
  {
    const run2 = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );

    await delay(1000);

    console.log('.');

    if (run2.status == 'completed') {
      break;
    }
  }

  const messages = await openai.beta.threads.messages.list(
    thread.id
  );

  const assistantResponse = messages.data[0].content[0].text.value;

  console.log('assistant> ' + assistantResponse);
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 
  