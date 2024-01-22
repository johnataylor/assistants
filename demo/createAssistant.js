
import { OpenAI } from "openai";

var baseURL = 'https://api.openai.com/v1'
//var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.create({
  name: "Math Tutor",
  description: "This is the math tutor test bot.",
  instructions: "You are a personal math tutor. Write and run code to answer math questions.",
  tools: [{ type: "code_interpreter" }],
  model: "gpt-4-1106-preview"
});

console.log(assistant.id);
