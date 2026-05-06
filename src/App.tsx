/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  DollarSign, 
  Settings, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Save,
  Download,
  Upload,
  Pencil,
  X,
  TrendingDown,
  TrendingUp,
  Server,
  MessageSquare,
  FileText,
  Calendar,
  CreditCard,
  Target,
  BarChart3,
  Box,
  Shield,
  Zap,
  Globe,
  Lock,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { Customer, Transaction, AppState, AuditLog } from './types';
import { 
  MOCK_CUSTOMERS, 
  MOCK_TRANSACTIONS, 
  DEFAULT_PIX_INFO, 
  SERVERS, 
  PLANS, 
  DEFAULT_WHATSAPP_TEMPLATE 
} from './constants';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'finance' | 'inventory' | 'support' | 'settings'>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'servers' | 'plans' | 'messages' | 'system'>('profile');
  const [financeSubTab, setFinanceSubTab] = useState<'transactions' | 'reports'>('transactions');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('gestor_iptv_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migração de Servidores: de string[] para Server[]
      if (parsed.servers && parsed.servers.length > 0 && typeof parsed.servers[0] === 'string') {
        const migratedServers: any[] = parsed.servers.map((s: string, i: number) => ({
          id: (i + 1).toString(),
          name: s,
          defaultCost: parsed.serverCosts?.[s] || 15
        }));
        parsed.servers = migratedServers;
      }
      
      if (!parsed.servers) parsed.servers = SERVERS;
      if (!parsed.serverCredits) parsed.serverCredits = {};
      if (!parsed.whatsappTemplate) parsed.whatsappTemplate = DEFAULT_WHATSAPP_TEMPLATE;
      if (!parsed.auth) parsed.auth = { username: 'admin', passwordHash: 'admin', isLogged: false };
      if (!parsed.auditLogs) parsed.auditLogs = [];
      if (!parsed.plans) parsed.plans = [
        { id: '1', name: 'Mensal Standard', price: 35, duration: 'Mensal' },
        { id: '2', name: 'Anual Premium', price: 350, duration: 'Anual' }
      ];
      if (!parsed.supportLinks) parsed.supportLinks = [
        { id: '1', label: 'Check Host', url: 'https://check-host.net', icon: 'Globe' },
        { id: '2', label: 'Speedtest', url: 'https://www.speedtest.net', icon: 'Zap' },
        { id: '3', label: 'DNS Checker', url: 'https://dnschecker.org', icon: 'Search' }
      ];
      if (!parsed.config) {
        parsed.config = { 
          lowCreditThreshold: 5, 
          currency: 'R$', 
          language: 'pt-BR',
          autoRenewCredits: true,
          whatsappTemplates: {
            renewal: DEFAULT_WHATSAPP_TEMPLATE,
            welcome: 'Olá {NOME}! Bem-vindo ao nosso serviço IPTV!',
            expired: 'Olá {NOME}, seu acesso venceu. Vamos renovar?'
          }
        };
      }
      
      // Limpar campos obsoletos
      delete parsed.serverCosts;

      return { ...parsed, auth: { ...parsed.auth, isLogged: false } }; // Force log out on refresh for security
    }
    return {
      customers: MOCK_CUSTOMERS,
      transactions: MOCK_TRANSACTIONS,
      auditLogs: [],
      plans: [
        { id: '1', name: 'Mensal Standard', price: 35, duration: 'Mensal' },
        { id: '2', name: 'Anual Premium', price: 350, duration: 'Anual' }
      ],
      supportLinks: [
        { id: '1', label: 'Check Host', url: 'https://check-host.net', icon: 'Globe' },
        { id: '2', label: 'Speedtest', url: 'https://www.speedtest.net', icon: 'Zap' },
        { id: '3', label: 'DNS Checker', url: 'https://dnschecker.org', icon: 'Search' }
      ],
      servers: SERVERS,
      serverCredits: SERVERS.reduce((acc, s) => ({ ...acc, [s.name]: 10 }), {}),
      auth: { username: 'admin', passwordHash: 'admin', isLogged: false },
      config: { lowCreditThreshold: 5, currency: 'R$', language: 'pt-BR' },
      paymentInfo: DEFAULT_PIX_INFO,
      whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE
    };
  });

  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === state.auth.username && loginForm.pass === state.auth.passwordHash) {
      setState(prev => ({ ...prev, auth: { ...prev.auth, isLogged: true } }));
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      setState(prev => ({ ...prev, auth: { ...prev.auth, isLogged: false } }));
    }
  };

  const handleUpdateAuth = (username: string, pass: string) => {
    setState(prev => ({
      ...prev,
      auth: { ...prev.auth, username, passwordHash: pass }
    }));
    alert('Credenciais de acesso atualizadas com sucesso!');
  };

  const updateConfig = (updates: Partial<AppState['config']>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  };

  const [newServerName, setNewServerName] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [filterServer, setFilterServer] = useState<string>('all');

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Excluir ${selectedCustomers.length} clientes selecionados?`)) {
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => !selectedCustomers.includes(c.id))
      }));
      setSelectedCustomers([]);
    }
  };

  const handleBulkRenew = () => {
     if (confirm(`Renovar ${selectedCustomers.length} clientes selecionados?`)) {
        selectedCustomers.forEach(id => handleRenew(id));
        setSelectedCustomers([]);
     }
  };

  useEffect(() => {
    localStorage.setItem('gestor_iptv_data', JSON.stringify(state));
  }, [state]);

  const handleAddServer = () => {
    if (newServerName && !state.servers.find(s => s.name === newServerName)) {
      const newServer = {
        id: Math.random().toString(36).substr(2, 9),
        name: newServerName,
        defaultCost: 15
      };
      setState(prev => ({ ...prev, servers: [...prev.servers, newServer] }));
      setNewServerName('');
    }
  };

  const handleDeleteServer = (id: string) => {
    const server = state.servers.find(s => s.id === id);
    if (!server) return;
    
    const hasCustomers = state.customers.some(c => c.server === server.name);
    if (hasCustomers) {
      alert('Não é possível excluir um servidor que possui clientes vinculados.');
      return;
    }
    if (confirm(`Excluir servidor ${server.name}?`)) {
      setState(prev => ({ ...prev, servers: prev.servers.filter(s => s.id !== id) }));
    }
  };

  const handleUpdateServer = (id: string, updates: Partial<any>) => {
    setState(prev => {
      const server = prev.servers.find(s => s.id === id);
      if (!server) return prev;
      
      const updatedServers = prev.servers.map(s => s.id === id ? { ...s, ...updates } : s);
      
      // Se o nome mudou, atualizar clientes
      let updatedCustomers = prev.customers;
      if (updates.name && server.name !== updates.name) {
        updatedCustomers = prev.customers.map(c => 
          c.server === server.name ? { ...c, server: updates.name as string } : c
        );
      }
      
      return { 
        ...prev, 
        servers: updatedServers,
        customers: updatedCustomers
      };
    });
  };

  const handleSaveCustomer = (customer: Customer) => {
    setState(prev => {
      const exists = prev.customers.find(c => c.id === customer.id);
      const newCustomers = exists 
        ? prev.customers.map(c => c.id === customer.id ? customer : c)
        : [...prev.customers, { ...customer, createdAt: new Date().toISOString() }];
      
      return { ...prev, customers: newCustomers };
    });
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== id)
      }));
    }
  };

  const openAddForm = () => {
    setEditingCustomer({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      whatsapp: '',
      server: state.servers[0] || '',
      plan: 'Mensal',
      price: 35,
      expiryDate: new Date().toISOString(),
      status: 'active',
      connections: 1,
      createdAt: new Date().toISOString()
    });
    setIsFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSendMessage = (customer: Customer) => {
    let message = state.whatsappTemplate
      .replace(/{NOME}/g, customer.name)
      .replace(/{PLANO}/g, customer.plan)
      .replace(/{VENCIMENTO}/g, new Date(customer.expiryDate).toLocaleDateString('pt-BR'))
      .replace(/{VALOR}/g, customer.price.toFixed(2))
      .replace(/{PIX_KEY}/g, state.paymentInfo.pixKey)
      .replace(/{PIX_NAME}/g, state.paymentInfo.pixName);
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${customer.whatsapp}?text=${encoded}`, '_blank');
  };

  const handleBulkMessage = () => {
    if (selectedCustomers.length === 0) return;
    if (confirm(`Deseja abrir o WhatsApp para ${selectedCustomers.length} clientes em sequência?`)) {
      selectedCustomers.forEach((id, index) => {
        const customer = state.customers.find(c => c.id === id);
        if (customer) {
          setTimeout(() => handleSendMessage(customer), index * 1000);
        }
      });
    }
  };

  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `GESTOR_IPTV_PRO_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog('Backup Gerado', 'O banco de dados foi exportado para arquivo JSON', 'success');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (confirm('RESTAURAR BACKUP? Os dados atuais serão permanentemente substituídos pelos dados do arquivo. Continuar?')) {
            setState({ ...json, auth: { ...json.auth, isLogged: true } });
            alert('Sistema restaurado com sucesso!');
            addLog('Restauração de Sistema', 'Base de dados restaurada via arquivo externo', 'alert');
          }
        } catch (err) { 
          alert('Erro crítico ao ler arquivo.');
        }
      };
      reader.readAsText(file);
    }
  };

  const addLog = (action: string, details: string, type: AuditLog['type'] = 'info') => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      type
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])].slice(0, 100)
    }));
  };

  const handleUpdateCredits = (server: string, amount: number) => {
    const current = state.serverCredits?.[server] || 0;
    if (current !== amount) {
      addLog('Ajuste de Crédito', `${server}: ${current} -> ${amount}`, 'warning');
    }
    setState(prev => ({
      ...prev,
      serverCredits: {
        ...(prev.serverCredits || {}),
        [server]: amount
      }
    }));
  };

  const handleUpdateCost = (server: string, cost: number) => {
    setState(prev => ({
      ...prev,
      serverCosts: {
        ...(prev.serverCosts || {}),
        [server]: cost
      }
    }));
  };

  const handleRenew = (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    // Reduzir crédito se configurado
    if (state.serverCredits && (state.serverCredits[customer.server] || 0) > 0) {
       handleUpdateCredits(customer.server, state.serverCredits[customer.server] - 1);
    }

    const newExpiry = new Date(customer.expiryDate);
    if (customer.plan === 'Mensal') newExpiry.setMonth(newExpiry.getMonth() + 1);
    else if (customer.plan === 'Trimestral') newExpiry.setMonth(newExpiry.getMonth() + 3);
    else if (customer.plan === 'Semestral') newExpiry.setMonth(newExpiry.getMonth() + 6);
    else if (customer.plan === 'Anual') newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    const costPerCredit = state.servers.find(s => s.name === customer.server)?.defaultCost || 0;
    
    addLog('Renovação', `${customer.name} (${customer.server})`, 'success');

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: `Renovação: ${customer.name}`,
      amount: customer.price,
      type: 'income',
      category: 'renewal'
    };

    const costTransaction: Transaction | null = costPerCredit > 0 ? {
       id: Math.random().toString(36).substr(2, 9),
       date: new Date().toISOString(),
       description: `Custo Crédito (${customer.server}): ${customer.name}`,
       amount: costPerCredit,
       type: 'expense',
       category: 'credits'
    } : null;

    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => 
        c.id === customerId ? { ...c, expiryDate: newExpiry.toISOString(), status: 'active' } : c
      ),
      transactions: costTransaction ? [...prev.transactions, newTransaction, costTransaction] : [...prev.transactions, newTransaction]
    }));
  };

  // Analytics
  const analytics = useMemo(() => {
    const today = new Date();
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const d = subDays(today, 29 - i);
      const dayIncome = state.transactions
        .filter(t => t.type === 'income' && isSameDay(new Date(t.date), d))
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        date: format(d, 'dd/MM'),
        value: dayIncome
      };
    });

    const serverDistribution = state.servers.map(s => ({
      name: s.name,
      value: state.customers.filter(c => c.server === s.name).length
    }));

    const totalRevenue = state.transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalExpenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const monthlyRevenue = state.transactions
      .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), {
        start: startOfMonth(today),
        end: endOfMonth(today)
      }))
      .reduce((acc, t) => acc + t.amount, 0);

    const monthlyExpenses = state.transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), {
        start: startOfMonth(today),
        end: endOfMonth(today)
      }))
      .reduce((acc, t) => acc + t.amount, 0);

    const activeCount = state.customers.filter(c => c.status === 'active').length;
    const totalConnections = state.customers.reduce((acc, c) => acc + (c.connections || 1), 0);
    const ticketMedio = activeCount > 0 ? (monthlyRevenue / activeCount) : 0;
    const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;

    return {
      last30Days,
      serverDistribution,
      totalRevenue,
      totalExpenses,
      monthlyRevenue,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      profit: totalRevenue - totalExpenses,
      ticketMedio,
      roi,
      totalConnections
    };
  }, [state]);

  const filteredCustomers = state.customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.server.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsapp.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' ? true : c.status === filterStatus;
    const matchesServer = filterServer === 'all' ? true : c.server === filterServer;

    return matchesSearch && matchesStatus && matchesServer;
  });

  const expiringToday = state.customers.filter(c => isSameDay(new Date(c.expiryDate), new Date()));
  const expired = state.customers.filter(c => new Date(c.expiryDate) < new Date() && !isSameDay(new Date(c.expiryDate), new Date()));
  const expiringSoon = (days: number) => state.customers.filter(c => {
    const d = new Date(c.expiryDate);
    const today = new Date();
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff > 0 && diff <= days;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10';
      case 'expiring': return 'text-amber-400 bg-amber-400/10';
      case 'expired': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-zinc-400 bg-zinc-400/10';
    }
  };

  if (!state.auth.isLogged) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 selection:bg-emerald-500/30">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4 rotate-3">
              <LayoutDashboard className="w-8 h-8 text-zinc-950" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-zinc-100">GESTOR <span className="text-emerald-400 font-mono tracking-normal">IPTV</span></h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold opacity-60 italic">Versão Pro • Elite</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Acesso ao Painel</label>
              <input 
                type="text" 
                placeholder="Usuário"
                autoComplete="username"
                value={loginForm.user}
                onChange={e => setLoginForm({...loginForm, user: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700"
              />
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Senha de Acesso"
                  autoComplete="current-password"
                  value={loginForm.pass}
                  onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl text-center"
                >
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Credenciais Inválidas</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              className="w-full py-4 bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Entrar no Sistema
            </button>
          </form>

          <p className="text-center text-[9px] text-zinc-600 uppercase font-medium">Dados protegidos por criptografia local</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-zinc-950" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Gestor <span className="text-emerald-400">IPTV</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Lucro Real</span>
                <span className={analytics.profit >= 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                  R$ {analytics.profit.toFixed(2)}
                </span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Base Ativa</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{state.customers.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Vencendo Hoje</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{expiringToday.length}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Inadimplentes</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-400">{expired.length}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Lucro Mês</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">R$ {analytics.monthlyProfit.toFixed(0)}</p>
                </div>
              </div>

              {/* Advanced KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/20 rounded-2xl">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Ticket Médio</span>
                      <Target className="w-3 h-3 text-emerald-500" />
                   </div>
                   <p className="text-lg font-bold">R$ {analytics.ticketMedio.toFixed(2)}</p>
                   <p className="text-[9px] text-zinc-500">Média por cliente ativo</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-zinc-900 border border-blue-500/20 rounded-2xl">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-blue-500 uppercase font-bold tracking-widest">Total de Telas</span>
                      <CreditCard className="w-3 h-3 text-blue-500" />
                   </div>
                   <p className="text-lg font-bold">{analytics.totalConnections}</p>
                   <p className="text-[9px] text-zinc-500">Conexões simultâneas ativas</p>
                </div>
              </div>

              {/* Threshold Credit Alert */}
              {state.servers.some(s => (state.serverCredits?.[s.name] || 0) < state.config.lowCreditThreshold) && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                   <AlertCircle className="w-5 h-5 text-amber-500" />
                   <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Atenção ao Estoque</p>
                      <p className="text-[10px] text-zinc-400">Alguns servidores estão abaixo do limite configurado ({state.config.lowCreditThreshold} créditos).</p>
                   </div>
                </div>
              )}

              {/* Chart Section */}
              <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Fluxo de Renovação (30d)
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Volume de ingressos diários em R$</p>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.last30Days}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        minTickGap={20}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', fontSize: '12px' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Urgent Tasks */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2 text-zinc-500 uppercase tracking-widest">
                  Ações Prioritárias
                </h2>
                
                <div className="space-y-3">
                  {[
                    { title: 'Hoje', list: expiringToday, color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
                    { title: 'Vencidos', list: expired, color: 'text-rose-400 border-rose-400/20 bg-rose-400/5' },
                  ].map((group, idx) => group.list.length > 0 && (
                    <div key={idx} className="space-y-2">
                      <div className={cn("text-[10px] font-black uppercase py-1.5 px-3 rounded-full border inline-block w-auto", group.color)}>
                        {group.title} ({group.list.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         {group.list.map(c => (
                           <div key={c.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{c.name}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{c.server} • {c.plan}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleSendMessage(c)}
                                  className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 rounded-xl transition-all active:scale-95"
                                  title="Cobrar WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRenew(c.id)}
                                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl transition-all active:scale-95"
                                  title="Renovar"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}

                  {expiringToday.length === 0 && expired.length === 0 && (
                    <div className="p-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-zinc-300">Tudo Ok!</h3>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Nenhuma cobrança pendente para agora.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {selectedCustomers.length > 0 && (
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-sm bg-emerald-500 text-zinc-950 p-4 rounded-[24px] shadow-2xl z-50 flex items-center justify-between"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest pl-2">
                    {selectedCustomers.length} Selecionados
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleBulkMessage}
                      className="px-3 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3" /> Cobrar
                    </button>
                    <button 
                       onClick={() => setSelectedCustomers([])}
                       className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                    >
                       <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 shadow-inner shadow-black/20">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Nome, zap ou servidor..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none flex-1 text-sm text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                  <button 
                    onClick={openAddForm}
                    className="w-12 h-12 bg-emerald-500 rounded-2xl text-zinc-950 flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-90 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {(['all', 'active', 'expiring', 'expired'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                        filterStatus === status 
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {status === 'all' ? 'Todos Status' : status === 'active' ? 'Ativos' : status === 'expiring' ? 'Vencendo' : 'Vencidos'}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-zinc-800 mx-1 shrink-0" />
                  <button
                    onClick={() => setFilterServer('all')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                      filterServer === 'all' 
                        ? "bg-zinc-100 border-zinc-100 text-zinc-950" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    Servidor: Todos
                  </button>
                  {state.servers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFilterServer(s.name)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                        filterServer === s.name 
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {selectedCustomers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-emerald-400">
                      {selectedCustomers.length} selecionados
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleBulkRenew}
                        className="px-3 py-1.5 bg-blue-500 text-zinc-950 text-[10px] font-black uppercase rounded-lg hover:bg-blue-400 transition-all"
                      >
                        Renovar Lote
                      </button>
                      <button 
                        onClick={handleBulkMessage}
                        className="px-3 py-1.5 bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-400 transition-all"
                      >
                        Cobrar em Massa
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 bg-rose-500 text-zinc-950 text-[10px] font-black uppercase rounded-lg hover:bg-rose-400 transition-all"
                      >
                        Excluir
                      </button>
                      <button 
                        onClick={() => setSelectedCustomers([])}
                        className="p-1.5 text-zinc-500 hover:text-zinc-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCustomers.map((c, i) => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-5 bg-zinc-900/50 border rounded-3xl flex flex-col gap-4 group transition-all relative",
                      selectedCustomers.includes(c.id) ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-zinc-700"
                    )}
                    onClick={() => toggleSelect(c.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border transition-colors",
                          selectedCustomers.includes(c.id) ? "bg-emerald-500 text-zinc-950 border-emerald-400" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          {selectedCustomers.includes(c.id) ? <CheckCircle2 className="w-5 h-5" /> : c.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{c.name}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">{c.whatsapp}</span>
                             <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">{c.connections} {c.connections === 1 ? 'Tela' : 'Telas'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditForm(c)}
                          className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Status / Expira</span>
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", c.status === 'active' ? 'bg-emerald-500' : c.status === 'expiring' ? 'bg-amber-500' : 'bg-rose-500')} />
                           <span className="text-xs text-zinc-300 font-bold">{new Date(c.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Servidor / Plano</span>
                        <span className="text-xs text-zinc-300 font-bold truncate">{c.server} <span className="opacity-50">• {c.plan}</span></span>
                      </div>
                    </div>

                    {c.notes && (
                      <div className="px-1 line-clamp-2 text-[11px] text-zinc-500 italic">
                         "{c.notes}"
                      </div>
                    )}

                      <div className="flex items-center gap-2 mt-auto">
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleSendMessage(c); }}
                           className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-zinc-950 transition-all active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" /> Cobrar
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleRenew(c.id); }}
                           className="flex-1 py-2.5 bg-zinc-800 text-zinc-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-700"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Renovar
                        </button>
                      </div>
                    </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] shadow-2xl shadow-emerald-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <Box className="w-6 h-6 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-emerald-400">Total Telas</span>
                  </div>
                  <p className="text-3xl font-black italic">{(state.customers.length * 1.1).toFixed(0)}</p>
                  <p className="text-xs text-zinc-500 font-medium tracking-tight">Capacidade total utilizada estimada</p>
                </div>
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[32px] shadow-2xl shadow-rose-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <span className="text-[10px] font-black uppercase text-rose-400">Alerta Estoque</span>
                  </div>
                  <p className="text-3xl font-black italic">{state.servers.filter(s => (state.serverCredits?.[s.name] || 0) < state.config.lowCreditThreshold).length}</p>
                  <p className="text-xs text-zinc-500 font-medium tracking-tight">Servidores em nível crítico</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 px-2 italic">Gerenciamento de Créditos</h3>
                <div className="grid grid-cols-1 gap-4">
                  {state.servers.map(server => (
                    <div key={server.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[32px] flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                          (state.serverCredits?.[server.name] || 0) < state.config.lowCreditThreshold 
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        )}>
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg tracking-tight">{server.name}</h4>
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                               (state.serverCredits?.[server.name] || 0) < state.config.lowCreditThreshold ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
                             )}>
                               {state.serverCredits?.[server.name] || 0} UNI
                             </span>
                             <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Custo/Créd: {state.config.currency} {server.defaultCost}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdateCredits(server.name, (state.serverCredits?.[server.name] || 0) + 10)}
                        className="px-5 py-3 bg-zinc-950 border border-zinc-800 text-zinc-100 text-[10px] font-black uppercase rounded-2xl hover:border-emerald-500 hover:text-emerald-400 transition-all shadow-xl active:scale-95"
                      >
                        + 10 CRÉDITOS
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 px-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" /> LOGS DE ATIVIDADE
                 </h3>
                 <div className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] overflow-hidden">
                    {state.auditLogs && state.auditLogs.length === 0 ? (
                      <div className="p-16 text-center">
                        <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">Nenhuma atividade registrada pelo Kernel</p>
                      </div>
                    ) : (
                      state.auditLogs?.slice(0, 10).map((log, i) => (
                        <div key={log.id} className={cn(
                          "p-5 flex items-start gap-4 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-all",
                          i === 0 ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" : ""
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shadow-lg",
                            log.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/40' : 
                            log.type === 'warning' ? 'bg-amber-500 shadow-amber-500/40' :
                            log.type === 'alert' ? 'bg-rose-500 shadow-rose-500/40' : 'bg-blue-500 shadow-blue-500/40'
                          )} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black uppercase text-zinc-200 tracking-tight">{log.action}</span>
                              <span className="text-[9px] text-zinc-600 font-mono italic font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">{log.details}</p>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div 
               key="finance"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
            >
              <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
                {(['transactions', 'reports'] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setFinanceSubTab(sub)}
                    className={cn(
                      "px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                      financeSubTab === sub 
                        ? "bg-zinc-100 border-zinc-100 text-zinc-950" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {sub === 'transactions' ? 'Extrato de Fluxo' : 'Business Analytics'}
                  </button>
                ))}
              </div>
              
              {financeSubTab === 'transactions' ? (
                <motion.div 
                  key="st-finance-transactions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold flex items-center gap-2">
                         <BarChart3 className="w-5 h-5 text-emerald-400" />
                         Receita nos últimos 30 dias
                      </h3>
                      <div className="text-right">
                         <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Total Líquido</span>
                         <p className="text-xl font-black text-emerald-400">R$ {analytics.profit.toFixed(0)}</p>
                      </div>
                   </div>
                   <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={analytics.last30Days}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                            <Tooltip 
                               cursor={{ fill: '#27272a' }}
                               contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col justify-center items-center">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Servidores</h3>
                   <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={analytics.serverDistribution}
                               innerRadius={40}
                               outerRadius={60}
                               paddingAngle={5}
                               dataKey="value"
                            >
                               {analytics.serverDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} />
                               ))}
                            </Pie>
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                            />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="mt-4 space-y-1 w-full">
                      {analytics.serverDistribution.map((s, i) => (
                         <div key={s.name} className="flex items-center justify-between text-[10px] uppercase font-bold">
                            <span className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4] }} />
                               {s.name}
                            </span>
                            <span className="text-zinc-500">{s.value} cli</span>
                         </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Bruto Total</p>
                    <p className="text-xl font-bold">R$ {analytics.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Despesas Total</p>
                    <p className="text-xl font-bold text-rose-400">R$ {analytics.totalExpenses.toFixed(0)}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Custo Médio/Cli</p>
                    <p className="text-xl font-bold text-amber-400">R$ {(analytics.totalExpenses / (state.customers.length || 1)).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">ROI Global</p>
                    <p className="text-xl font-bold text-emerald-400">{analytics.roi.toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Histórico de Caixa</h3>
                  <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4 text-emerald-400" /> Novo Lançamento
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {[...state.transactions].reverse().map(t => (
                    <div key={t.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center", 
                            t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                         )}>
                            {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-sm">{t.description}</span>
                            <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                              {format(new Date(t.date), 'dd MMM yyyy')} • {t.category}
                            </span>
                         </div>
                      </div>
                      <span className={cn("font-mono font-bold", t.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            ) : (
                <motion.div 
                  key="st-finance-reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                   <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[40px] shadow-2xl">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                           <h3 className="text-2xl font-black italic tracking-tighter">ANALYTICS <span className="text-emerald-500">PRO</span></h3>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Inteligência de Mercado em Tempo Real</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-emerald-500/20" />
                      </div>

                      <div className="h-64 mt-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.last30Days}>
                               <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '10px' }}
                                  itemStyle={{ fontWeight: '900', textTransform: 'uppercase' }}
                               />
                               <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Distribuição de Infra</h4>
                         <div className="space-y-4">
                            {analytics.serverDistribution.map(s => (
                              <div key={s.name} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-zinc-300 uppercase tracking-tight">{s.name}</span>
                                    <span className="text-[10px] font-bold text-emerald-400">{((s.value / (state.customers.length || 1)) * 100).toFixed(0)}%</span>
                                 </div>
                                 <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden shadow-inner">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(s.value / (state.customers.length || 1)) * 100}%` }}
                                      className="h-full bg-emerald-500 rounded-full"
                                    />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] flex flex-col justify-center items-center">
                         <div className="w-16 h-16 bg-blue-500/10 rounded-[20px] flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                            <Target className="w-8 h-8" />
                         </div>
                         <h4 className="text-2xl font-black italic tracking-tighter">ALVO DE RETENÇÃO: 95%</h4>
                         <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">Base estável e saudável</p>
                      </div>
                   </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div 
               key="support"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="space-y-6"
            >
              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[32px] text-center space-y-4">
                 <Shield className="w-12 h-12 text-emerald-400 mx-auto" />
                 <h2 className="text-xl font-black italic tracking-tighter">CENTRAL DE APOIO TÉCNICO</h2>
                 <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Ferramentas de Diagnóstico Externo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {state.supportLinks.map(link => (
                    <a 
                      key={link.id} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[28px] flex items-center justify-between hover:border-emerald-500/30 transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors">
                             <Globe className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="font-black text-sm uppercase tracking-widest">{link.label}</h4>
                             <p className="text-[10px] text-zinc-600 font-bold">Abrir ferramenta externa</p>
                          </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
                          <Plus className="w-4 h-4 rotate-45" />
                       </div>
                    </a>
                 ))}
              </div>

              <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] space-y-4">
                 <h3 className="font-black text-xs uppercase tracking-widest text-emerald-400">Dicas de Troubleshooting</h3>
                 <ul className="space-y-2">
                    <li className="text-[11px] text-zinc-400 flex items-center gap-2">
                       <span className="w-1 h-1 bg-emerald-500 rounded-full" /> Sempre verifique a rota com o Check Host antes de trocar o servidor.
                    </li>
                    <li className="text-[11px] text-zinc-400 flex items-center gap-2">
                       <span className="w-1 h-1 bg-emerald-500 rounded-full" /> Testes de velocidade devem ser feitos preferencialmente via cabo.
                    </li>
                 </ul>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6 pb-32"
            >
              {/* Settings Sub-tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
                {(['profile', 'servers', 'plans', 'messages', 'system'] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSettingsSubTab(sub as any)}
                    className={cn(
                      "px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                      settingsSubTab === sub 
                        ? "bg-zinc-100 border-zinc-100 text-zinc-950" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {sub === 'profile' ? 'Segurança' : sub === 'servers' ? 'Servidores' : sub === 'plans' ? 'Planos' : sub === 'messages' ? 'Mensagens' : 'Sistema'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {settingsSubTab === 'profile' && (
                  <motion.div key="st-set-profile" className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] overflow-hidden">
                      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-5 h-5 text-emerald-400" />
                          Conta Administrativa
                        </h3>
                        <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-zinc-950 transition-all">Encerrar Sessão</button>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Usuário Master</label>
                          <input 
                            type="text" 
                            value={state.auth.username}
                            onChange={(e) => handleUpdateAuth(e.target.value, state.auth.passwordHash)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Senha de Acesso</label>
                          <div className="relative group">
                            <input 
                              type={showSettingsPassword ? "text" : "password"} 
                              placeholder="••••••••"
                              onBlur={(e) => e.target.value && handleUpdateAuth(state.auth.username, e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all shadow-inner pr-14"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-emerald-400 transition-colors"
                            >
                              {showSettingsPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsSubTab === 'servers' && (
                  <motion.div key="st-set-servers" className="space-y-6">
                     <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] space-y-8 shadow-2xl">
                        <div className="flex gap-4">
                           <input 
                              type="text" 
                              placeholder="Título do Servidor (ex: P2P Elite)"
                              value={newServerName}
                              onChange={(e) => setNewServerName(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none focus:border-emerald-500 transition-all shadow-inner"
                           />
                           <button 
                              onClick={handleAddServer}
                              className="w-14 h-14 bg-emerald-500 text-zinc-950 rounded-2xl flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group"
                           >
                              <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                           </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           {state.servers.map(server => (
                              <div key={server.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-[24px] space-y-6 transition-all group shadow-lg">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                          <Server className="w-6 h-6" />
                                       </div>
                                       <div>
                                          <input 
                                             type="text"
                                             value={server.name}
                                             onChange={(e) => handleUpdateServer(server.id, { name: e.target.value })}
                                             className="bg-transparent border-none outline-none font-black text-zinc-100 text-xl w-full focus:text-emerald-400 transition-colors"
                                          />
                                          <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">UID: {server.id}</p>
                                       </div>
                                    </div>
                                    <button 
                                       onClick={() => handleDeleteServer(server.id)}
                                       className="p-3 text-zinc-700 hover:text-rose-500 transition-all bg-zinc-900 rounded-xl"
                                    >
                                       <Trash2 className="w-5 h-5" />
                                    </button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                       <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest pl-2">Custo Unitário</label>
                                       <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 text-xs font-bold font-mono">{state.config.currency}</span>
                                          <input 
                                             type="number"
                                             value={server.defaultCost}
                                             onChange={(e) => handleUpdateServer(server.id, { defaultCost: Number(e.target.value) })}
                                             className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-rose-400 outline-none focus:border-rose-400/50 transition-all"
                                          />
                                       </div>
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest pl-2">Saldo Atual</label>
                                       <div className="flex items-center gap-2">
                                          <div className="relative flex-1">
                                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 text-xs font-bold font-mono">UN</span>
                                             <input 
                                                type="number"
                                                value={state.serverCredits?.[server.name] || 0}
                                                onChange={(e) => handleUpdateCredits(server.name, Number(e.target.value))}
                                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                                             />
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </motion.div>
                )}

                {settingsSubTab === 'plans' && (
                  <motion.div key="st-set-plans" className="space-y-6">
                    <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] space-y-6">
                       <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 px-1">Tabela de Preços e Prazos</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {state.plans.map(plan => (
                             <div key={plan.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between group">
                                <div>
                                   <h4 className="font-black text-zinc-100">{plan.name}</h4>
                                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{plan.duration} • {state.config.currency} {plan.price}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button className="p-2 text-zinc-700 hover:text-emerald-400"><Settings className="w-4 h-4" /></button>
                                   <button className="p-2 text-zinc-700 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </div>
                          ))}
                          <button className="p-6 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all">
                             <Plus className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Novo Plano</span>
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}

                {settingsSubTab === 'messages' && (
                  <motion.div key="st-set-messages" className="space-y-6">
                     <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] space-y-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Script de Renovação</label>
                           <textarea 
                              value={state.whatsappTemplate}
                              onChange={(e) => setState(prev => ({ ...prev, whatsappTemplate: e.target.value }))}
                              className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-[32px] px-8 py-8 text-sm focus:border-emerald-500 outline-none transition-all font-mono resize-none leading-relaxed shadow-inner"
                           />
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {['{NOME}', '{PLANO}', '{VENCIMENTO}', '{VALOR}', '{PIX_KEY}', '{PIX_NAME}'].map(tag => (
                              <span key={tag} className="px-4 py-2 bg-zinc-800/50 rounded-2xl text-[10px] font-black text-zinc-500 border border-zinc-700/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">{tag}</span>
                           ))}
                        </div>
                     </div>

                     <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[32px] space-y-6">
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Dados Bancários para Mensagens</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Chave Masters (PIX)</label>
                             <input 
                                type="text" 
                                value={state.paymentInfo.pixKey}
                                onChange={(e) => setState(prev => ({ ...prev, paymentInfo: { ...prev.paymentInfo, pixKey: e.target.value } }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-emerald-500 outline-none transition-all"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Identificação Favorecido</label>
                             <input 
                                type="text" 
                                value={state.paymentInfo.pixName}
                                onChange={(e) => setState(prev => ({ ...prev, paymentInfo: { ...prev.paymentInfo, pixName: e.target.value } }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-emerald-500 outline-none transition-all"
                             />
                          </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {settingsSubTab === 'system' && (
                  <motion.div key="st-set-system" className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[32px] space-y-4">
                           <div className="flex items-center gap-3 mb-2">
                              <Shield className="w-6 h-6 text-emerald-400" />
                              <h4 className="font-black text-sm uppercase tracking-widest">Protocolo de Dados</h4>
                           </div>
                           <p className="text-xs text-zinc-500 leading-relaxed italic">Todos os seus registros são armazenados localmente no navegador por questões de privacidade e performance.</p>
                           <div className="flex flex-col gap-2 pt-4">
                             <button onClick={exportBackup} className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-emerald-500 transition-all group">
                                <span className="text-[10px] font-black uppercase tracking-widest">Gerar Backup Global</span>
                                <Download className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400" />
                             </button>
                             <label className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-blue-500 transition-all group cursor-pointer">
                                <span className="text-[10px] font-black uppercase tracking-widest">Restaurar do Arquivo</span>
                                <Upload className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                                <input type="file" className="hidden" accept=".json" onChange={importBackup} />
                             </label>
                           </div>
                        </div>

                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[32px] space-y-6">
                           <h4 className="font-black text-sm uppercase tracking-widest mb-2">Preferências Globais</h4>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black uppercase text-zinc-500">Unidade Monetária</span>
                                 <select 
                                    value={state.config.currency}
                                    onChange={(e) => updateConfig({ currency: e.target.value })}
                                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black"
                                 >
                                    <option value="R$">BRL (R$)</option>
                                    <option value="US$">USD ($)</option>
                                    <option value="€">EUR (€)</option>
                                 </select>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black uppercase text-zinc-500">Alerta de Renovação</span>
                                 <input 
                                    type="number"
                                    value={state.config.lowCreditThreshold}
                                    onChange={(e) => updateConfig({ lowCreditThreshold: Number(e.target.value) })}
                                    className="w-16 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-[10px] font-black"
                                 />
                              </div>
                              <div className="pt-4 border-t border-zinc-800 flex justify-center">
                                 <p className="text-[9px] font-black text-zinc-700 uppercase italic">V2.5.0 - Antigravity Engine Active</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Rail */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-[32px] flex items-center justify-around shadow-2xl shadow-black z-40">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
          { id: 'customers', icon: Users, label: 'Clientes' },
          { id: 'inventory', icon: Box, label: 'Estoque' },
          { id: 'finance', icon: DollarSign, label: 'Caixa' },
          { id: 'support', icon: Shield, label: 'Suporte' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-[64px]",
              activeTab === item.id ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-bg"
                className="absolute inset-0 bg-emerald-500/10 rounded-2xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon className="w-5 h-5 relative z-10" />
            <span className="text-[9px] font-black uppercase tracking-tighter relative z-10">{item.label}</span>
            {item.id === 'dashboard' && (expiringToday.length > 0 || expired.length > 0) && (
              <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50" />
            )}
            {(item.id === 'inventory' || item.id === 'settings') && state.servers.some(s => (state.serverCredits?.[s.name] || 0) < state.config.lowCreditThreshold) && (
              <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
            )}
          </button>
        ))}
      </nav>

      {/* Customer Form Modal */}
      <AnimatePresence>
        {isFormOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsFormOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-100">
                  {state.customers.some(c => c.id === editingCustomer.id) ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      type="text" 
                      value={editingCustomer.name}
                      onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-colors"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 5511999999999"
                      value={editingCustomer.whatsapp}
                      onChange={e => setEditingCustomer({...editingCustomer, whatsapp: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Servidor</label>
                    <div className="relative">
                      <select 
                        value={editingCustomer.server}
                        onChange={e => setEditingCustomer({...editingCustomer, server: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none appearance-none transition-colors pr-10"
                      >
                        {state.servers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Plano</label>
                    <select 
                      value={editingCustomer.plan}
                      onChange={e => setEditingCustomer({...editingCustomer, plan: e.target.value as any})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none appearance-none transition-colors"
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Valor da Venda</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold">R$</span>
                      <input 
                        type="number" 
                        value={editingCustomer.price}
                        onChange={e => setEditingCustomer({...editingCustomer, price: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Telas (Conexões)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      value={editingCustomer.connections || 1}
                      onChange={e => setEditingCustomer({...editingCustomer, connections: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Próx. Vencimento</label>
                    <input 
                      type="date" 
                      value={editingCustomer.expiryDate.split('T')[0]}
                      onChange={e => setEditingCustomer({...editingCustomer, expiryDate: new Date(e.target.value).toISOString()})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Anotações Internas</label>
                  <textarea 
                    value={editingCustomer.notes || ''}
                    onChange={e => setEditingCustomer({...editingCustomer, notes: e.target.value})}
                    placeholder="Algo importante sobre este cliente?"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:border-emerald-500 outline-none h-24 resize-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex gap-3">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 hover:text-zinc-100 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleSaveCustomer(editingCustomer)}
                  className="flex-[2] py-4 bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
