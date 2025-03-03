import axios from "axios";

const BASE_URL = "https://negotiation-bot-pgn2.onrender.com";
//const BASE_URL = "http://localhost:8000";  // Local backend


export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const startNegotiation = async (userId, productId) => {
  try {
    // Ensure productId is sent as a number (backend now expects an integer)
    const response = await api.post("/start_negotiation", {
      user_id: userId,
      product_id: productId,
    });
    return response.data;
  } catch (error) {
    console.error("Error starting negotiation:", error);
    throw error;
  }
};

export const sendOffer = async (sessionId, customerMessage) => {
  try {
    const response = await api.post("/negotiate", {
      session_id: sessionId,
      customer_message: customerMessage,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};
