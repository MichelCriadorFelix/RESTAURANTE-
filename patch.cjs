const fs = require('fs');
let code = fs.readFileSync('src/components/ProductModal.tsx', 'utf8');

code = code.replace(
  `interface ProductModalProps {
  product: Product;
  onClose: () => void;
}`,
  `interface ProductModalProps {
  product: Product;
  onClose: () => void;
  editItemIndex?: number;
  existingItem?: CartItem;
}`
);

code = code.replace(
  `export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<{ [stepTitle: string]: StepOption[] }>({});
  const [notes, setNotes] = useState('');`,
  `export function ProductModal({ product, onClose, editItemIndex, existingItem }: ProductModalProps) {
  const { addItem, updateItem } = useCart();
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);
  const [selections, setSelections] = useState<{ [stepTitle: string]: StepOption[] }>(existingItem?.customizationSelections || {});
  const [notes, setNotes] = useState(existingItem?.notes || '');`
);

code = code.replace(
  `  // Initial legacy state if needed
  const [selectedOption, setSelectedOption] = useState<string>(
    product.options && product.options.length > 0 ? 'Nenhum' : ''
  );
  const [selectedSize, setSelectedSize] = useState<'1 item' | '2 itens' | '1 pedaço' | '2 pedaços'>('1 item');`,
  `  // Initial legacy state if needed
  const [selectedOption, setSelectedOption] = useState<string>(
    existingItem?.selectedOption || (product.options && product.options.length > 0 ? 'Nenhum' : '')
  );
  const [selectedSize, setSelectedSize] = useState<'1 item' | '2 itens' | '1 pedaço' | '2 pedaços'>(
    (existingItem?.selectedSize as any) || '1 item'
  );`
);

code = code.replace(
  `  const handleAdd = () => {
    if (!canAddToCart()) return;
    
    addItem({
      product,
      quantity,
      selectedOption: customizationSteps ? undefined : (selectedOption !== 'Nenhum' ? selectedOption : undefined),
      selectedSize: customizationSteps ? undefined : (product.priceOption2 !== undefined ? selectedSize : undefined),
      customizationSelections: customizationSteps ? selections : undefined,
      notes,
      totalPrice: calculateTotal()
    });
    
    onClose();
  };`,
  `  const handleAdd = () => {
    if (!canAddToCart()) return;
    
    const cartItem = {
      product,
      quantity,
      selectedOption: customizationSteps ? undefined : (selectedOption !== 'Nenhum' ? selectedOption : undefined),
      selectedSize: customizationSteps ? undefined : (product.priceOption2 !== undefined ? selectedSize : undefined),
      customizationSelections: customizationSteps ? selections : undefined,
      notes,
      totalPrice: calculateTotal()
    };

    if (editItemIndex !== undefined && updateItem) {
      updateItem(editItemIndex, cartItem);
    } else {
      addItem(cartItem);
    }
    
    onClose();
  };`
);

code = code.replace(
  `            <span>Adicionar</span>`,
  `            <span>{editItemIndex !== undefined ? 'Salvar Alterações' : 'Adicionar'}</span>`
);

fs.writeFileSync('src/components/ProductModal.tsx', code);
console.log('patched');
