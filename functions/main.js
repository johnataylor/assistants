

import { createInterface } from "readline";

const readlineInterface = createInterface({ input: process.stdin, output: process.stdout });

const question = (str) => new Promise(resolve => readlineInterface.question(str, resolve));
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

import { OpenAI } from "openai";

var baseURL = 'https://api.openai.com/v1'
//var baseURL = 'http://localhost:3000/v1'

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

//console.log(JSON.stringify(assistant, null, 2));

const thread = await openai.beta.threads.create();

//console.log(JSON.stringify(thread, null, 2));

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

  //console.log(JSON.stringify(message, null, 2));

  const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });

  console.log(`run status: ${run.status}`);

  //console.log(JSON.stringify(run, null, 2));

  // loop waiting on the response - max iterations being 10 here
  for (var i=0; i<10; i++)
  {
    const retrieveRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    console.log(`run status: ${retrieveRun.status}`);

    if (retrieveRun.status == 'completed') {
      break;
    }

    if (retrieveRun.status == 'requires_action')
    {
      console.log('BEFORE requires_action steps...');
      await dumpSteps(thread.id, run.id);

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

      console.log('AFTER requires_action steps...');
      await dumpSteps(thread.id, run.id);
    }

    await delay(1000);
  }

  await dumpSteps(thread.id, run.id);

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

async function dumpSteps(threadId, runId)
{
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
