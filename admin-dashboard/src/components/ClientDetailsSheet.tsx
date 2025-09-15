"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Edit, TestTube, Trash2 } from 'lucide-react';
import { Client } from '@/lib/api';

interface ClientDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onDelete: (clientId: number) => void;
  onTest: (clientId: number) => void;
}

export function ClientDetailsSheet({ 
  open, 
  onOpenChange, 
  client, 
  onEdit, 
  onDelete, 
  onTest 
}: ClientDetailsSheetProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could show a toast notification here
  };

  const getStatusBadge = (status: string, active: boolean) => {
    if (!active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500">Token Valide</Badge>;
      case 'expired':
        return <Badge variant="destructive">Token Expiré</Badge>;
      default:
        return <Badge variant="outline">Aucun Token</Badge>;
    }
  };

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Client #{client.id} - {client.name}</SheetTitle>
          <SheetDescription>
            Détails complets du client et de ses informations Monty
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Status
                {getStatusBadge(client.token_status, client.active)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Compte actif:</span>
                  <Badge variant={client.active ? "default" : "secondary"}>
                    {client.active ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Token Monty:</span>
                  <span className="text-sm font-medium">{client.token_status}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Key:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(client.api_key)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block break-all">
                  {client.api_key}
                </code>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">Monty Username:</span>
                <div className="text-sm font-medium mt-1">{client.monty_username}</div>
              </div>
            </CardContent>
          </Card>

          {/* Monty Integration Card */}
          {(client.agent_id || client.reseller_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intégration Monty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.agent_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agent ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {client.agent_id}
                    </code>
                  </div>
                )}
                {client.reseller_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reseller ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {client.reseller_id}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Créé le:</span>
                <div className="text-sm font-medium">{formatDate(client.created_at)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modifié le:</span>
                <div className="text-sm font-medium">{formatDate(client.updated_at)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              onClick={() => onEdit(client)}
              className="w-full justify-start"
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier le client
            </Button>
            
            <Button
              onClick={() => onTest(client.id)}
              className="w-full justify-start"
              variant="outline"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Tester la connexion Monty
            </Button>
            
            <Button
              onClick={() => onDelete(client.id)}
              className="w-full justify-start text-red-600 hover:text-red-700"
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le client
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}