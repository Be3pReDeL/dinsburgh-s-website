import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { portfolioCategories } from './portfolio';
import type { PortfolioWork } from './types';

const MODAL_CLOSE_DELAY = 220;

const formatCount = (count: number) => count.toString().padStart(2, '0');
const categoryDescriptions: Record<string, string> = {
  '01-digital':
    'Цифровые серии о свете и движении. Слоистые фактуры, мягкие градиенты и контроль над источниками освещения.',
  '02-painting':
    'Живописные работы с акцентом на глубину, ритм мазка и тишину цвета. Тонкая работа с контрастом.',
  '03-fashion':
    'Fashion-проекты и коллаборации: текстуры ткани, графичные силуэты и сценический свет.',
};

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

const App = () => {
  const categories = portfolioCategories;
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.slug ?? ''
  );
  const [activeWork, setActiveWork] = useState<PortfolioWork | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeCategoryData = useMemo(
    () => categories.find((category) => category.slug === activeCategory),
    [categories, activeCategory]
  );

  useBodyLock(isModalOpen);

  useEffect(() => {
    if (!activeCategory && categories[0]) {
      setActiveCategory(categories[0].slug);
    }
  }, [activeCategory, categories]);

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
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const openWork = (work: PortfolioWork) => {
    setActiveWork(work);
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
      setActiveCategory(nextCategory.slug);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const activeCategoryDescription =
    (activeCategoryData &&
      categoryDescriptions[activeCategoryData.slug]) ??
    'Описание направления будет добавлено позже.';

  return (
    <div className="page">
      <a className="skip-link" href="#portfolio">
        Перейти к работам
      </a>
      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-inner">
          <span className="brand-mark">DINSBURGH</span>
        </div>
      </header>

      <main>
        <section className="bio-section" aria-labelledby="bio-title">
          <div className="container">
            <div className="hero">
              <h1 id="bio-title" className="hero-title">
                Dinsburgh
              </h1>
              <p className="hero-subtitle">
                Цифровые сцены, экспериментальная живопись и fashion-коллаборации
                с акцентом на свет, фактуру и движение.
              </p>
            </div>

            <div className="glass-panel bio-card" role="note">
              <div className="bio-media" aria-hidden="true">
                <div className="bio-orb" />
              </div>
              <div className="bio-content">
                <h2 className="section-title">Bio</h2>
                <p>
                  Dinsburgh работает на стыке цифровых медиа и классической
                  живописи. Внимание к контрасту и мягкому свечению формирует
                  узнаваемый почерк, а каждая серия строится вокруг ощущения
                  пространственного света.
                </p>
                <div className="bio-meta">
                  <span>Работает с 2016</span>
                  <span>Открыта для коллабораций</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="portfolio">
          <div className="container">
            <div className="portfolio-hero">
              <span className="brand-mark">DINSBURGH</span>
            </div>

            <div className="tabs" role="tablist" aria-label="Разделы работ">
              {categories.map((category, index) => {
                const isActive = category.slug === activeCategory;
                return (
                  <button
                    key={category.slug}
                    ref={(node) => (tabRefs.current[index] = node)}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${category.slug}`}
                    id={`tab-${category.slug}`}
                    className={`tab-button ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveCategory(category.slug)}
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
              PORTFOLIO
            </div>

            <div
              id={
                activeCategoryData?.slug
                  ? `panel-${activeCategoryData.slug}`
                  : undefined
              }
              role="tabpanel"
              aria-labelledby={
                activeCategoryData?.slug
                  ? `tab-${activeCategoryData.slug}`
                  : undefined
              }
              className="portfolio-grid"
              data-state="visible"
              key={activeCategoryData?.slug}
            >
              {activeCategoryData?.works.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  className="work-card"
                  onClick={() => openWork(work)}
                  aria-label={`Открыть работу «${work.title}»`}
                >
                  <img
                    src={work.image}
                    alt={work.title}
                    loading="lazy"
                    width={1200}
                    height={1600}
                  />
                  <span className="work-overlay">
                    <span className="work-title">{work.title}</span>
                  </span>
                </button>
              ))}
            </div>

            {!activeCategoryData && (
              <div className="empty-state">
                В разделе пока нет работ. Добавьте папки с изображениями и
                метаданными в /content/portfolio.
              </div>
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
              <div className="modal-image">
                <img
                  src={activeWork.image}
                  alt={activeWork.title}
                  width={1200}
                  height={1600}
                />
              </div>
              <div className="modal-text">
                <h3 id="modal-title">{activeWork.title}</h3>
                <p id="modal-description">{activeWork.description}</p>
                <span className="modal-tag">{activeWork.categoryLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
