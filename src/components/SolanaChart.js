import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const SolanaChart = ({
  priceData,
  isLoadingPrice,
  height = 200,
  showHeader = true,
}) => {
  // Format price for display
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      // Format the date more concisely
      const formattedDate = payload[0].payload.fullTime.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <div className="price-tooltip">
          <p className="time">{formattedDate}</p>
          <p className="price-value">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate price change percentage if enough data points
  const getPriceChangePercentage = () => {
    if (priceData.length > 1) {
      const firstPrice = priceData[0]?.price;
      const lastPrice = priceData[priceData.length - 1]?.price;
      const isPositive = lastPrice > firstPrice;
      const percentChange = Math.abs(
        ((lastPrice - firstPrice) / firstPrice) * 100
      ).toFixed(2);

      return {
        isPositive,
        percentChange,
        displaySymbol: isPositive ? "↑" : "↓",
        className: isPositive ? "price-up" : "price-down",
      };
    }
    return null;
  };

  // Render loading or error state
  if (isLoadingPrice && (!priceData || priceData.length === 0)) {
    return <div className="loading-indicator">Loading price data...</div>;
  }

  if (!priceData || priceData.length === 0) {
    return <div className="error-indicator">Unable to load price data</div>;
  }

  const priceChange = getPriceChangePercentage();
  const currentPrice = priceData[priceData.length - 1]?.price;

  return (
    <>
      {showHeader && (
        <div className="price-header">
          <div className="current-price">{formatPrice(currentPrice)}</div>
          {priceChange && (
            <div className="price-change">
              <span className={priceChange.className}>
                {priceChange.displaySymbol} {priceChange.percentChange}%
              </span>
            </div>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={priceData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={formatPrice}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            activeDot={{
              r: 6,
              stroke: "#10b981",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
};

export default SolanaChart;
