import { useState, useEffect, useRef } from "react";
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
  const [finalDecision, setFinalDecision] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChat, setShowChat] = useState(false);

  const BASE_API_URL = "https://negotiation-bot-pgn2.onrender.com";
  const productId = "1";
  const productPrice = 1000;
  const productImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLkA6qGp_tBvuJ_iZKshCItsuZ3YMKYWvaGQ&s";

  const chatBoxRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      if (isMobile) {
        setPage("negotiationPage");
      } else {
        setShowChat(true);
      }
    } catch (err) {
      setError("Failed to start negotiation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalDecision = async (decision) => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_API_URL}/negotiate`, {
        session_id: sessionId,
        customer_message: "final decision",
        decision: decision
      });
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: "bot", text: response.data.human_response }
      ]);
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
    const currentMessage = customerMessage;
    setCustomerMessage("");

    setChatHistory(prevHistory => [
      ...prevHistory,
      { sender: "bot", text: "", isLoading: true }
    ]);

    setLoading(true);
    
    try {
      const response = await axios.post(`${BASE_API_URL}/negotiate`, {
        session_id: sessionId,
        customer_message: currentMessage
      });
      const botMessage = response.data.human_response;
      const status = response.data.status;

      setChatHistory(prevHistory => {
        let newHistory = [...prevHistory];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].isLoading) {
          newHistory.pop();
        }
        newHistory.push({ sender: "bot", text: botMessage });
        if (status === "success") {
          newHistory.push({ sender: "bot", text: `Deal closed at ₹${response.data.counter_offer}! Thank you for negotiating.` });
        } else if (status === "failed") {
          newHistory.push({ sender: "bot", text: response.data.message });
        } else if (status === "final_decision") {
          setFinalDecision(true);
          newHistory.push({ sender: "bot", text: response.data.message });
        }
        return newHistory;
      });
    } catch (err) {
      setError("Failed to process negotiation. Please try again.");
      setChatHistory(prevHistory => {
        let newHistory = [...prevHistory];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].isLoading) {
          newHistory.pop();
        }
        return newHistory;
      });
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
          <div className="button-group">
            <button className="buy-now-button">Buy Now</button>
            <button onClick={handleNegotiate} className="negotiate-button">
              Negotiate
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          {showChat && !isMobile && (
            /* Modification: Reordered to place finalDecision buttons above typing bar,
               with messages at the bottom, and typed input fixed at the bottom. */
            <div className="chat-container">
              <div className="chat-box" ref={chatBoxRef}>
                {chatHistory.map((message, index) => (
                  <p key={index} className={message.sender === "bot" ? "bot-message" : "customer-message"}>
                    {message.isLoading ? (
                      <div className="dots">
                        <span className="dot dot1"></span>
                        <span className="dot dot2"></span>
                        <span className="dot dot3"></span>
                      </div>
                    ) : (
                      message.text
                    )}
                  </p>
                ))}
              </div>
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
              <div className="typing-bar">
                <input 
                  type="text"
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { handleSendMessage(); } }}
                  placeholder="Enter your offer..."
                  className="input-field"
                />
                <button onClick={handleSendMessage} className="send-button" disabled={loading}>
                  ➤
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {page === "negotiationPage" && isMobile && (
        /* Modification: Same reordering for mobile popup */
        <div className="chat-popup">
          <div className="chat-box" ref={chatBoxRef}>
            {chatHistory.map((message, index) => (
              <p key={index} className={message.sender === "bot" ? "bot-message" : "customer-message"}>
                {message.isLoading ? (
                  <div className="dots">
                    <span className="dot dot1"></span>
                    <span className="dot dot2"></span>
                    <span className="dot dot3"></span>
                  </div>
                ) : (
                  message.text
                )}
              </p>
            ))}
          </div>
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
          <div className="typing-bar">
            <input 
              type="text"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { handleSendMessage(); } }}
              placeholder="Enter your offer..."
              className="input-field"
            />
            <button onClick={handleSendMessage} className="send-button" disabled={loading}>
              ➤
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
