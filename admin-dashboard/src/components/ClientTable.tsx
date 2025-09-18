"use client";

import { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, TestTube, Eye } from 'lucide-react';
import { Client } from '@/lib/api';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: number) => void;
  onTest: (clientId: number) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

export function ClientTable({ 
  clients, 
  onEdit, 
  onDelete, 
  onTest, 
  onView, 
  isLoading = false 
}: ClientTableProps) {
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const getStatusBadge = (status: string, active: boolean) => {
    if (!active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="simwego-light-blue text-white border-0" style={{backgroundColor: '#81ceef'}}>Valid</Badge>;
      case 'expired':
        return <Badge variant="default" className="simwego-blue text-white border-0" style={{backgroundColor: '#015ea9'}}>Expired</Badge>;
      default:
        return <Badge variant="outline" className="border-muted-foreground/30">No Token</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteClient) {
      onDelete(deleteClient.id);
      setDeleteClient(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Monty User</TableHead>
              <TableHead>Token Status</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {clients.length === 0 ? "Aucun client trouvé" : `${clients.length} client(s) total`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Monty User</TableHead>
              <TableHead className="w-[120px]">Token Status</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucun client trouvé
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30 transition-colors duration-200">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">#{client.id}</TableCell>
                  <TableCell>
                    <Badge variant={client.active ? "default" : "secondary"}>
                      {client.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.monty_username}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.token_status, client.active)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(client.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(client)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTest(client.id)}>
                          <TestTube className="mr-2 h-4 w-4" />
                          Test Monty
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteClient(client)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client &quot;{deleteClient?.name}&quot; ? 
              Cette action est irréversible et supprimera également tous ses tokens associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}