import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookMarked, Copy } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { BIBLE_BOOKS } from '../../data/initialData';
import { ReadingToolbar } from '../ChurchLogo';

export const AlkitabPage: React.FC = () => {
  const {
    fontScale,
    showToast,
    navigate,
    bookmarkedVerses,
    activeBibleTarget,
    clearActiveBibleTarget,
    toggleBookmarkVerse,
    isVerseBookmarked,
  } = useChurch();
  const [testament, setTestament] = useState<'Semua' | 'PL' | 'PB'>('Semua');
  const [selectedBookId, setSelectedBookId] = useState<string>(
    activeBibleTarget?.bookId || 'mzm'
  );
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    activeBibleTarget?.chapter || 23
  );

  useEffect(() => {
    if (activeBibleTarget) {
      setTestament('Semua');
      setSelectedBookId(activeBibleTarget.bookId);
      setSelectedChapterNum(activeBibleTarget.chapter);
      clearActiveBibleTarget();
    }
  }, [activeBibleTarget, clearActiveBibleTarget]);

  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((b) => testament === 'Semua' || b.testament === testament);
  }, [testament]);

  const currentBook =
    filteredBooks.find((b) => b.id === selectedBookId) || filteredBooks[0] || BIBLE_BOOKS[0];

  const currentChapter =
    currentBook.chapters.find((c) => c.chapter === selectedChapterNum) ||
    currentBook.chapters[0];

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    const bk = BIBLE_BOOKS.find((b) => b.id === bookId);
    if (bk && bk.chapters[0]) {
      setSelectedChapterNum(bk.chapters[0].chapter);
    }
  };

  const copyVerse = (verseNum: number, text: string) => {
    const ref = `${currentBook.name} ${currentChapter.chapter}:${verseNum} — "${text}"`;
    navigator.clipboard?.writeText(ref);
    showToast(`Ayat ${currentBook.name} ${currentChapter.chapter}:${verseNum} disalin.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
            Alkitab Terjemahan Baru
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Pembaca Perjanjian Lama (PL) & Perjanjian Baru (PB) dengan pemilih kitab, pasal, dan Bookmark Ayat.
          </p>
        </div>
        <ReadingToolbar label="Ukuran Ayat" />
      </div>

      {/* Desktop Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Testament, Book, Chapter Selector & Bookmark Link */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1E1008]">
              {(
                [
                  { id: 'Semua', label: 'Semua' },
                  { id: 'PL', label: 'PL' },
                  { id: 'PB', label: 'PB' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTestament(t.id)}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                    testament === t.id
                      ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pilih Kitab
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredBooks.map((book) => {
                  const active = book.id === currentBook.id;
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleSelectBook(book.id)}
                      className={`min-h-[42px] rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-semibold border transition-colors ${
                        active
                          ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="block truncate">{book.name}</span>
                      <span className="text-[10px] opacity-75">
                        {book.testament === 'PL' ? 'Perj. Lama' : 'Perj. Baru'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pilih Pasal ({currentBook.name})
              </p>
              <div className="flex flex-wrap gap-2">
                {currentBook.chapters.map((ch) => {
                  const active = ch.chapter === currentChapter.chapter;
                  return (
                    <button
                      key={ch.chapter}
                      type="button"
                      onClick={() => setSelectedChapterNum(ch.chapter)}
                      className={`font-mono-nums min-h-[40px] min-w-[44px] px-3 rounded-xl text-sm font-bold border transition-colors ${
                        active
                          ? 'border-[#D4AF37] bg-[#D4AF37] text-[#431407]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {ch.chapter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bookmark Ayat Shortcut */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Bookmark className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>
                  <strong className="font-mono-nums">{bookmarkedVerses.length}</strong> ayat tersimpan
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('profil')}
                className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Lihat di Profil
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Bible Passage Reading Pane */}
        <div className="lg:col-span-8">
          <article className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                  {currentBook.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
                  {currentBook.name} Pasal {currentChapter.chapter}
                </h2>
              </div>
              <BookMarked className="h-6 w-6 text-[#D4AF37] shrink-0" />
            </div>

            <div className="space-y-4">
              {currentChapter.verses.map((v) => {
                const bookmarked = isVerseBookmarked(
                  currentBook.id,
                  currentChapter.chapter,
                  v.verse
                );
                return (
                  <div
                    key={v.verse}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 -mx-2 transition-colors ${
                      bookmarked
                        ? 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-mono-nums text-xs font-bold text-[#9A7B16] dark:text-[#E5C158] pt-1.5 min-w-[26px]">
                      {v.verse}
                    </span>
                    <p
                      className="flex-1 font-serif-reading text-slate-800 dark:text-slate-100 leading-relaxed"
                      style={{ fontSize: `${1.05 * fontScale}rem`, lineHeight: 1.85 }}
                    >
                      {v.text}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleBookmarkVerse({
                            bookId: currentBook.id,
                            bookName: currentBook.name,
                            testament: currentBook.testament,
                            chapter: currentChapter.chapter,
                            verse: v.verse,
                            text: v.text,
                          })
                        }
                        aria-pressed={bookmarked}
                        aria-label={
                          bookmarked
                            ? `Hapus bookmark ${currentBook.name} ${currentChapter.chapter}:${v.verse}`
                            : `Simpan bookmark ${currentBook.name} ${currentChapter.chapter}:${v.verse}`
                        }
                        title={bookmarked ? 'Hapus dari Bookmark Ayat' : 'Simpan ke Bookmark Ayat'}
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                          bookmarked
                            ? 'text-[#9A7B16] dark:text-[#D4AF37] bg-[#D4AF37]/15'
                            : 'text-slate-400 opacity-75 group-hover:opacity-100 hover:text-[#431407] dark:hover:text-[#D4AF37]'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => copyVerse(v.verse, v.text)}
                        aria-label={`Salin ${currentBook.name} ${currentChapter.chapter}:${v.verse}`}
                        title={`Salin ${currentBook.name} ${currentChapter.chapter}:${v.verse}`}
                        className="opacity-75 group-hover:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#9A3412] dark:hover:text-[#D4AF37]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
