export type PlanType = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  server: string;
  plan: PlanType;
  price: number;
  expiryDate: string; // ISO string
  status: 'active' | 'expiring' | 'expired';
  notes?: string;
  connections: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'renewal' | 'credits' | 'marketing' | 'infrastructure' | 'other';
}

export interface Server {
  id: string;
  name: string;
  defaultCost: number;
}

export interface AppState {
  customers: Customer[];
  transactions: Transaction[];
  servers: Server[]; // Mudança de string[] para Server[]
  serverCosts?: Record<string, number>;
  auth: {
    username: string;
    passwordHash: string; // Stored as plain string for this demo, usually hashed
    isLogged: boolean;
  };
  config: {
    lowCreditThreshold: number;
    currency: string;
    language: 'pt-BR' | 'en-US';
    autoRenewCredits: boolean;
    whatsappTemplates: {
       renewal: string;
       welcome: string;
       expired: string;
    };
  };
  paymentInfo: {
    pixKey: string;
    pixName: string;
  };
  whatsappTemplate: string;
  auditLogs: AuditLog[];
  plans: Plan[];
  supportLinks: SupportLink[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
}

export interface SupportLink {
  id: string;
  label: string;
  url: string;
  icon: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'alert' | 'success';
}
