import { Customer, Transaction, PlanType, Server } from './types';

export const SERVERS: Server[] = [
  { id: '1', name: 'Alpha Server', defaultCost: 15 },
  { id: '2', name: 'Beta Cloud', defaultCost: 18 },
  { id: '3', name: 'Gamma Stream', defaultCost: 12 }
];
export const PLANS: PlanType[] = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

const today = new Date();
const formatDate = (days: number) => {
  const d = new Date();
  d.setDate(today.getDate() + days);
  return d.toISOString();
};

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'João Silva', whatsapp: '11999999999', server: 'Alpha Server', plan: 'Mensal', price: 35, expiryDate: formatDate(0), status: 'expiring', connections: 1, createdAt: formatDate(-30) },
  { id: '2', name: 'Maria Oliveira', whatsapp: '11988888888', server: 'Beta Cloud', plan: 'Trimestral', price: 90, expiryDate: formatDate(1), status: 'expiring', connections: 2, createdAt: formatDate(-60) },
  { id: '3', name: 'Pedro Santos', whatsapp: '11977777777', server: 'Alpha Server', plan: 'Mensal', price: 35, expiryDate: formatDate(2), status: 'expiring', connections: 1, createdAt: formatDate(-15) },
  { id: '4', name: 'Ana Costa', whatsapp: '11966666666', server: 'Gamma Stream', plan: 'Mensal', price: 30, expiryDate: formatDate(3), status: 'expiring', connections: 1, createdAt: formatDate(-5) },
  { id: '5', name: 'Lucas Pereira', whatsapp: '11955555555', server: 'Alpha Server', plan: 'Anual', price: 300, expiryDate: formatDate(-1), status: 'expired', connections: 1, createdAt: formatDate(-365) },
  { id: '6', name: 'Carla Souza', whatsapp: '11944444444', server: 'Beta Cloud', plan: 'Mensal', price: 35, expiryDate: formatDate(10), status: 'active', connections: 1, createdAt: formatDate(-20) },
  { id: '7', name: 'Marcos Lima', whatsapp: '11933333333', server: 'Gamma Stream', plan: 'Mensal', price: 35, expiryDate: formatDate(15), status: 'active', connections: 1, createdAt: formatDate(-10) },
  { id: '8', name: 'Fernanda Rocha', whatsapp: '11922222222', server: 'Alpha Server', plan: 'Trimestral', price: 95, expiryDate: formatDate(20), status: 'active', connections: 3, createdAt: formatDate(-45) },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: formatDate(-30), description: 'Compra de 50 Créditos Alpha', amount: 500, type: 'expense', category: 'credits' },
  { id: 't2', date: formatDate(-20), description: 'Renovação João Silva', amount: 35, type: 'income', category: 'renewal' },
  { id: 't3', date: formatDate(-15), description: 'Internet Escritório', amount: 100, type: 'expense', category: 'other' },
  { id: 't4', date: formatDate(-10), description: 'Anúncios Facebook', amount: 250, type: 'expense', category: 'marketing' },
  { id: 't5', date: formatDate(-5), description: 'Renovação Maria Oliveira', amount: 90, type: 'income', category: 'renewal' },
];

export const DEFAULT_WHATSAPP_TEMPLATE = `Olá {NOME}! 🚀

Seu acesso ao streaming ({PLANO}) vence em {VENCIMENTO}.

Para garantir que você não fique sem sinal, a renovação é apenas R$ {VALOR}.

💳 *Dados para Pagamento (PIX):*
Chave: {PIX_KEY}
Nome: {PIX_NAME}

Após realizar o pagamento, por favor envie o comprovante aqui! 📺✨`;

export const DEFAULT_PIX_INFO = {
  pixKey: 'financeiro@gestor-iptv.com',
  pixName: 'Seu Nome ou Empresa',
};
