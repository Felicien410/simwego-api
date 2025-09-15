"use client";

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full border-2 hover:scale-105 transition-all duration-200"
      title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 text-yellow-400" />
      )}
    </Button>
  );
}