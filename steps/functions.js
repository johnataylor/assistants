
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.create({
  instructions: "You are a weather bot. Use the provided functions to answer questions.",
  model: "gpt-4-1106-preview",
  tools: [{
    "type": "function",
    "function": {
      "name": "getCurrentWeather",
      "description": "Get the weather in location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string", "description": "The city and state e.g. San Francisco, CA"},
          "unit": {"type": "string", "enum": ["c", "f"]}
        },
        "required": ["location"]
      }
    }
  }]
});
//console.log(JSON.stringify(assistant, null, 2));

const thread = await openai.beta.threads.create();
//console.log(JSON.stringify(thread, null, 2));

const message = await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'what is the weather in San Francisco?'
});
//console.log(JSON.stringify(message, null, 2));

const message2 = await openai.beta.threads.messages.create(thread.id, { role: 'user', content: 'hello' });
//console.log(JSON.stringify(message, null, 2));

let run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });
//console.log(JSON.stringify(run, null, 2));

do {
  console.log(`run status: ${run.status}`);
  console.log('dumpSteps:');
  await dumpSteps(thread.id, run.id);
  await delay(1000);
  run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}
while (run.status != 'completed');

console.log(`run status: ${run.status}`);
console.log('dumpSteps:');
await dumpSteps(thread.id, run.id);

// console.log('last message:');
// await lastMessage(thread.id);

console.log('dumpMessages:');
dumpMessages(thread.id)


async function dumpSteps(threadId, runId) {
  const steps = await openai.beta.threads.runs.steps.list(threadId, runId);

  steps.data.forEach(step => {
    console.log(`  ${step.id} ${step.type} ${step.status} ${step.assistant_id} ${step.run_id}`);
    if (step.type == 'tool_calls') {
      step.step_details.tool_calls.forEach(toolCall => {
        if (toolCall.type == 'function') {
          console.log(`${toolCall.function.name}('${toolCall.function.arguments}') -> ${toolCall.function.output}`);
        }
      });
    }
  });
}

async function lastMessage(threadId) {
  const messages = await openai.beta.threads.messages.list(threadId);
  const text = messages.data[0].content[0].text.value;
  console.log('  ' + text);
}

async function dumpMessages(threadId) {
  const messages = await openai.beta.threads.messages.list(threadId);

  messages.data.forEach(message => {
    console.log('  ' + message.role + ': ' + message.content[0].text.value);
  });
}


// 1) run switches state to requires_action
// 2) tool call step has been added with status in_progress and output undefined
// 3) client calls submitToolOutputs
// 4) step is updated with output and status is changed to completed
// 5) the run switches state to in_progress
// 6) message is created and...
// 6) message creation step is added, status is completed (obviously)
// 7) run is updated to completed

// in (5) runtime creates a prompt that includes existing messages, function call and function response
// this prompt could resemble the 'functions' use of the chat completion API
