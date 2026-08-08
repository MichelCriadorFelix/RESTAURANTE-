const fs = require('fs');
let code = fs.readFileSync('src/context/CartContext.tsx', 'utf8');

code = code.replace(
  `  removeItem: (index: number) => void;`,
  `  removeItem: (index: number) => void;\n  updateItem: (index: number, item: CartItem) => void;`
);

code = code.replace(
  `  removeItem: () => {},`,
  `  removeItem: () => {},\n  updateItem: () => {},`
);

code = code.replace(
  `  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };`,
  `  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, item: CartItem) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = item;
      return newItems;
    });
  };`
);

code = code.replace(
  `value={{ items, addItem, removeItem, clearCart, total }}>`,
  `value={{ items, addItem, removeItem, updateItem, clearCart, total }}>`
);

fs.writeFileSync('src/context/CartContext.tsx', code);
console.log('patched context');
