
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

let run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });
//console.log(JSON.stringify(run, null, 2));

do {
  console.log(`run status: ${run.status}`);
  console.log('dumpSteps:');
  await dumpSteps(thread.id, run.id);
  await delay(1000);

  run = await openai.beta.threads.runs.retrieve(thread.id, run.id);

  if (run.status == 'requires_action') {

    const tool_outputs = [];
    run.required_action.submit_tool_outputs.tool_calls.forEach(toolCall => {
      const toolCallId = toolCall.id;
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      if (name == 'getCurrentWeather') {
        const output = getCurrentWeather(args);
        tool_outputs.push({ tool_call_id: toolCallId, output: output });
      }
    });

    await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs: tool_outputs });
  }
}
while (run.status != 'completed');

console.log(`run status: ${run.status}`);
console.log('dumpSteps:');
await dumpSteps(thread.id, run.id);

// console.log('last message:');
// await lastMessage(thread.id);

console.log('dumpMessages:');
await dumpMessages(thread.id)

// clean up 
await openai.beta.threads.del(thread.id);
await openai.beta.assistants.del(assistant.id);

function getCurrentWeather(args) {
  console.log('>>> getCurrentWeather');
  return 'sunny';
}

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


