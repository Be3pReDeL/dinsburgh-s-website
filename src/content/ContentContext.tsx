import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SiteContent } from '../types';
import { defaultContent } from './defaultContent';
import { fetchContent, saveContent as persistContent } from './contentService';

type ContentContextValue = {
  content: SiteContent;
  saveContent: (next: SiteContent) => Promise<void>;
  refreshContent: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshContent = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const loaded = await fetchContent();
      setContent(loaded);
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
    }),
    [content, errorMessage, isLoading]
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
