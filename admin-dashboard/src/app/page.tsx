"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Users, Activity, Server } from 'lucide-react';
import { ClientTable } from '@/components/ClientTable';
import { AddClientDialog } from '@/components/AddClientDialog';
import { EditClientDialog } from '@/components/EditClientDialog';
import { ClientDetailsSheet } from '@/components/ClientDetailsSheet';
import { ToastContainer } from '@/components/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/useToast';
import { api, Client } from '@/lib/api';

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Toast notifications
  const toast = useToast();

  // Load data
  const loadClients = async () => {
    try {
      const response = await api.getClients();
      setClients(response.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erreur lors du chargement des clients');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData as Record<string, any>);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      await Promise.all([loadClients(), loadStats()]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData(false);
    setIsRefreshing(false);
    toast.success('Données actualisées');
  };

  // Initial load
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Event handlers
  const handleClientCreated = () => {
    loadData();
    toast.success('Client créé avec succès !');
  };

  const handleClientUpdated = () => {
    loadData();
    toast.success('Client mis à jour avec succès !');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsSheet(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    try {
      await api.deleteClient(clientId);
      loadData();
      toast.success('Client supprimé avec succès');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression du client');
    }
  };

  const handleTestConnection = async (clientId: number) => {
    try {
      const result = await api.testMontyConnection(clientId);
      if (result.success) {
        toast.success('Connexion Monty réussie ! Token mis à jour.');
        loadData(); // Refresh to show updated token status
      } else {
        toast.error(`Échec de la connexion Monty: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erreur lors du test de connexion Monty');
    }
  };

  // Stats calculations
  const activeClients = clients.filter(c => c.active).length;
  const validTokens = clients.filter(c => c.token_status === 'valid').length;
  const expiredTokens = clients.filter(c => c.token_status === 'expired').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="SimWeGo Logo"
                width={100}
                height={36}
                className="rounded-lg object-contain"
                priority
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Dashboard Admin SimWeGo</h1>
                <p className="text-sm text-muted-foreground">Gestion des clients et intégration Monty eSIM</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={refreshData}
                disabled={isRefreshing}
                className="hover:bg-accent/50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeClients} actifs
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Valides</CardTitle>
              <Activity className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{validTokens}</div>
              <p className="text-xs text-muted-foreground">
                Connexions Monty actives
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Expirés</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{expiredTokens}</div>
              <p className="text-xs text-muted-foreground">
                À renouveler
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status API</CardTitle>
              <Server className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="default" className="simwego-gradient text-white border-0">En ligne</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                SimWeGo API opérationnelle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Clients SimWeGo</CardTitle>
                <CardDescription>
                  Gérez vos clients et leurs intégrations Monty
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ClientTable
              clients={clients}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onTest={handleTestConnection}
              onView={handleViewClient}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 simwego-gradient hover:scale-110 text-white border-0"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialogs */}
      <AddClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onClientCreated={handleClientCreated}
      />

      <EditClientDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onClientUpdated={handleClientUpdated}
        client={selectedClient}
      />

      <ClientDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        client={selectedClient}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        onTest={handleTestConnection}
      />
    </div>
  );
}
