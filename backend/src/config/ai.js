const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

function log(title, data) {
  console.log(`\n==================== ${title} ====================`);
  console.log(JSON.stringify(data, null, 2));
  console.log(`====================================================\n`);
}

/**
 * 🔥 GROQ (DEBUG MODE)
 */
async function groqChat(messages, model = "llama-3.1-8b-instant") {
  try {
    log("GROQ REQUEST", { model, messages });

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages,
        temperature: 1.1,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    log("GROQ RESPONSE", response.data);

    return response.data.choices[0].message.content;
  } catch (err) {
    console.log("\n❌ ========== GROQ ERROR ==========");

    console.log("Status:", err.response?.status);
    console.log("Message:", err.message);

    log("GROQ ERROR BODY", err.response?.data || "NO RESPONSE BODY");

    throw err;
  }
}

/**
 * 🧪 HUGGINGFACE (DEBUG MODE)
 */
async function hfChat(messages) {
  try {
    const prompt = messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    log("HF REQUEST", { prompt });

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.9
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`
        },
        timeout: 30000
      }
    );

    log("HF RESPONSE", response.data);

    return response.data?.[0]?.generated_text || "hey...";
  } catch (err) {
    console.log("\n❌ ========== HF ERROR ==========");

    console.log("Status:", err.response?.status);
    console.log("Message:", err.message);

    log("HF ERROR BODY", err.response?.data || "NO RESPONSE BODY");

    throw err;
  }
}

/**
 * 🔁 WRAPPER (FULL DEBUG FLOW)
 */
async function createChatCompletion({ messages }) {
  try {
    console.log("\n🚀 STEP 1: CALLING GROQ...\n");

    const result = await groqChat(messages);

    console.log("\n✅ STEP 1 SUCCESS: GROQ USED\n");

    return {
      choices: [{ message: { content: result } }]
    };
  } catch (err) {
    console.log("\n⚠️ GROQ FAILED → SWITCHING TO HF...\n");

    try {
      const result = await hfChat(messages);

      console.log("\n✅ STEP 2 SUCCESS: HUGGINGFACE USED\n");

      return {
        choices: [{ message: { content: result } }]
      };
    } catch (err2) {
      console.log("\n💀 BOTH AI MODELS FAILED → FALLBACK USED\n");

      return {
        choices: [
          { message: { content: "hey... sorry got distracted 😅" } }
        ]
      };
    }
  }
}

module.exports = {
  chat: {
    completions: {
      create: createChatCompletion
    }
  }
};