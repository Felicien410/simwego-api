"use client";

import { useState } from 'react';
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
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api, CreateClientData } from '@/lib/api';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: () => void;
}

type ValidationState = 'idle' | 'validating' | 'success' | 'error';

export function AddClientDialog({ open, onOpenChange, onClientCreated }: AddClientDialogProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    monty_username: '',
    monty_password: '',
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      monty_username: '',
      monty_password: '',
      active: true
    });
    setValidationState('idle');
    setValidationMessage('');
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du client est requis';
    }
    
    if (!formData.monty_username.trim()) {
      newErrors.monty_username = 'Le nom d&apos;utilisateur Monty est requis';
    }
    
    if (!formData.monty_password.trim()) {
      newErrors.monty_password = 'Le mot de passe Monty est requis';
    } else if (formData.monty_password.length < 6) {
      newErrors.monty_password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setValidationState('validating');
    setValidationMessage('Validation des credentials Monty...');

    try {
      // Create client with Monty validation
      const client = await api.createClientWithMontyValidation(formData);
      
      setValidationState('success');
      setValidationMessage(`Client "${client.name}" créé avec succès! Token Monty validé.`);
      
      // Wait a moment to show success message
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onClientCreated();
      }, 1500);

    } catch (error) {
      setValidationState('error');
      setValidationMessage(
        error instanceof Error 
          ? error.message 
          : 'Erreur lors de la création du client'
      );
      setIsSubmitting(false);
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationBadge = () => {
    switch (validationState) {
      case 'validating':
        return <Badge variant="outline">Validation...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Validé</Badge>;
      case 'error':
        return <Badge variant="destructive">Échec</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Créez un nouveau client SimWeGo. Les credentials Monty seront validés en temps réel.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du client *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Mon Client"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monty_username">Nom d'utilisateur Monty *</Label>
            <Input
              id="monty_username"
              value={formData.monty_username}
              onChange={(e) => setFormData({ ...formData, monty_username: e.target.value })}
              placeholder="Votre username Monty"
              disabled={isSubmitting}
            />
            {errors.monty_username && <p className="text-sm text-red-500">{errors.monty_username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monty_password">Mot de passe Monty *</Label>
            <Input
              id="monty_password"
              type="password"
              value={formData.monty_password}
              onChange={(e) => setFormData({ ...formData, monty_password: e.target.value })}
              placeholder="Votre mot de passe Monty"
              disabled={isSubmitting}
            />
            {errors.monty_password && <p className="text-sm text-red-500">{errors.monty_password}</p>}
          </div>

          {/* Validation Status */}
          {validationState !== 'idle' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border animate-slide-in">
              {getValidationIcon()}
              <span className="text-sm">{validationMessage}</span>
              {getValidationBadge()}
            </div>
          )}

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
                  {validationState === 'validating' ? 'Validation...' : 'Création...'}
                </>
              ) : (
                'Créer le client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}