
const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

import { OpenAI } from "openai";

var baseURL = 'https://api.openai.com/v1'
//var baseURL = 'http://localhost:3000/v1'

var availableFunctions = {
  get_current_weather: function (location, unit) { return 'sunny'; }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const tools = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
      },
    },
  },
];

const messages = [
  { role: "user", content: "What's the weather like in San Francisco, Tokyo, and Paris?" },
];

for (;;) {

  console.log('-------- -------- --------');

  console.log(JSON.stringify(messages, null, 2));

  const response = await openai.chat.completions.create({
    messages: messages,
    tools: tools,
    model: 'gpt-3.5-turbo-1106',
  });

  //console.log(JSON.stringify(response, null, 2));

  const finishReason = response.choices[0].finish_reason;

  if (finishReason == 'tool_calls') {
    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResponse = functionToCall(
          functionArgs.location,
          functionArgs.unit
        );
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse,
        });
      }
    }
  }
  else if (finishReason == 'stop') {
    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);
    break;
  }
}
