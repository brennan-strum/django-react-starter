import { useEffect, useState } from "react";
import { listQuotes, createQuote } from "./api";

export default function App() {
  const [quotes, setQuotes] = useState([]);
  const [customer, setCustomer] = useState("");
  const [total, setTotal] = useState("");
  const [error, setError] = useState(null);

  // Load quotes once on mount.
  useEffect(() => {
    listQuotes().then(setQuotes).catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const created = await createQuote({ customer, total });
      setQuotes([created, ...quotes]); // optimistic prepend (newest first)
      setCustomer("");
      setTotal("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Quotes</h1>
      <p className="sub">React frontend talking to a Django REST API.</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          required
        />
        <input
          placeholder="Total"
          type="number"
          step="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
        />
        <button type="submit">Add quote</button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      <ul>
        {quotes.map((q) => (
          <li key={q.id}>
            <strong>{q.customer}</strong> — ${q.total}
            {q.notes && <span className="notes"> · {q.notes}</span>}
          </li>
        ))}
        {quotes.length === 0 && !error && <li className="empty">No quotes yet.</li>}
      </ul>
    </main>
  );
}
