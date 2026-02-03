import { createContext, useContext, useMemo, useState } from 'react';
import type { SiteContent } from '../types';
import { defaultContent } from './defaultContent';
import { clearStoredContent, loadStoredContent, saveStoredContent } from './storage';

type ContentContextValue = {
  content: SiteContent;
  saveContent: (next: SiteContent) => void;
  resetContent: () => void;
  hasStoredContent: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const stored = loadStoredContent();
  const [content, setContent] = useState<SiteContent>(
    stored ?? defaultContent
  );
  const [hasStoredContent, setHasStoredContent] = useState(Boolean(stored));

  const saveContent = (next: SiteContent) => {
    setContent(next);
    saveStoredContent(next);
    setHasStoredContent(true);
  };

  const resetContent = () => {
    setContent(defaultContent);
    clearStoredContent();
    setHasStoredContent(false);
  };

  const value = useMemo(
    () => ({
      content,
      saveContent,
      resetContent,
      hasStoredContent,
    }),
    [content, hasStoredContent]
  );

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
};
