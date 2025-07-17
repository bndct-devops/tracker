import { useState, useEffect } from 'react';
import TimeAgo from './TimeAgo';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [animatedItems, setAnimatedItems] = useState({});

  useEffect(() => {
    const interval = setInterval(fetchItems, 5000); // Refresh every 5 seconds
    fetchItems();
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    const response = await fetch('http://localhost:8000/items/today');
    const data = await response.json();
    setItems(data);
  };

  const handleInputChange = (e) => {
    setNewItemName(e.target.value);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await fetch('http://localhost:8000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: newItemName }),
    });
    setNewItemName('');
    fetchItems();
  };

  const handleIncrement = async (itemName) => {
    await fetch('http://localhost:8000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: itemName }),
    });
    setAnimatedItems(prev => ({ ...prev, [itemName]: true }));
    setTimeout(() => {
      setAnimatedItems(prev => ({ ...prev, [itemName]: false }));
    }, 500);
    fetchItems();
  };

  const handleDecrement = async (itemName) => {
    await fetch(`http://localhost:8000/items/${itemName}/latest`, {
      method: 'DELETE',
    });
    fetchItems();
  };

  const handleDeleteItem = async (itemName) => {
    await fetch(`http://localhost:8000/items/${itemName}`, {
      method: 'DELETE',
    });
    fetchItems();
  };

  const handleExport = async () => {
    const response = await fetch('http://localhost:8000/events/all');
    const data = await response.json();

    let csvContent = "data:text/csv;charset=utf-8,Item,Timestamp\n";
    data.forEach(row => {
      csvContent += `${row.item_name},${row.timestamp}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tracker_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Tracker</h1>
        <button className="export-button" onClick={handleExport}>Export CSV</button>
      </header>
      <main className="main-content">
        <div className="form-container">
          <form onSubmit={handleAddItem}>
            <input
              type="text"
              value={newItemName}
              onChange={handleInputChange}
              placeholder="Add new item (e.g., Coffee, Tea)"
              required
            />
            <button type="submit">Add Item</button>
          </form>
        </div>
        <div className="items-grid">
          {items.map(item => (
            <div key={item.name} className="item-card new-item">
              <h2>{item.name}</h2>
              <div className="item-controls">
                <button onClick={() => handleDecrement(item.name)}>-</button>
                <span className={animatedItems[item.name] ? 'pop' : ''}>{item.count}</span>
                <button onClick={() => handleIncrement(item.name)}>+</button>
              </div>
              {item.last_event_timestamp && (
                <div className="time-ago">
                  Last tracked: <TimeAgo timestamp={item.last_event_timestamp} />
                </div>
              )}
              <button className="delete-button" onClick={() => handleDeleteItem(item.name)}>Delete</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;