"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import { api, Client, UpdateClientData } from '@/lib/api';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
  client: Client | null;
}

export function EditClientDialog({ open, onOpenChange, onClientUpdated, client }: EditClientDialogProps) {
  const [formData, setFormData] = useState<UpdateClientData>({
    name: '',
    monty_username: '',
    monty_password: '',
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        monty_username: client.monty_username,
        monty_password: '', // Don't pre-fill password for security
        active: client.active
      });
    }
  }, [client]);

  const resetForm = () => {
    setFormData({
      name: '',
      monty_username: '',
      monty_password: '',
      active: true
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom du client est requis';
    }
    
    if (!formData.monty_username?.trim()) {
      newErrors.monty_username = 'Le nom d&apos;utilisateur Monty est requis';
    }
    
    // Password is optional for updates
    if (formData.monty_password && formData.monty_password.length < 6) {
      newErrors.monty_password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Only send changed fields
      const updateData: UpdateClientData = {};
      
      if (formData.name !== client.name) {
        updateData.name = formData.name;
      }
      
      if (formData.monty_username !== client.monty_username) {
        updateData.monty_username = formData.monty_username;
      }
      
      if (formData.monty_password) {
        updateData.monty_password = formData.monty_password;
      }
      
      if (formData.active !== client.active) {
        updateData.active = formData.active;
      }

      await api.updateClient(client.id, updateData);
      
      resetForm();
      onOpenChange(false);
      onClientUpdated();
    } catch (error) {
      console.error('Error updating client:', error);
      // You could show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = () => {
    setFormData({ ...formData, active: !formData.active });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client #{client.id}</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client. Laissez le mot de passe vide pour le conserver.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom du client *</Label>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Mon Client"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-monty_username">Nom d'utilisateur Monty *</Label>
            <Input
              id="edit-monty_username"
              value={formData.monty_username || ''}
              onChange={(e) => setFormData({ ...formData, monty_username: e.target.value })}
              placeholder="Votre username Monty"
              disabled={isSubmitting}
            />
            {errors.monty_username && <p className="text-sm text-red-500">{errors.monty_username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-monty_password">Nouveau mot de passe Monty</Label>
            <Input
              id="edit-monty_password"
              type="password"
              value={formData.monty_password || ''}
              onChange={(e) => setFormData({ ...formData, monty_password: e.target.value })}
              placeholder="Laisser vide pour conserver l'actuel"
              disabled={isSubmitting}
            />
            {errors.monty_password && <p className="text-sm text-red-500">{errors.monty_password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-active">Status du client</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleActive}
              disabled={isSubmitting}
            >
              <Badge variant={formData.active ? "default" : "secondary"}>
                {formData.active ? "Actif" : "Inactif"}
              </Badge>
            </Button>
          </div>

          {/* Client Info */}
          <div className="p-3 bg-muted/50 border rounded-lg">
            <div className="text-sm text-muted-foreground space-y-1">
              <div><span className="font-medium">API Key:</span> {client.api_key}</div>
              <div><span className="font-medium">Token Status:</span> 
                <Badge variant={client.token_status === 'valid' ? 'default' : 'outline'} className="ml-2">
                  {client.token_status}
                </Badge>
              </div>
              {client.agent_id && (
                <div><span className="font-medium">Agent ID:</span> {client.agent_id}</div>
              )}
              {client.reseller_id && (
                <div><span className="font-medium">Reseller ID:</span> {client.reseller_id}</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}