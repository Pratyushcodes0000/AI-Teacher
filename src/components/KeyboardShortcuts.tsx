import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Badge } from './ui/badge';

interface Shortcut {
  keys: string[];
  description: string;
  action?: () => void;
}

interface KeyboardShortcutsProps {
  onSwitchToChat?: () => void;
  onSwitchToUpload?: () => void;
  onSwitchToDocuments?: () => void;
  onFocusSearch?: () => void;
}

export function KeyboardShortcuts({ 
  onSwitchToChat, 
  onSwitchToUpload, 
  onSwitchToDocuments,
  onFocusSearch 
}: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      keys: ['Ctrl', '1'],
      description: 'Switch to Upload tab',
      action: onSwitchToUpload
    },
    {
      keys: ['Ctrl', '2'],
      description: 'Switch to Chat tab',
      action: onSwitchToChat
    },
    {
      keys: ['Ctrl', '3'],
      description: 'Switch to Documents tab',
      action: onSwitchToDocuments
    },
    {
      keys: ['Ctrl', '/'],
      description: 'Show keyboard shortcuts',
      action: () => setIsOpen(true)
    },
    {
      keys: ['Ctrl', 'K'],
      description: 'Focus search (in chat or documents)',
      action: onFocusSearch
    },
    {
      keys: ['Enter'],
      description: 'Send message (in chat)',
    },
    {
      keys: ['Shift', 'Enter'],
      description: 'New line (in chat)',
    },
    {
      keys: ['Escape'],
      description: 'Close dialogs/clear focus',
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + 1, 2, 3 for tab switching
      if (event.ctrlKey && !event.altKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            onSwitchToUpload?.();
            break;
          case '2':
            event.preventDefault();
            onSwitchToChat?.();
            break;
          case '3':
            event.preventDefault();
            onSwitchToDocuments?.();
            break;
          case '/':
            event.preventDefault();
            setIsOpen(true);
            break;
          case 'k':
            event.preventDefault();
            onFocusSearch?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToChat, onSwitchToUpload, onSwitchToDocuments, onFocusSearch]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Show keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these keyboard shortcuts to navigate the application quickly.
          </p>
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                        {key}
                      </Badge>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-xs text-muted-foreground">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Press <Badge variant="outline" className="px-1 py-0.5 text-xs">Ctrl + /</Badge> anytime to view this help.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}