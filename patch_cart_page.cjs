const fs = require('fs');
let code = fs.readFileSync('src/pages/Cart.tsx', 'utf8');

code = code.replace(
  `import { ProductModal } from '../components/ProductModal';`,
  ``
);

code = code.replace(
  `import { CompanyInfo, ServiceType } from '../types';`,
  `import { CompanyInfo, ServiceType } from '../types';\nimport { ProductModal } from '../components/ProductModal';`
);

code = code.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();\n  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);`
);

code = code.replace(
  `                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>`,
  `                  <button
                    onClick={() => setEditingItemIndex(index)}
                    className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>`
);

code = code.replace(
  `    </div>
  );
}`,
  `      <AnimatePresence>
        {editingItemIndex !== null && items[editingItemIndex] && (
          <ProductModal
            product={items[editingItemIndex].product}
            onClose={() => setEditingItemIndex(null)}
            editItemIndex={editingItemIndex}
            existingItem={items[editingItemIndex]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}`
);

fs.writeFileSync('src/pages/Cart.tsx', code);
console.log('patched cart page');
