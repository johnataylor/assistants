
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

const message = await openai.beta.threads.messages.create(
  thread.id,
  {
    role: "user",
    content: "I need to solve the equation `3x + 11 = 14`. Can you help me?"
  }
);

const run = await openai.beta.threads.runs.create(
  thread.id,
  { 
    assistant_id: assistant.id,
    instructions: "Please address the user as Jane Doe. The user has a premium account."
  }
);

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

messages.data.forEach (message => {
    console.log(message.role);
    console.log(message.content);
    console.log('------------------------------------------');
});


function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 
