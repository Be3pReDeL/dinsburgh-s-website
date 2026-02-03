import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useContent } from './content/ContentContext';
import type { PortfolioCategory, PortfolioWork } from './types';

const MODAL_CLOSE_DELAY = 220;
const SWIPE_THRESHOLD = 40;

const formatCount = (count: number) => count.toString().padStart(2, '0');

const useBodyLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
};

const sortCategories = (categories: PortfolioCategory[]) =>
  [...categories]
    .map((category) => ({
      ...category,
      works: [...category.works].sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);

const PublicApp = () => {
  const { content, isLoading, errorMessage, hasCachedContent } = useContent();
  const categories = useMemo(
    () => sortCategories(content.portfolio.categories),
    [content.portfolio.categories]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id ?? ''
  );
  const [activeWork, setActiveWork] = useState<PortfolioWork | null>(null);
  const [activeWorkCategory, setActiveWorkCategory] =
    useState<PortfolioCategory | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const swipeStartX = useRef<number | null>(null);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId),
    [categories, activeCategoryId]
  );

  const activeImages = useMemo(() => {
    if (!activeWork) return [];
    const images = activeWork.images?.length ? activeWork.images : [];
    if (images.length > 0) return images;
    return activeWork.coverImage ? [activeWork.coverImage] : [];
  }, [activeWork]);

  const activeImage = activeImages[activeImageIndex] ?? activeImages[0];
  const hasMultipleImages = activeImages.length > 1;

  useBodyLock(isModalOpen);

  useEffect(() => {
    if (!activeCategoryId && categories[0]) {
      setActiveCategoryId(categories[0].id);
      return;
    }

    if (
      activeCategoryId &&
      !categories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId(categories[0]?.id ?? '');
    }
  }, [activeCategoryId, categories]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isModalOpen || !activeWork) return;
    closeButtonRef.current?.focus();
  }, [isModalOpen, activeWork]);

  useEffect(() => {
    if (!isModalOpen && activeWork) {
      const timer = window.setTimeout(
        () => setActiveWork(null),
        MODAL_CLOSE_DELAY
      );
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isModalOpen, activeWork]);

  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
      if (event.key === 'ArrowRight' && hasMultipleImages) {
        setActiveImageIndex((index) => (index + 1) % activeImages.length);
      }
      if (event.key === 'ArrowLeft' && hasMultipleImages) {
        setActiveImageIndex(
          (index) => (index - 1 + activeImages.length) % activeImages.length
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeImages.length, hasMultipleImages, isModalOpen]);

  useEffect(() => {
    if (!activeWork) return;
    setActiveImageIndex(0);
  }, [activeWork]);

  useEffect(() => {
    if (activeImageIndex >= activeImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, activeImages.length]);

  const openWork = (work: PortfolioWork, category: PortfolioCategory) => {
    setActiveWork(work);
    setActiveWorkCategory(category);
    setIsModalOpen(true);
  };

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    let nextIndex = index;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % categories.length;
    }
    if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + categories.length) % categories.length;
    }
    if (event.key === 'Home') {
      nextIndex = 0;
    }
    if (event.key === 'End') {
      nextIndex = categories.length - 1;
    }

    const nextCategory = categories[nextIndex];
    if (nextCategory) {
      setActiveCategoryId(nextCategory.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex((index) => (index + 1) % activeImages.length);
  };

  const goToPreviousImage = () => {
    if (!hasMultipleImages) return;
    setActiveImageIndex(
      (index) => (index - 1 + activeImages.length) % activeImages.length
    );
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    const startX = swipeStartX.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    swipeStartX.current = null;
    if (startX === null || endX === null) return;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0) {
      goToPreviousImage();
    } else {
      goToNextImage();
    }
  };

  const copy = content.copy;
  const bioText = copy.bioText.trim();
  const brandPrefix = `${copy.brandMark} `;
  const hasBrandPrefix = bioText.startsWith(brandPrefix);
  const bioRemainder = hasBrandPrefix
    ? bioText.slice(brandPrefix.length)
    : bioText;

  const activeCategoryDescription =
    activeCategory?.description ?? 'Описание направления будет добавлено позже.';

  if (!hasCachedContent && (isLoading || errorMessage)) {
    return (
      <div className="page loading-screen">
        <div className="glass-panel loading-card">
          <span className="brand-mark brand-mark--header">DINSBURGH</span>
          <p className="loading-text">
            {errorMessage || 'Загрузка контента...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <a className="skip-link" href="#portfolio">
        {copy.skipLink}
      </a>
      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-inner">
          <span className="brand-mark brand-mark--header">
            {copy.brandMark}
          </span>
        </div>
      </header>

      <main>
        <section className="bio-section" aria-labelledby="bio-title">
          <div className="container">
            <div className="hero">
              <h1 id="bio-title" className="hero-title">
                {copy.heroTitle}
              </h1>
              <p className="hero-subtitle">{copy.heroSubtitle}</p>
            </div>

            <div className="glass-panel bio-card" role="note">
              <div className="bio-media" aria-hidden="true">
                {copy.bioImage.src ? (
                  <img
                    className="bio-image"
                    src={copy.bioImage.src}
                    alt={copy.bioImage.alt || copy.bioTitle}
                    loading="lazy"
                  />
                ) : (
                  <div className="bio-orb" />
                )}
              </div>
              <div className="bio-content">
                <h2 className="section-title">{copy.bioTitle}</h2>
                <p>
                  {hasBrandPrefix ? (
                    <>
                      <span className="brand-name">{copy.brandMark}</span>{' '}
                      {bioRemainder}
                    </>
                  ) : (
                    bioRemainder
                  )}
                </p>
                <div className="bio-meta">
                  {copy.bioMeta.map((item, index) => (
                    <span key={`${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="portfolio">
          <div className="container">
            <div className="tabs" role="tablist" aria-label="Разделы работ">
              {categories.map((category, index) => {
                const isActive = category.id === activeCategoryId;
                return (
                  <button
                    key={category.id}
                    ref={(node) => (tabRefs.current[index] = node)}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${category.id}`}
                    id={`tab-${category.id}`}
                    className={`tab-button ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveCategoryId(category.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <span className="tab-index">
                      {formatCount(index + 1)}
                    </span>
                    {category.label}
                  </button>
                );
              })}
            </div>

            <p className="tab-description">{activeCategoryDescription}</p>

            <div className="portfolio-banner glass-panel" aria-hidden="true">
              {copy.portfolioBanner}
            </div>

            <div
              id={
                activeCategory?.id ? `panel-${activeCategory.id}` : undefined
              }
              role="tabpanel"
              aria-labelledby={
                activeCategory?.id ? `tab-${activeCategory.id}` : undefined
              }
              className="portfolio-grid"
              data-state="visible"
              key={activeCategory?.id}
            >
              {activeCategory?.works.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  className="work-card"
                  onClick={() => openWork(work, activeCategory)}
                  aria-label={`Открыть работу «${work.title}»`}
                >
                  {work.coverImage && (
                    <img
                      src={work.coverImage}
                      alt={work.title}
                      loading="lazy"
                      width={1200}
                      height={1600}
                    />
                  )}
                  <span className="work-overlay">
                    <span className="work-title">{work.title}</span>
                  </span>
                </button>
              ))}
            </div>

            {activeCategory && activeCategory.works.length === 0 && (
              <div className="empty-state">{copy.emptyState}</div>
            )}

            {!activeCategory && (
              <div className="empty-state">{copy.emptyState}</div>
            )}
          </div>
        </section>
      </main>

      <div
        className={`modal-backdrop ${isModalOpen ? 'is-open' : ''}`}
        aria-hidden={!isModalOpen}
        onClick={() => setIsModalOpen(false)}
      >
        {activeWork && (
          <div
            className="modal-panel glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            <div className="modal-content">
              <div className="modal-gallery">
                <div
                  className="modal-image"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {activeImage && (
                    <img
                      src={activeImage}
                      alt={activeWork.title}
                      width={1200}
                      height={1600}
                    />
                  )}
                  {hasMultipleImages && (
                    <div className="modal-nav">
                      <button
                        type="button"
                        className="modal-nav-button"
                        onClick={goToPreviousImage}
                        aria-label="Предыдущее изображение"
                      >
                        ←
                      </button>
                      <span className="modal-count">
                        {activeImageIndex + 1} / {activeImages.length}
                      </span>
                      <button
                        type="button"
                        className="modal-nav-button"
                        onClick={goToNextImage}
                        aria-label="Следующее изображение"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
                {hasMultipleImages && (
                  <div className="modal-thumbs" aria-label="Миниатюры">
                    {activeImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        className={`modal-thumb ${
                          index === activeImageIndex ? 'is-active' : ''
                        }`}
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`Открыть изображение ${index + 1}`}
                      >
                        <img src={image} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-text">
                <h3 id="modal-title">{activeWork.title}</h3>
                <p id="modal-description">{activeWork.description}</p>
                {activeWorkCategory && (
                  <span className="modal-tag">{activeWorkCategory.label}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicApp;
