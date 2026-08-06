import { Product } from '../types';

type SeedProduct = Omit<Product, 'id'>;

const macarraoSteps = [
  {
    title: 'Escolha sua Massa',
    min: 1,
    max: 10,
    options: [
      { name: 'Penne' },
      { name: 'Espaguete' },
      { name: 'Parafuso' },
      { name: 'Talharim' }
    ]
  },
  {
    title: 'Escolha o seu Molho',
    min: 1,
    max: 10,
    options: [
      { name: 'Sugo' },
      { name: '4 Queijos' },
      { name: 'Parisiense / Branco' },
      { name: 'Bolonhesa' }
    ]
  },
  {
    title: 'Escolha os seus Adicionais',
    min: 1,
    max: 20,
    options: [
      { name: 'Alho' }, { name: 'Cebola' }, { name: 'Pimentão' }, { name: 'Tomate' },
      { name: 'Palmito' }, { name: 'Azeitona' }, { name: 'Milho' }, { name: 'Ervilha' },
      { name: 'Passas' }, { name: 'Linguiça' }, { name: 'Frango' }, { name: 'Bacon' },
      { name: 'Presunto' }, { name: 'Ovo de Codorna' },
      { name: 'Mussarela', price: 2 },
      { name: 'Camarão', price: 7 }
    ]
  },
  {
    title: 'Escolha sua Cobertura',
    min: 1,
    max: 10,
    options: [
      { name: 'Orégano' },
      { name: 'Cheddar' },
      { name: 'Parmesão' },
      { name: 'Alho Torrado' },
      { name: 'Sem cobertura' },
      { name: 'Catupiry' }
    ]
  }
];

const nhoqueSteps = [
  {
    title: 'Escolha os seus adicionais',
    min: 1,
    max: 20,
    options: [
      { name: 'Alho' }, { name: 'Cebola' }, { name: 'Tomate' }, { name: 'Pimentão' },
      { name: 'Azeitona' }, { name: 'Milho' }, { name: 'Ervilha' }, { name: 'Passas' },
      { name: 'Palmito' }, { name: 'Bacon' }, { name: 'Linguiça' }, { name: 'Presunto' },
      { name: 'Frango' },
      { name: 'Mussarela', price: 2 },
      { name: 'Ovo de codorna' },
      { name: 'Camarão', price: 7 }
    ]
  },
  {
    title: 'Escolha o seu Molho',
    min: 1,
    max: 10,
    options: [
      { name: 'Sugo' },
      { name: '4 Queijos' },
      { name: 'Parisiense / Branco' },
      { name: 'Bolonhesa' }
    ]
  },
  {
    title: 'Escolha sua Cobertura',
    min: 1,
    max: 10,
    options: [
      { name: 'Orégano' },
      { name: 'Cheddar' },
      { name: 'Parmesão' },
      { name: 'Alho Torrado' },
      { name: 'Sem cobertura' },
      { name: 'Catupiry' }
    ]
  }
];

const risotoSteps = [
  {
    title: 'Escolha seu Risoto',
    min: 0,
    max: 1,
    options: [
      { name: 'Frango' },
      { name: 'Camarão', price: 4 }
    ]
  },
  {
    title: 'Escolha seu Molho',
    min: 1,
    max: 10,
    options: [
      { name: 'Sugo' },
      { name: 'Parisiense' },
      { name: '4 Queijos' }
    ]
  },
  {
    title: 'Escolha os seus adicionais',
    min: 1,
    max: 20,
    options: [
      { name: 'Alho' }, { name: 'Cebola' }, { name: 'Tomate' }, { name: 'Pimentão' },
      { name: 'Azeitona' }, { name: 'Milho' }, { name: 'Ervilha' }, { name: 'Passas' },
      { name: 'Palmito' }, { name: 'Bacon' }, { name: 'Linguiça' }, { name: 'Presunto' },
      { name: 'Frango' },
      { name: 'Mussarela', price: 2 },
      { name: 'Ovo de codorna' },
      { name: 'Camarão', price: 7 }
    ]
  },
  {
    title: 'Escolha sua Cobertura',
    min: 1,
    max: 10,
    options: [
      { name: 'Orégano' },
      { name: 'Cheddar' },
      { name: 'Parmesão' },
      { name: 'Alho Torrado' },
      { name: 'Sem cobertura' },
      { name: 'Catupiry' }
    ]
  }
];

export const initialMenu: SeedProduct[] = [
  { 
    name: 'Monte seu Macarrão', 
    description: 'Aqui você é o chef, monte seu macarrão do seu jeito.', 
    price: 24, 
    category: 'Monte sua Massa', 
    available: true,
    customizationSteps: macarraoSteps
  },
  { 
    name: 'Monte seu Nhoque Batata', 
    description: 'Aqui você é o chef, monte seu nhoque do seu jeito.', 
    price: 28, 
    category: 'Monte sua Massa', 
    available: true,
    customizationSteps: nhoqueSteps
  },
  { 
    name: 'Monte seu Risoto', 
    description: 'Aqui você é o chef, monte seu risoto do seu jeito.', 
    price: 24, 
    category: 'Monte sua Massa', 
    available: true,
    customizationSteps: risotoSteps
  },
  { name: 'Strogonoff de Frango', description: 'Delicioso Strogonoff de frango em cubos, Champignon, creme de leite, servido com arroz fresquinho e batata palha.', price: 20, category: 'Strogonoff', available: true },
  { name: 'Strogonoff de Carne', description: 'Delicioso Strogonoff de Carne em cubos, Champignon, creme de leite, servido com arroz fresquinho e batata palha.', price: 24, category: 'Strogonoff', available: true },
  { name: 'Strogonoff de Camarão', description: '', price: 28, category: 'Strogonoff', available: true },
  
  { name: 'Batata Calabresa C/ Catupiry e Queijo', description: '*Promoção válida pra pix ou dinheiro*', price: 20, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Frango c/ Catupiry e queijo', description: 'Frango desfiado c/ Catupiry e queijo', price: 20, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Strogonoff de Frango', description: '', price: 20, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Bacon C/ Catupiry e Queijo', description: '', price: 22, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Strogonoff de Carne', description: '', price: 22, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Carne seca Catupiry e Queijo', description: '', price: 23, category: 'Batatas Recheadas', available: true },
  { name: 'Batata Camarão C/ Catupiry e Queijo', description: '', price: 23, category: 'Batatas Recheadas', available: true },
  
  { name: 'Lasanha de Frango', description: 'Deliciosa Lasanha de Frango com muito queijo, presunto e um molho especial da casa.', price: 20, category: 'Lasanhas', available: true },
  { name: 'Lasanha de Carne', description: 'Deliciosa Lasanha de Carne, com muito queijo, presunto e um molho especial da casa.', price: 24, category: 'Lasanhas', available: true },
  { name: 'Lasanha de Camarão', description: 'Deliciosa Lasanha de Camarão, com muito queijo, presunto e um molho especial da casa.', price: 32, category: 'Lasanhas', available: true },
  
  { name: 'Moqueca de Camarão', description: 'Deliciosa Moqueca de Camarão, acompanhada de um arroz fresquinho e pirão.', price: 28, category: 'Moqueca', available: true },
  
  { name: 'Filé de Peixe', description: 'Filé de peixe ao molho de camarão, arroz de brócolis e pirão.', price: 28, category: 'Pratos Extra', available: true },
  { name: 'Churrasquinho Misto', description: 'Linguiça, Carne, Frango, Arroz, Salpicão, Farofa, Vinagrete.', price: 26, category: 'Pratos Extra', available: true },
  
  { name: 'Batata Maluca', description: 'Batata, bacon, linguiça, cheddar e queijo.', price: 25, category: 'Petiscos', available: true },
  { name: 'Isca de Frango c/ Batata Maluca', description: '', price: 45, category: 'Petiscos', available: true },
  { name: 'Contra Filé c/ Batata Maluca', description: '', price: 55, category: 'Petiscos', available: true },
  { name: 'Gurjão de Peixe c/ Camarão Empanado', description: 'Leva batata maluca junto.', price: 60, category: 'Petiscos', available: true },

  { name: 'Pastel de Queijo', description: '', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel de Queijo com Presunto', description: '', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Frango Caipira', description: 'Frango desfiado, Milho, Palmito e Catupiry.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Toscana', description: 'Ragu de Linguiça, Mussarela, Salsinha e Azeitona.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Boi Bandido', description: 'Carne, Ovo de Codorna, Azeitona e Catupiry.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Camarão', description: 'Camarão, Alho Poró e Crêem Cheese.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Moqueca de Camarão', description: 'Moqueca de Camarão, Temperos, Leite de coco e Azeite de dendê.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Banana Nevada', description: 'Banana, Queijo Mussarela e Chocolate Branco.', price: 7, category: 'Pastéis', available: true },
  { name: 'Pastel Romeu e Julieta', description: 'Queijo com Goiabada.', price: 7, category: 'Pastéis', available: true },

  { name: 'Coca-Cola Lata', description: '', price: 6, category: 'Bebidas', available: true },
  { name: 'Coca Lata Zero', description: '', price: 6, category: 'Bebidas', available: true },
  { name: 'Suco de Maracujá', description: '', price: 7, category: 'Bebidas', available: true },
  { name: 'Suco de Abacaxi com Hortelã', description: '', price: 7, category: 'Bebidas', available: true },
];
