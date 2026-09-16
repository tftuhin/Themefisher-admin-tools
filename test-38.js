const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { streamText } = require("ai");

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function main() {
  const result = await streamText({
    model: google("gemini-3.8-flash"),
    system: "You are a helpful assistant.",
    messages: [{role: "user", content: "Hello"}],
  });

  try {
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (e) {
    console.error("STREAM ERROR:", e);
  }
}
main();
