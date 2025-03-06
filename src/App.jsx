import { useState, useEffect, useRef } from "react"; // Modification 4: Added useEffect and useRef
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
  const productImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLkA6qGp_tBvuJ_iZKshCItsuZ3YMKYWvaGQ&s"; // Replace with actual image URL

  const chatBoxRef = useRef(null); // Modification 4: Create a ref for the chat container

  // Modification 4: Auto-scroll effect – scroll to the bottom whenever chatHistory changes
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
    // Add customer's message
    setChatHistory(prevHistory => [
      ...prevHistory,
      { sender: "customer", text: customerMessage }
    ]);
    // Save current message in a variable for sending
    const currentMessage = customerMessage;
    setCustomerMessage("");
    
    // Removed temporary "Generating counter offer..." message code

    setLoading(true);
    
    try {
      const response = await axios.post(`${BASE_API_URL}/negotiate`, {
        session_id: sessionId,
        customer_message: currentMessage
      });
      const botMessage = response.data.human_response;
      const status = response.data.status;
      
      // Directly add the bot response
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: "bot", text: botMessage }
      ]);
      
      if (status === "success") {
        setChatHistory(prevHistory => [
          ...prevHistory,
          { sender: "bot", text: `Deal closed at ₹${response.data.counter_offer}! Thank you for negotiating.` }
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
          {/* Modification: Wrap buttons in a container with class "button-group" */}
          <div className="button-group">
            <button className="buy-now-button">Buy Now</button>
            <button onClick={handleNegotiate} className="negotiate-button">
              {loading ? "Starting Negotiation..." : "Negotiate"}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {page === "negotiationPage" && (
        <div className="chat-container">
          {/* Modification 2: Removed the "Negotiation Chat" title */}
          <div className="chat-box" ref={chatBoxRef}>
            {chatHistory.map((message, index) => (
              // Modification 3: Add fade-in animation class "fade-in" to each message element
              <p key={index} className={`${message.sender === "bot" ? "bot-message" : "customer-message"} fade-in`}>
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
          {/* Modification 4 (continued): Wrap the input and send button in a container with class "typing-bar" and add onKeyPress for Enter */}
          <div className="typing-bar">
            <input 
              type="text"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder="Enter your offer..."
              className="input-field"
              onKeyPress={(e) => { if(e.key === "Enter") { handleSendMessage(); } }} // Send on Enter
            />
            <button onClick={handleSendMessage} className="send-button" disabled={loading}>
              {loading ? "Processing..." : "Send"}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
