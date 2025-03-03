import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [page, setPage] = useState("nameInput");
  const [userName, setUserName] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalDecision, setFinalDecision] = useState(false); // Flag to show final decision buttons

  const BASE_API_URL = "https://negotiation-bot-pgn2.onrender.com";
  const productId = "1";
  const productPrice = 1000;
  const productImage = "https://via.placeholder.com/300"; // Replace with actual image URL

  const handleNameSubmit = () => {
    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError(null);
    setPage("productPage");
  };

  const handleNegotiate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_API_URL}/start_negotiation`, {
        user_id: userName,
        product_id: productId
      });
      setSessionId(response.data.session_id);
      setChatHistory([
        { sender: "bot", text: "Welcome to negotiation! Please enter your offer." }
      ]);
      setPage("negotiationPage");
    } catch (err) {
      setError("Failed to start negotiation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle final decision (Deal/No Deal)
  const handleFinalDecision = async (decision) => {
    setLoading(true);
    try {
      // Send the decision along with a dummy message (backend uses the decision field)
      const response = await axios.post(`${BASE_API_URL}/negotiate`, {
        session_id: sessionId,
        customer_message: "final decision", // Dummy text; backend uses the decision field
        decision: decision
      });
      // Append the final decision response message to chat history.
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: "bot", text: response.data.human_response }
      ]);
      // Reset final decision flag.
      setFinalDecision(false);
    } catch (err) {
      setError("Failed to submit your decision. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!customerMessage.trim()) {
      setError("Please enter your offer.");
      return;
    }
    setChatHistory(prevHistory => [
      ...prevHistory,
      { sender: "customer", text: customerMessage }
    ]);
    setCustomerMessage("");
    setLoading(true);
    
    try {
      const response = await axios.post(`${BASE_API_URL}/negotiate`, {
        session_id: sessionId,
        customer_message: customerMessage
      });
      const botMessage = response.data.human_response;
      const counterOffer = response.data.counter_offer;
      const status = response.data.status;

      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: "bot", text: botMessage },
        { sender: "bot", text: `Our counter offer: ₹${counterOffer}` }
      ]);

      if (status === "success") {
        setChatHistory(prevHistory => [
          ...prevHistory,
          { sender: "bot", text: `Deal closed at ₹${counterOffer}! Thank you for negotiating.` }
        ]);
      } else if (status === "failed") {
        setChatHistory(prevHistory => [
          ...prevHistory,
          { sender: "bot", text: ` ${response.data.message}` }
        ]);
      } else if (status === "final_decision") {
        // Set flag so that final decision buttons are rendered.
        setFinalDecision(true);
        setChatHistory(prevHistory => [
          ...prevHistory,
          { sender: "bot", text: response.data.message }
        ]);
      }
    } catch (err) {
      setError("Failed to process negotiation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {page === "nameInput" && (
        <div className="name-input-container">
          <h1>Welcome!</h1>
          <p>Please enter your name to continue:</p>
          <input 
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name..."
            className="input-field"
          />
          <button onClick={handleNameSubmit} className="primary-button">Continue</button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {page === "productPage" && (
        <div className="product-container">
          <h1>Product Page</h1>
          <img src={productImage} alt="Product" className="product-image" />
          <h2>Price: ₹{productPrice}</h2>
          <button className="buy-now-button">Buy Now</button>
          <button onClick={handleNegotiate} className="negotiate-button">
            {loading ? "Starting Negotiation..." : "Negotiate"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {page === "negotiationPage" && (
        <div className="chat-container">
          <h1>Negotiation Chat</h1>
          <div className="chat-box">
            {chatHistory.map((message, index) => (
              <p key={index} className={message.sender === "bot" ? "bot-message" : "customer-message"}>
                {message.text}
              </p>
            ))}
          </div>
          {/* Render final decision buttons when applicable */}
          {finalDecision && (
            <div className="final-decision-buttons">
              <button onClick={() => handleFinalDecision("deal")} className="deal-button" disabled={loading}>
                Deal
              </button>
              <button onClick={() => handleFinalDecision("no_deal")} className="no-deal-button" disabled={loading}>
                No Deal
              </button>
            </div>
          )}
          <input 
            type="text"
            value={customerMessage}
            onChange={(e) => setCustomerMessage(e.target.value)}
            placeholder="Enter your offer..."
            className="input-field"
          />
          <button onClick={handleSendMessage} className="send-button" disabled={loading}>
            {loading ? "Processing..." : "Send"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
