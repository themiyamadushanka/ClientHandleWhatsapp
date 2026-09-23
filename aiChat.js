//Next Function


/*

import OpenAI from "openai";

process.loadEnvFile();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-mini";
const apiKey = process.env.AZURE_OPENAI_API_KEY;

if (!endpoint || !apiKey) {
  throw new Error('Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY before starting the bot.');
}
const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: apiKey
});

export async function askAI(inputText) {
  const runner = openai.responses
    .stream({
      model: deploymentName,
      input: inputText,
    });

  for await (const _event of runner) {
  }

  const result = await runner.finalResponse();
  return result.output_text;
}*/