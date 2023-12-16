
import { OpenAI } from "openai";

var baseURL = 'https://api.openai.com/v1'
//var baseURL = 'http://localhost:3000/v1'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: baseURL });

const assistant = await openai.beta.assistants.update('asst_2ZtmphhDsyZcwqBOUoV48kBZ', {
  name: "Math Tutor 1",
});

console.log(assistant.id + ' ' + assistant.name);
