import React, { useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import "./App.css";

import { getSolanaPrice } from "./helper.js";
import SolanaChart from "./components/SolanaChart";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const connectWallet = async () => {
    const { solana } = window;
    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } catch (err) {
        console.error("Connection to Phantom failed:", err);
      }
    } else {
      alert("Please install Phantom Wallet");
    }
  };

  const getBalance = async () => {
    if (walletAddress) {
      const connection = new Connection(clusterApiUrl("devnet"));
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    }
  };

  const sendSOL = async (e) => {
    e.preventDefault();
    if (!walletAddress) return;

    setIsTransacting(true);
    setTransactionStatus({
      type: "pending",
      message: "Processing transaction...",
    });

    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const provider = window.solana;
      const fromPubkey = provider.publicKey;
      const recipientPubKey = new PublicKey(recipient);

      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: recipientPubKey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Get full blockhash metadata
      const latestBlockhash = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = fromPubkey;

      // Sign and send transaction
      const signed = await provider.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signed.serialize());

      // Confirm using correct metadata
      await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      // Refresh balance and UI
      getBalance();
      setRecipient("");
      setAmount("");
      setTransactionStatus({
        type: "success",
        message: "Transaction successful!",
        txid,
      });

      setTimeout(() => setTransactionStatus(null), 5000);
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus({
        type: "error",
        message: `Transaction failed: ${error.message}`,
      });
    } finally {
      setIsTransacting(false);
    }
  };

  // Get SOL price data
  const getSolanaPriceData = async () => {
    try {
      setIsLoadingPrice(true);
      const prices = await getSolanaPrice();

      if (!prices || !Array.isArray(prices)) {
        console.error("Invalid price data format");
        return;
      }

      // Format data for chart
      const formattedData = prices.map(([timestamp, price]) => ({
        time: new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: parseFloat(price.toFixed(2)),
        fullTime: new Date(timestamp),
      }));

      setPriceData(formattedData);
    } catch (error) {
      console.error("Error fetching Solana price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    getBalance();
  }, [walletAddress]);

  useEffect(() => {
    getSolanaPriceData();
    // Refresh price data every 5 minutes
    const interval = setInterval(getSolanaPriceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>
          Solana<span className="highlight">Flow</span>
        </h1>
        {!walletAddress && (
          <p className="tagline">The next-gen Web3 wallet experience</p>
        )}
      </div>

      {!walletAddress ? (
        <div className="connect-container">
          <div className="price-card">
            <h2>SOL Price</h2>
            <div className="chart-container">
              <SolanaChart
                priceData={priceData}
                isLoadingPrice={isLoadingPrice}
              />
            </div>
          </div>
          <button className="connect-button" onClick={connectWallet}>
            <span className="button-icon">⬢</span>
            Connect Phantom Wallet
          </button>
          <p className="connect-subtitle">
            Connect to access your Solana dashboard
          </p>
        </div>
      ) : (
        <div className="dashboard">
          <div className="card balance-card">
            <div className="card-label">Available Balance</div>
            <div className="balance-value">
              {balance} <span className="currency">SOL</span>
            </div>
            <p className="subtitle">
              <strong>Wallet:</strong>{" "}
              <span className="wallet-address">{walletAddress}</span>
            </p>
            {transactionStatus && (
              <div className={`transaction-status ${transactionStatus.type}`}>
                {transactionStatus.message}
                {transactionStatus.txid && (
                  <a
                    href={`https://explorer.solana.com/tx/${transactionStatus.txid}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-transaction"
                  >
                    View transaction
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="card price-card">
            <h2>SOL Price Chart</h2>
            <div className="chart-container">
              <SolanaChart
                priceData={priceData}
                isLoadingPrice={isLoadingPrice}
              />
            </div>
          </div>

          <div className="card action-card">
            <h2>Send SOL</h2>
            <form onSubmit={sendSOL}>
              <div className="input-group">
                <label htmlFor="recipient">Recipient Address</label>
                <input
                  id="recipient"
                  type="text"
                  placeholder="Enter Solana address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  disabled={isTransacting}
                />
              </div>

              <div className="input-group">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input-wrapper">
                  <input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.0001"
                    step="0.0001"
                    disabled={isTransacting}
                  />
                  <span className="input-suffix">SOL</span>
                </div>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isTransacting}
              >
                {isTransacting ? "Processing..." : "Send SOL"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
