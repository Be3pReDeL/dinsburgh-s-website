import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SiteContent } from '../types';
import { defaultContent } from './defaultContent';
import { fetchContent, saveContent as persistContent } from './contentService';
import { loadStoredContent } from './storage';

type ContentContextValue = {
  content: SiteContent;
  saveContent: (next: SiteContent) => Promise<void>;
  refreshContent: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
  hasCachedContent: boolean;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const cachedContent = loadStoredContent();
  const [content, setContent] = useState<SiteContent>(
    cachedContent ?? defaultContent
  );
  const [hasCachedContent, setHasCachedContent] = useState(
    Boolean(cachedContent)
  );
  const [isLoading, setIsLoading] = useState(!cachedContent);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshContent = async () => {
    if (!hasCachedContent) {
      setIsLoading(true);
    }
    setErrorMessage('');
    try {
      const loaded = await fetchContent();
      setContent(loaded);
      setHasCachedContent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить контент.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async (next: SiteContent) => {
    setErrorMessage('');
    await persistContent(next);
    setContent(next);
    setHasCachedContent(true);
  };

  useEffect(() => {
    void refreshContent();
  }, []);

  const value = useMemo(
    () => ({
      content,
      saveContent,
      refreshContent,
      isLoading,
      errorMessage,
      hasCachedContent,
    }),
    [content, errorMessage, hasCachedContent, isLoading]
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
