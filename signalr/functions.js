
import * as  signalR from '@microsoft/signalr';
import { OpenAI } from "openai";

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

const thread = await openai.beta.threads.create();

const message = await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'what is the weather in San Francisco?'
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

await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

function getCurrentWeather(args) {
  console.log('>>> getCurrentWeather');
  return 'sunny';
}

async function retrieveAndAct(threadId, runId, status) {

  // we can always make an inexpensive call to retreive the run status - if we don't believe the event :-)

  const run = await openai.beta.threads.runs.retrieve(threadId, runId);

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

    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs: tool_outputs });
  }
  if (run.status == 'completed') {

    await lastMessage(threadId);
  }
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


