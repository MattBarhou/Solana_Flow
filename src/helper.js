export async function getSolanaPrice() {
  try {
    const response = await fetch(
      "https://min-api.cryptocompare.com/data/v2/histohour?fsym=SOL&tsym=USD&limit=24"
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    if (data && data.Data && data.Data.Data) {
      console.log("Successfully loaded price data from CryptoCompare");
      // Convert to format compatible chart
      return data.Data.Data.map((item) => [
        item.time * 1000, // Convert to milliseconds
        item.close, // Closing price
      ]);
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error) {
    console.error("API error:", error);
  }
}
