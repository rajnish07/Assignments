import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
  var tempPrices = {};

    //Get the Data from API first
    fetch("https://api.delta.exchange/v2/products", {
      headers: {
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.result);
        
        // Create the Socket connection once data is available from API
        const ws = new WebSocket("wss://production-esocket.delta.exchange");
        ws.onopen = function (event) {
          const symbols = [];
          data.result.forEach((element) => symbols.push(element.symbol));
          ws.send(
            JSON.stringify({
              type: "subscribe",
              payload: {
                channels: [
                  {
                    name: "v2/ticker",
                    symbols: symbols,
                  },
                ],
              },
            })
          );
        };

        const debounced = debouncePriceRender(1000);
        ws.onmessage = function (event) {
          const { symbol, mark_price } = JSON.parse(event.data);
          tempPrices[symbol] = mark_price;
          debounced();
        };
      })
      .catch((error) => console.error(error));

    //Will update the prices once we have all
    function debouncePriceRender(interval) {
      let timer;
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          setPrices({ ...tempPrices });
        }, interval);
      };
    }
  }, []);

  return (
    <div className={products.length ? "bg" : ""}>
      {products.length ? (
        <table id="data-table">
          <thead>
            <tr>
              <th style={{ width: "20%", textAlign: "center" }}>Symbol</th>
              <th style={{ width: "45%", textAlign: "center" }}>Description</th>
              <th style={{ width: "15%", textAlign: "center" }}>
                Underlying Asset
              </th>
              <th style={{ width: "20%", textAlign: "center" }}>Mark Price</th>
            </tr>
          </thead>
          <tbody id="content">
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.symbol}</td>
                <td>{product.description}</td>
                <td>{product.underlying_asset.symbol}</td>
                <td>
                  {prices[product.symbol] || (
                    <img src="loading-load.gif" alt="loading" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <img
          id="load"
          src="loading-animated-png.gif"
          alt="loading content..."
        />
      )}
    </div>
  );
}

export default App;
