

import { createInterface } from "readline";

const readlineInterface = createInterface({ input: process.stdin, output: process.stdout });

const question = (str) => new Promise(resolve => readlineInterface.question(str, resolve));
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
  }, {
    "type": "function",
    "function": {
      "name": "getNickname",
      "description": "Get the nickname of a city",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string", "description": "The city and state e.g. San Francisco, CA"},
        },
        "required": ["location"]
      }
    }
  }]
});

const thread = await openai.beta.threads.create();

// the chat loop
while (true) {

  const userInput = await question("user> ");

  if (userInput.trim() === '') {
    continue;
  }

  if (userInput.trim() === 'exit') {
    console.log('bye');
    break;
  }

  const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: userInput
    }
  );

  const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

  // loop waiting on the response - max iterations being 10 here
  for (var i=0; i<10; i++)
  {
    const retrieveRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    console.log(`...(${retrieveRun.status})`);

    if (retrieveRun.status == 'completed') {
      break;
    }

    if (retrieveRun.status == 'requires_action')
    {
      const tool_outputs = [];
     
      retrieveRun.required_action.submit_tool_outputs.tool_calls.forEach(toolCall => {

        const args = JSON.parse(toolCall.function.arguments);
        
        let output = '';

        switch (toolCall.function.name)
        {
          case 'getCurrentWeather':
            output = getCurrentWeather(args);
            break;
          case 'getNickname':
            output = getNickname(args);
            break;
        }

        tool_outputs.push({ tool_call_id: toolCall.id, output: output });
      });

      await openai.beta.threads.runs.submitToolOutputs(
        thread.id,
        run.id,
        { tool_outputs: tool_outputs }
      );
    }

    await delay(1000);
  }

  console.log('steps:');
  const steps = await openai.beta.threads.runs.steps.list(thread.id, run.id);
  steps.data.forEach(step => {
    console.log(`  ${step.id} ${step.type}`);
  });

  const messages = await openai.beta.threads.messages.list(thread.id);
  const assistantResponse = messages.data[0].content[0].text.value;

  console.log('assistant> ' + assistantResponse);
}

function getCurrentWeather(args) {
  console.log('>>> getCurrentWeather');
  return 'sunny';
}

function getNickname(args) {
  console.log('>>> getNickname');
  return 'LA';
}

process.exit();
