import { useEffect, useMemo, useState } from 'react';
import type { PortfolioCategory, PortfolioWork, SiteContent } from '../types';
import { useContent } from '../content/ContentContext';
import {
  createCredentials,
  createSession,
  isSessionValid,
  isSetupRequired,
  logout,
  verifyPassword,
} from './auth';

type AuthMode = 'login' | 'setup';

const cloneContent = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const normalizeCategories = (categories: PortfolioCategory[]) =>
  categories.map((category, categoryIndex) => ({
    ...category,
    order: categoryIndex + 1,
    works: category.works.map((work, workIndex) => ({
      ...work,
      order: workIndex + 1,
    })),
  }));

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });

const AdminLogin = ({
  mode,
  onLogin,
  onSetup,
  errorMessage,
  onModeChange,
}: {
  mode: AuthMode;
  onLogin: (password: string) => Promise<void>;
  onSetup: (password: string) => Promise<void>;
  errorMessage: string;
  onModeChange: (nextMode: AuthMode) => void;
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'setup' && password !== confirmPassword) return;
    setIsSubmitting(true);
    if (mode === 'setup') {
      await onSetup(password);
    } else {
      await onLogin(password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="admin-page">
      <header className="site-header admin-header">
        <div className="container header-inner">
          <span className="brand-mark brand-mark--header">DINSBURGH</span>
        </div>
      </header>
      <main className="admin-main">
        <div className="container admin-auth">
          <div className="glass-panel admin-auth-card">
            <h1 className="admin-title">
              {mode === 'setup' ? 'Настройка Admin' : 'Вход в Admin'}
            </h1>
            <p className="admin-subtitle">
              {mode === 'setup'
                ? 'Создайте пароль администратора, чтобы управлять контентом.'
                : 'Введите пароль администратора для доступа к панели.'}
            </p>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label className="admin-field">
                <span>Пароль</span>
                <input
                  className="admin-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </label>
              {mode === 'setup' && (
                <label className="admin-field">
                  <span>Повторите пароль</span>
                  <input
                    className="admin-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                    minLength={8}
                  />
                </label>
              )}
              {mode === 'setup' && password !== confirmPassword && (
                <span className="admin-error">Пароли не совпадают.</span>
              )}
              {errorMessage && (
                <span className="admin-error">{errorMessage}</span>
              )}
              <button
                className="admin-button is-primary"
                type="submit"
                disabled={
                  isSubmitting ||
                  !password ||
                  (mode === 'setup' && password !== confirmPassword)
                }
              >
                {mode === 'setup' ? 'Создать доступ' : 'Войти'}
              </button>
            </form>
            <div className="admin-auth-actions">
              {mode === 'setup' ? (
                <button
                  type="button"
                  className="admin-button is-ghost"
                  onClick={() => onModeChange('login')}
                >
                  Уже есть пароль
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-button is-ghost"
                  onClick={() => onModeChange('setup')}
                >
                  Создать новый пароль
                </button>
              )}
              <a className="admin-link" href="#/">
                На публичный сайт
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminPanel = ({
  content,
  onSave,
  onCancel,
  onLogout,
}: {
  content: SiteContent;
  onSave: (next: SiteContent) => void;
  onCancel: () => void;
  onLogout: () => void;
}) => {
  const [draftContent, setDraftContent] = useState(() =>
    cloneContent(content)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setDraftContent((prev) => {
      const normalized = normalizeCategories(content.portfolio.categories);
      return {
        ...cloneContent(content),
        portfolio: {
          ...content.portfolio,
          categories: normalized,
        },
      };
    });
    setIsDirty(false);
    setStatusMessage('');
    setErrorMessage('');
  }, [content]);

  const markDirty = () => {
    setIsDirty(true);
    setStatusMessage('');
  };

  const updateCopyField = (field: keyof SiteContent['copy'], value: string) => {
    setDraftContent((prev) => ({
      ...prev,
      copy: {
        ...prev.copy,
        [field]: value,
      },
    }));
    markDirty();
  };

  const updateBioMetaItem = (index: number, value: string) => {
    setDraftContent((prev) => {
      const nextMeta = [...prev.copy.bioMeta];
      nextMeta[index] = value;
      return {
        ...prev,
        copy: {
          ...prev.copy,
          bioMeta: nextMeta,
        },
      };
    });
    markDirty();
  };

  const addBioMetaItem = () => {
    setDraftContent((prev) => ({
      ...prev,
      copy: {
        ...prev.copy,
        bioMeta: [...prev.copy.bioMeta, 'Новый пункт'],
      },
    }));
    markDirty();
  };

  const removeBioMetaItem = (index: number) => {
    setDraftContent((prev) => ({
      ...prev,
      copy: {
        ...prev.copy,
        bioMeta: prev.copy.bioMeta.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
    markDirty();
  };

  const updateCategories = (
    updater: (categories: PortfolioCategory[]) => PortfolioCategory[]
  ) => {
    setDraftContent((prev) => {
      const current = cloneContent(prev.portfolio.categories);
      const updated = normalizeCategories(updater(current));
      return {
        ...prev,
        portfolio: {
          ...prev.portfolio,
          categories: updated,
        },
      };
    });
    markDirty();
  };

  const addCategory = () => {
    updateCategories((categories) => [
      ...categories,
      {
        id: createId('category'),
        label: 'Новый раздел',
        description: '',
        order: categories.length + 1,
        works: [],
      },
    ]);
  };

  const updateCategoryField = (
    categoryId: string,
    field: keyof PortfolioCategory,
    value: string
  ) => {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              [field]: value,
            }
          : category
      )
    );
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    updateCategories((categories) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= categories.length) return categories;
      return moveItem(categories, index, nextIndex);
    });
  };

  const removeCategory = (categoryId: string) => {
    updateCategories((categories) =>
      categories.filter((category) => category.id !== categoryId)
    );
  };

  const addWork = (categoryId: string) => {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              works: [
                ...category.works,
                {
                  id: createId('work'),
                  title: 'Новая работа',
                  description: '',
                  coverImage: '',
                  images: [],
                  order: category.works.length + 1,
                },
              ],
            }
          : category
      )
    );
  };

  const updateWorkField = (
    categoryId: string,
    workId: string,
    field: keyof PortfolioWork,
    value: string
  ) => {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              works: category.works.map((work) =>
                work.id === workId
                  ? {
                      ...work,
                      [field]: value,
                    }
                  : work
              ),
            }
          : category
      )
    );
  };

  const moveWork = (
    categoryId: string,
    workIndex: number,
    direction: -1 | 1
  ) => {
    updateCategories((categories) =>
      categories.map((category) => {
        if (category.id !== categoryId) return category;
        const nextIndex = workIndex + direction;
        if (nextIndex < 0 || nextIndex >= category.works.length) {
          return category;
        }
        return {
          ...category,
          works: moveItem(category.works, workIndex, nextIndex),
        };
      })
    );
  };

  const removeWork = (categoryId: string, workId: string) => {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              works: category.works.filter((work) => work.id !== workId),
            }
          : category
      )
    );
  };

  const setCoverImage = (
    categoryId: string,
    workId: string,
    image: string
  ) => {
    updateCategories((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              works: category.works.map((work) =>
                work.id === workId
                  ? {
                      ...work,
                      coverImage: image,
                    }
                  : work
              ),
            }
          : category
      )
    );
  };

  const moveWorkImage = (
    categoryId: string,
    workId: string,
    imageIndex: number,
    direction: -1 | 1
  ) => {
    updateCategories((categories) =>
      categories.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          works: category.works.map((work) => {
            if (work.id !== workId) return work;
            const nextIndex = imageIndex + direction;
            if (nextIndex < 0 || nextIndex >= work.images.length) {
              return work;
            }
            return {
              ...work,
              images: moveItem(work.images, imageIndex, nextIndex),
            };
          }),
        };
      })
    );
  };

  const removeWorkImage = (
    categoryId: string,
    workId: string,
    imageIndex: number
  ) => {
    updateCategories((categories) =>
      categories.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          works: category.works.map((work) => {
            if (work.id !== workId) return work;
            const nextImages = work.images.filter(
              (_, index) => index !== imageIndex
            );
            const removedImage = work.images[imageIndex];
            const nextCover =
              removedImage && removedImage === work.coverImage
                ? nextImages[0] ?? ''
                : work.coverImage;
            return {
              ...work,
              images: nextImages,
              coverImage: nextCover,
            };
          }),
        };
      })
    );
  };

  const addWorkImages = async (
    categoryId: string,
    workId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    try {
      const images = await Promise.all(
        Array.from(files).map((file) => readFileAsDataUrl(file))
      );
      updateCategories((categories) =>
        categories.map((category) => {
          if (category.id !== categoryId) return category;
          return {
            ...category,
            works: category.works.map((work) => {
              if (work.id !== workId) return work;
              const nextImages = [...work.images, ...images];
              const nextCover = work.coverImage || nextImages[0] || '';
              return {
                ...work,
                images: nextImages,
                coverImage: nextCover,
              };
            }),
          };
        })
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ошибка загрузки изображений.'
      );
    }
  };

  const handleBioImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const image = await readFileAsDataUrl(files[0]);
      setDraftContent((prev) => ({
        ...prev,
        copy: {
          ...prev.copy,
          bioImage: {
            ...prev.copy.bioImage,
            src: image,
          },
        },
      }));
      markDirty();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Ошибка загрузки изображения.'
      );
    }
  };

  const handleSave = () => {
    onSave(draftContent);
    setIsDirty(false);
    setStatusMessage('Изменения сохранены.');
  };

  const handleCancel = () => {
    const normalized = normalizeCategories(content.portfolio.categories);
    setDraftContent({
      ...cloneContent(content),
      portfolio: {
        ...content.portfolio,
        categories: normalized,
      },
    });
    setIsDirty(false);
    setStatusMessage('');
    onCancel();
  };

  const sortedCategories = useMemo(
    () => normalizeCategories(draftContent.portfolio.categories),
    [draftContent.portfolio.categories]
  );

  return (
    <div className="admin-page">
      <header className="site-header admin-header">
        <div className="container admin-header-inner">
          <div>
            <span className="brand-mark brand-mark--header">DINSBURGH</span>
            <span className="admin-heading">Admin</span>
          </div>
          <div className="admin-header-actions">
            <a className="admin-link" href="#/">
              Публичный сайт
            </a>
            <button className="admin-button is-ghost" onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container admin-content">
          <div className="admin-toolbar">
            <div className="admin-toolbar-actions">
              <button
                className="admin-button is-primary"
                type="button"
                onClick={handleSave}
                disabled={!isDirty}
              >
                Сохранить изменения
              </button>
              <button
                className="admin-button is-ghost"
                type="button"
                onClick={handleCancel}
                disabled={!isDirty}
              >
                Отменить
              </button>
            </div>
            <div className="admin-status">
              {statusMessage ||
                (isDirty ? 'Есть несохраненные изменения' : 'Все сохранено')}
            </div>
          </div>

          {errorMessage && (
            <div className="admin-error-banner">{errorMessage}</div>
          )}

          <section className="glass-panel admin-section">
            <div className="admin-section-header">
              <h2>Тексты сайта</h2>
            </div>
            <div className="admin-grid">
              <label className="admin-field">
                <span>Текст ссылки "перейти к работам"</span>
                <input
                  className="admin-input"
                  value={draftContent.copy.skipLink}
                  onChange={(event) =>
                    updateCopyField('skipLink', event.target.value)
                  }
                />
              </label>
              <label className="admin-field">
                <span>Бренд в шапке</span>
                <input
                  className="admin-input"
                  value={draftContent.copy.brandMark}
                  onChange={(event) =>
                    updateCopyField('brandMark', event.target.value)
                  }
                />
              </label>
              <label className="admin-field">
                <span>Заголовок Hero</span>
                <input
                  className="admin-input"
                  value={draftContent.copy.heroTitle}
                  onChange={(event) =>
                    updateCopyField('heroTitle', event.target.value)
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Подзаголовок Hero</span>
                <textarea
                  className="admin-textarea"
                  value={draftContent.copy.heroSubtitle}
                  onChange={(event) =>
                    updateCopyField('heroSubtitle', event.target.value)
                  }
                  rows={3}
                />
              </label>
              <label className="admin-field">
                <span>Заголовок Bio</span>
                <input
                  className="admin-input"
                  value={draftContent.copy.bioTitle}
                  onChange={(event) =>
                    updateCopyField('bioTitle', event.target.value)
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Текст Bio</span>
                <textarea
                  className="admin-textarea"
                  value={draftContent.copy.bioText}
                  onChange={(event) =>
                    updateCopyField('bioText', event.target.value)
                  }
                  rows={4}
                />
              </label>
              <div className="admin-field admin-field--full">
                <span className="admin-field-label">Meta-строки Bio</span>
                <div className="admin-list">
                  {draftContent.copy.bioMeta.map((item, index) => (
                    <div key={`${item}-${index}`} className="admin-inline">
                      <input
                        className="admin-input"
                        value={item}
                        onChange={(event) =>
                          updateBioMetaItem(index, event.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="admin-button is-danger"
                        onClick={() => removeBioMetaItem(index)}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-button is-ghost"
                    onClick={addBioMetaItem}
                  >
                    Добавить строку
                  </button>
                </div>
              </div>
              <label className="admin-field">
                <span>Текст баннера портфолио</span>
                <input
                  className="admin-input"
                  value={draftContent.copy.portfolioBanner}
                  onChange={(event) =>
                    updateCopyField('portfolioBanner', event.target.value)
                  }
                />
              </label>
              <label className="admin-field admin-field--full">
                <span>Текст пустого состояния</span>
                <textarea
                  className="admin-textarea"
                  value={draftContent.copy.emptyState}
                  onChange={(event) =>
                    updateCopyField('emptyState', event.target.value)
                  }
                  rows={2}
                />
              </label>
            </div>
          </section>

          <section className="glass-panel admin-section">
            <div className="admin-section-header">
              <h2>Bio изображение</h2>
            </div>
            <div className="admin-grid admin-grid--bio">
              <div className="admin-bio-preview">
                {draftContent.copy.bioImage.src ? (
                  <img
                    src={draftContent.copy.bioImage.src}
                    alt={draftContent.copy.bioImage.alt}
                  />
                ) : (
                  <div className="admin-bio-placeholder">Нет изображения</div>
                )}
              </div>
              <div className="admin-bio-controls">
                <label className="admin-field">
                  <span>Alt-текст изображения</span>
                  <input
                    className="admin-input"
                    value={draftContent.copy.bioImage.alt}
                    onChange={(event) => {
                      setDraftContent((prev) => ({
                        ...prev,
                        copy: {
                          ...prev.copy,
                          bioImage: {
                            ...prev.copy.bioImage,
                            alt: event.target.value,
                          },
                        },
                      }));
                      markDirty();
                    }}
                  />
                </label>
                <label className="admin-field">
                  <span>Загрузить изображение</span>
                  <input
                    className="admin-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleBioImageUpload(event.target.files)}
                  />
                </label>
                {draftContent.copy.bioImage.src && (
                  <button
                    type="button"
                    className="admin-button is-danger"
                    onClick={() => {
                      setDraftContent((prev) => ({
                        ...prev,
                        copy: {
                          ...prev.copy,
                          bioImage: {
                            ...prev.copy.bioImage,
                            src: '',
                          },
                        },
                      }));
                      markDirty();
                    }}
                  >
                    Удалить изображение
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="glass-panel admin-section">
            <div className="admin-section-header">
              <h2>Портфолио</h2>
              <button
                type="button"
                className="admin-button is-primary"
                onClick={addCategory}
              >
                Добавить раздел
              </button>
            </div>
            <div className="admin-list">
              {sortedCategories.map((category, categoryIndex) => (
                <div key={category.id} className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-card-title">
                      <label className="admin-field">
                        <span>Название раздела</span>
                        <input
                          className="admin-input"
                          value={category.label}
                          onChange={(event) =>
                            updateCategoryField(
                              category.id,
                              'label',
                              event.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="admin-button is-ghost"
                        onClick={() => moveCategory(categoryIndex, -1)}
                        disabled={categoryIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-button is-ghost"
                        onClick={() => moveCategory(categoryIndex, 1)}
                        disabled={categoryIndex === sortedCategories.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-button is-danger"
                        onClick={() => removeCategory(category.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <label className="admin-field admin-field--full">
                    <span>Описание раздела</span>
                    <textarea
                      className="admin-textarea"
                      value={category.description}
                      onChange={(event) =>
                        updateCategoryField(
                          category.id,
                          'description',
                          event.target.value
                        )
                      }
                      rows={2}
                    />
                  </label>

                  <div className="admin-work-header">
                    <h3>Работы</h3>
                    <button
                      type="button"
                      className="admin-button is-ghost"
                      onClick={() => addWork(category.id)}
                    >
                      Добавить работу
                    </button>
                  </div>

                  <div className="admin-list">
                    {category.works.map((work, workIndex) => (
                      <div key={work.id} className="admin-work-card">
                        <div className="admin-card-header">
                          <div className="admin-card-title">
                            <label className="admin-field">
                              <span>Название работы</span>
                              <input
                                className="admin-input"
                                value={work.title}
                                onChange={(event) =>
                                  updateWorkField(
                                    category.id,
                                    work.id,
                                    'title',
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                          </div>
                          <div className="admin-actions">
                            <button
                              type="button"
                              className="admin-button is-ghost"
                              onClick={() =>
                                moveWork(category.id, workIndex, -1)
                              }
                              disabled={workIndex === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="admin-button is-ghost"
                              onClick={() =>
                                moveWork(category.id, workIndex, 1)
                              }
                              disabled={workIndex === category.works.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="admin-button is-danger"
                              onClick={() => removeWork(category.id, work.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>

                        <label className="admin-field admin-field--full">
                          <span>Описание работы</span>
                          <textarea
                            className="admin-textarea"
                            value={work.description}
                            onChange={(event) =>
                              updateWorkField(
                                category.id,
                                work.id,
                                'description',
                                event.target.value
                              )
                            }
                            rows={3}
                          />
                        </label>

                        <div className="admin-field admin-field--full">
                          <span className="admin-field-label">
                            Изображения работы
                          </span>
                          <div className="admin-image-grid">
                            {work.images.map((image, imageIndex) => (
                              <div key={`${image}-${imageIndex}`}>
                                <div className="admin-image-preview">
                                  <img src={image} alt="" />
                                  {image === work.coverImage && (
                                    <span className="admin-image-badge">
                                      Обложка
                                    </span>
                                  )}
                                </div>
                                <div className="admin-image-actions">
                                  <button
                                    type="button"
                                    className="admin-button is-ghost"
                                    onClick={() =>
                                      setCoverImage(category.id, work.id, image)
                                    }
                                  >
                                    Сделать обложкой
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-button is-ghost"
                                    onClick={() =>
                                      moveWorkImage(
                                        category.id,
                                        work.id,
                                        imageIndex,
                                        -1
                                      )
                                    }
                                    disabled={imageIndex === 0}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-button is-ghost"
                                    onClick={() =>
                                      moveWorkImage(
                                        category.id,
                                        work.id,
                                        imageIndex,
                                        1
                                      )
                                    }
                                    disabled={
                                      imageIndex === work.images.length - 1
                                    }
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-button is-danger"
                                    onClick={() =>
                                      removeWorkImage(
                                        category.id,
                                        work.id,
                                        imageIndex
                                      )
                                    }
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <label className="admin-field">
                            <span>Добавить изображения</span>
                            <input
                              className="admin-input"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) =>
                                addWorkImages(
                                  category.id,
                                  work.id,
                                  event.target.files
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const AdminApp = () => {
  const { content, saveContent } = useContent();
  const [isAuthenticated, setIsAuthenticated] = useState(isSessionValid());
  const [mode, setMode] = useState<AuthMode>(
    isSetupRequired() ? 'setup' : 'login'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.hash = '#/admin/login';
    }
  }, [isAuthenticated]);

  const handleLogin = async (password: string) => {
    setErrorMessage('');
    const valid = await verifyPassword(password);
    if (!valid) {
      setErrorMessage('Неверный пароль.');
      return;
    }
    createSession();
    setIsAuthenticated(true);
    window.location.hash = '#/admin';
  };

  const handleSetup = async (password: string) => {
    setErrorMessage('');
    if (password.length < 8) {
      setErrorMessage('Пароль должен быть не короче 8 символов.');
      return;
    }
    await createCredentials(password);
    createSession();
    setIsAuthenticated(true);
    setMode('login');
    window.location.hash = '#/admin';
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        mode={mode}
        onLogin={handleLogin}
        onSetup={handleSetup}
        errorMessage={errorMessage}
        onModeChange={setMode}
      />
    );
  }

  return (
    <AdminPanel
      content={content}
      onSave={saveContent}
      onCancel={() => null}
      onLogout={handleLogout}
    />
  );
};

export default AdminApp;
