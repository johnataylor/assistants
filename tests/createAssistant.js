
import { OpenAI } from "openai";

//var baseURL = 'https://api.openai.com/v1'
var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant1 = await openai.beta.assistants.create({
  name: "Assistant1",
  instructions: "You are an assistant.",
  model: "gpt-4-1106-preview"
});

console.log(assistant1.id);

const assistant2 = await openai.beta.assistants.create({
  model: "gpt-4-1106-preview"
});

console.log(assistant2.id);

const assistant3 = await openai.beta.assistants.create({
  name: "Assistant3",
  instructions: "You are an assistant who can add using the add function.",
  model: "gpt-4-1106-preview",
  tools: [{
    "type": "function",
    "function": {
      "name": "add",
      "description": "Adds two numbers together.",
      "parameters": {
        "type": "object",
        "properties": {
          "x": {"type": "number", "description": "The first number." },
          "y": {"type": "number", "description": "The second number." }
        },
        "required": ["x", "y"]
      }
    }
  }]
});

console.log(assistant3.id);

const assistant4 = await openai.beta.assistants.create({
  name: "Assistant4",
  instructions: "You are an assistant who can add and retrieve data using the tools.",
  model: "gpt-4-1106-preview",
  tools: [{
    "type": "function",
    "function": {
      "name": "add",
      "description": "Adds two numbers together.",
      "parameters": {
        "type": "object",
        "properties": {
          "x": {"type": "number", "description": "The first number." },
          "y": {"type": "number", "description": "The second number." }
        },
        "required": ["x", "y"]
      }
    }
  },
  { type: 'retrieval'}]
});

console.log(assistant4.id);
