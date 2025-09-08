const asyncHandler = require("express-async-handler");
const axios = require("axios");

const chatWithBot = asyncHandler(async (req, res) => {
  const { sessionId, message } = req.body;
  const userEmail = req.user.email; 

  if (!sessionId || !message) {
    res.status(400);
    throw new Error("sessionId and message are required.");
  }

  if (message.length > 1024) {
    res.status(400);
    throw new Error("Message cannot exceed 1024 characters.");
  }

  try {
    const payload = {
      sessionId,
      message,
      user: userEmail,
    };

    const n8nWebhookChat = process.env.N8N_WEBHOOK_CHAT;
    const chatApiResponse = await axios.post(n8nWebhookChat, payload);

    // FIX: Periksa apakah respons adalah array dan ambil output dari objek pertama
    if (Array.isArray(chatApiResponse.data) && chatApiResponse.data.length > 0 && chatApiResponse.data[0].output) {
      const botResponse = chatApiResponse.data[0].output;
      res.status(200).json({ output: botResponse });
    } else {
      // Jika format respons tidak sesuai
      console.error("Unexpected response format from chat service:", chatApiResponse.data);
      throw new Error("Received an invalid response from the chat service.");
    }
  } catch (error) {
    console.error("Error communicating with chat service:", error.message);
    res.status(502); // Bad Gateway
    throw new Error("Failed to communicate with the chat service.");
  }
});

module.exports = {
  chatWithBot,
};
