/**
 * BigQuery Release Notes App - Pure Vanilla JavaScript
 * Enhanced Version with:
 * - Group 1: Search Highlighting, Back to Top, Collapsible Day Groups, Keyboard Shortcuts
 * - Group 2: Bookmark/Favorites (⭐), Copy as Markdown (M↓), Filter by Saved
 * - Group 3: Auto-sync Notification Banner, Mobile Bottom Sticky Bar
 */

(function() {
  'use strict';

  // Application State
  let feedData = {
    entries: [],
    items: [],
    categories: {},
    total_entries: 0,
    total_items: 0,
    fetched_at: '',
    feed_updated: ''
  };

  let selectedItemId = null;
  let activeCategoryFilter = 'ALL';
  let searchQuery = '';
  let currentModalItem = null;
  let currentTheme = 'light';
  let bookmarkedIds = new Set();
  let isAllCollapsed = false;
  let lastKnownFeedUpdated = '';

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeShortcutsModalBtn = document.getElementById('closeShortcutsModalBtn');

  const newUpdateBanner = document.getElementById('newUpdateBanner');
  const bannerRefreshBtn = document.getElementById('bannerRefreshBtn');
  const bannerDismissBtn = document.getElementById('bannerDismissBtn');

  const refreshBtn = document.getElementById('refreshBtn');
  const refreshBtnText = document.getElementById('refreshBtnText');
  const statusText = document.getElementById('statusText');
  const statEntriesCount = document.getElementById('statEntriesCount');
  const statItemsCount = document.getElementById('statItemsCount');
  const statSavedCount = document.getElementById('statSavedCount');
  const bookmarkCountSpan = document.getElementById('bookmarkCount');
  const visibleCount = document.getElementById('visibleCount');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilters = document.getElementById('categoryFilters');
  const feedContainer = document.getElementById('feedContainer');
  const emptyState = document.getElementById('emptyState');
  const resetFilterBtn = document.getElementById('resetFilterBtn');

  const toggleCollapseBtn = document.getElementById('toggleCollapseBtn');
  const collapseIcon = document.getElementById('collapseIcon');
  const collapseText = document.getElementById('collapseText');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // Sticky Selected Bar
  const selectedBar = document.getElementById('selectedBar');
  const selectedBadge = document.getElementById('selectedBadge');
  const selectedDate = document.getElementById('selectedDate');
  const selectedPreview = document.getElementById('selectedPreview');
  const tweetSelectedBtn = document.getElementById('tweetSelectedBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');

  // Tweet Modal
  const tweetModal = document.getElementById('tweetModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalDate = document.getElementById('modalDate');
  const modalDocLink = document.getElementById('modalDocLink');
  const tweetContentArea = document.getElementById('tweetContentArea');
  const charCount = document.getElementById('charCount');
  const charCounter = document.getElementById('charCounter');
  const copyTweetBtn = document.getElementById('copyTweetBtn');
  const openTwitterIntentBtn = document.getElementById('openTwitterIntentBtn');
  const bearerTokenInput = document.getElementById('bearerTokenInput');
  const apiPostBtn = document.getElementById('apiPostBtn');
  const toastContainer = document.getElementById('toastContainer');

  // =========================================================================
  // Initialize Application
  // =========================================================================

  function init() {
    initTheme();
    loadBookmarks();

    // Hydrate initial data passed from Flask template
    const rawInitial = document.getElementById('initialFeedData');
    if (rawInitial && rawInitial.textContent.trim()) {
      try {
        feedData = JSON.parse(rawInitial.textContent);
        lastKnownFeedUpdated = feedData.feed_updated || '';
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu ban đầu:', err);
      }
    }

    renderFeed();
    updateStats();
    attachEventListeners();
    setupAutoSyncPolling();
  }

  // =========================================================================
  // Theme Management
  // =========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem('bq_theme');
    if (savedTheme) {
      currentTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
    } else {
      currentTheme = 'light';
    }
    applyTheme(currentTheme, false);
  }

  function applyTheme(theme, showNotification = true) {
    currentTheme = theme;
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeLabel) themeLabel.textContent = 'Sáng';
      if (themeToggleBtn) themeToggleBtn.title = 'Chuyển sang Chế độ sáng (Phím T)';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeLabel) themeLabel.textContent = 'Tối';
      if (themeToggleBtn) themeToggleBtn.title = 'Chuyển sang Chế độ tối (Phím T)';
    }
    localStorage.setItem('bq_theme', theme);

    if (showNotification) {
      const modeName = theme === 'dark' ? 'Chế độ tối (Dark Mode)' : 'Chế độ sáng (Light Mode)';
      showToast(`Đã chuyển sang ${modeName}`, 'info', 2000);
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  }

  // =========================================================================
  // Bookmarks Management
  // =========================================================================

  function loadBookmarks() {
    try {
      const stored = localStorage.getItem('bq_bookmarks');
      if (stored) {
        bookmarkedIds = new Set(JSON.parse(stored));
      }
    } catch (e) {
      bookmarkedIds = new Set();
    }
    updateBookmarkCounts();
  }

  function saveBookmarks() {
    localStorage.setItem('bq_bookmarks', JSON.stringify([...bookmarkedIds]));
    updateBookmarkCounts();
  }

  function updateBookmarkCounts() {
    const count = bookmarkedIds.size;
    if (statSavedCount) statSavedCount.textContent = count;
    if (bookmarkCountSpan) bookmarkCountSpan.textContent = count;
  }

  function toggleBookmark(item, btnElement) {
    const isSaved = bookmarkedIds.has(item.id);
    if (isSaved) {
      bookmarkedIds.delete(item.id);
      showToast('Đã bỏ lưu bản cập nhật', 'info', 2000);
    } else {
      bookmarkedIds.add(item.id);
      showToast('Đã lưu bản cập nhật vào danh sách yêu thích ⭐', 'success', 2500);
    }
    saveBookmarks();

    // Update button visual
    if (btnElement) {
      btnElement.classList.toggle('bookmarked', !isSaved);
      btnElement.innerHTML = `<span>${!isSaved ? '★' : '☆'}</span>`;
      btnElement.title = !isSaved ? 'Bỏ lưu' : 'Lưu bản cập nhật này';
    }

    // If currently filtered by Bookmarked, re-render feed
    if (activeCategoryFilter === 'BOOKMARKED') {
      renderFeed();
    }
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================

  function attachEventListeners() {
    // Theme Toggle Switch
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    // Shortcuts Modal
    if (shortcutsBtn) shortcutsBtn.addEventListener('click', openShortcutsModal);
    if (closeShortcutsModalBtn) closeShortcutsModalBtn.addEventListener('click', closeShortcutsModal);
    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', function(e) {
        if (e.target === shortcutsModal) closeShortcutsModal();
      });
    }

    // Auto-sync Banner Actions
    if (bannerRefreshBtn) {
      bannerRefreshBtn.addEventListener('click', () => {
        newUpdateBanner.classList.add('hidden');
        handleRefresh();
      });
    }
    if (bannerDismissBtn) {
      bannerDismissBtn.addEventListener('click', () => {
        newUpdateBanner.classList.add('hidden');
      });
    }

    // Refresh Button with Spinner
    refreshBtn.addEventListener('click', handleRefresh);

    // Export to CSV Button
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', handleExportCsv);

    // Collapse / Expand All Button
    if (toggleCollapseBtn) toggleCollapseBtn.addEventListener('click', handleToggleCollapseAll);

    // Back to Top Button & Scroll Listener
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    window.addEventListener('scroll', () => {
      if (backToTopBtn) {
        backToTopBtn.classList.toggle('hidden', window.scrollY < 350);
      }
    }, { passive: true });

    // Search Input
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
      renderFeed();
    });

    clearSearchBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderFeed();
      searchInput.focus();
    });

    // Category & Bookmark Filter Pills
    categoryFilters.addEventListener('click', function(e) {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;

      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      activeCategoryFilter = btn.dataset.category || 'ALL';
      renderFeed();
    });

    // Reset Filters Button
    resetFilterBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      activeCategoryFilter = 'ALL';
      document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.category === 'ALL');
      });
      renderFeed();
    });

    // Sticky Selected Bar Actions
    tweetSelectedBtn.addEventListener('click', function() {
      if (selectedItemId) {
        const item = findItemById(selectedItemId);
        if (item) openTweetModal(item);
      }
    });

    clearSelectionBtn.addEventListener('click', deselectItem);

    // Tweet Modal Events
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', function(e) {
      if (e.target === tweetModal) closeTweetModal();
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', handleGlobalKeyboardShortcuts);

    // Tweet Content Input & Character Counter
    tweetContentArea.addEventListener('input', updateCharCounter);

    // Hashtags quick-add buttons
    document.querySelectorAll('.tag-add-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        insertHashtag(this.dataset.tag);
      });
    });

    // Copy Tweet Button inside Modal
    copyTweetBtn.addEventListener('click', handleCopyTweet);

    // Open Twitter Web Intent Button
    openTwitterIntentBtn.addEventListener('click', handleOpenTwitterIntent);

    // Direct API Post Button
    apiPostBtn.addEventListener('click', handleApiPost);
  }

  function handleGlobalKeyboardShortcuts(e) {
    const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    // Escape: close modals or clear search
    if (e.key === 'Escape') {
      if (!tweetModal.classList.contains('hidden')) {
        closeTweetModal();
        return;
      }
      if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
        closeShortcutsModal();
        return;
      }
      if (searchQuery.length > 0) {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderFeed();
        return;
      }
    }

    // Shortcuts only when NOT typing inside inputs
    if (!isInputActive) {
      if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRefresh();
      } else if (e.key === 'c' || e.key === 'C') {
        handleToggleCollapseAll();
      } else if (e.key === '?') {
        e.preventDefault();
        openShortcutsModal();
      }
    }
  }

  function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.remove('hidden');
  }

  function closeShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.add('hidden');
  }

  // =========================================================================
  // Accordion Collapse All / Expand All
  // =========================================================================

  function handleToggleCollapseAll() {
    isAllCollapsed = !isAllCollapsed;
    document.querySelectorAll('.release-day-group').forEach(group => {
      group.classList.toggle('collapsed', isAllCollapsed);
    });

    if (collapseIcon) collapseIcon.textContent = isAllCollapsed ? '📂' : '📁';
    if (collapseText) collapseText.textContent = isAllCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả';
  }

  // =========================================================================
  // Refresh Feed with Spinner
  // =========================================================================

  async function handleRefresh() {
    if (refreshBtn.disabled) return;

    refreshBtn.disabled = true;
    refreshBtn.classList.add('loading');
    refreshBtnText.textContent = 'Đang tải dữ liệu...';
    showToast('Đang kết nối và lấy dữ liệu mới từ Google Cloud...', 'info', 3000);

    try {
      const response = await fetch('/api/feed?refresh=true', {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi ${response.status}`);
      }

      const data = await response.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      feedData = data;
      lastKnownFeedUpdated = data.feed_updated || '';
      renderFeed();
      updateStats();

      if (data.warning) {
        showToast(data.warning, 'error', 5000);
      } else {
        showToast('Đã làm mới dữ liệu BigQuery Release Notes thành công!', 'success', 4000);
      }

      feedContainer.style.opacity = '0.3';
      setTimeout(() => {
        feedContainer.style.transition = 'opacity 0.4s ease';
        feedContainer.style.opacity = '1';
      }, 50);

    } catch (err) {
      console.error('Lỗi khi làm mới dữ liệu:', err);
      showToast(`Không thể cập nhật: ${err.message}`, 'error', 5000);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('loading');
      refreshBtnText.textContent = 'Làm mới dữ liệu';
    }
  }

  // =========================================================================
  // Auto-sync Polling (Background check every 5 minutes)
  // =========================================================================

  function setupAutoSyncPolling() {
    setInterval(async () => {
      try {
        const resp = await fetch('/api/feed');
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.feed_updated && lastKnownFeedUpdated && data.feed_updated !== lastKnownFeedUpdated) {
          if (newUpdateBanner) newUpdateBanner.classList.remove('hidden');
        }
      } catch (e) {
        // Silent background check error
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // =========================================================================
  // Render Feed with Search Highlighting & Accordion
  // =========================================================================

  function highlightMatches(text, query) {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function renderFeed() {
    feedContainer.innerHTML = '';
    let totalVisible = 0;

    if (!feedData.entries || feedData.entries.length === 0) {
      emptyState.classList.remove('hidden');
      visibleCount.textContent = '0';
      return;
    }

    feedData.entries.forEach(entry => {
      // Filter items inside this entry
      const filteredItems = entry.items.filter(item => {
        // Bookmark filter
        if (activeCategoryFilter === 'BOOKMARKED') {
          if (!bookmarkedIds.has(item.id)) return false;
        } else if (activeCategoryFilter !== 'ALL') {
          if (item.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) return false;
        }

        // Search query check
        const matchSearch = !searchQuery || 
                            item.full_text.toLowerCase().includes(searchQuery) || 
                            item.category.toLowerCase().includes(searchQuery) ||
                            item.date.toLowerCase().includes(searchQuery);

        return matchSearch;
      });

      if (filteredItems.length === 0) return; // Skip dates with no matching items

      totalVisible += filteredItems.length;

      // Group card for this release date
      const groupCard = document.createElement('article');
      groupCard.className = `release-day-group ${isAllCollapsed ? 'collapsed' : ''}`;

      // Header of the day (clickable accordion)
      const dayHeader = document.createElement('div');
      dayHeader.className = 'release-day-header';
      dayHeader.innerHTML = `
        <div class="release-date-title">
          <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${highlightMatches(escapeHtml(entry.title), searchQuery)}</span>
          <span class="collapse-indicator">▼</span>
        </div>
        <a href="${escapeHtml(entry.doc_link)}" target="_blank" rel="noopener noreferrer" class="release-doc-link" onclick="event.stopPropagation();">
          Xem tài liệu chính thức ↗
        </a>
      `;

      // Accordion click on header
      dayHeader.addEventListener('click', () => {
        groupCard.classList.toggle('collapsed');
      });

      groupCard.appendChild(dayHeader);

      // Sub-items list
      const itemsList = document.createElement('div');
      itemsList.className = 'release-items-list';

      filteredItems.forEach(item => {
        const isSelected = (item.id === selectedItemId);
        const isBookmarked = bookmarkedIds.has(item.id);

        const itemCard = document.createElement('div');
        itemCard.className = `release-item-card ${isSelected ? 'selected' : ''}`;
        itemCard.dataset.itemId = item.id;

        const badgeClass = getBadgeClass(item.category);

        // Highlight matching query inside HTML body if searching
        let renderedHtml = item.html;
        if (searchQuery) {
          renderedHtml = highlightMatches(renderedHtml, searchQuery);
        }

        itemCard.innerHTML = `
          <div class="item-top-bar">
            <div class="item-badge-wrap">
              <span class="badge ${badgeClass}">${escapeHtml(item.category)}</span>
            </div>
            <div class="item-actions-group">
              <!-- Bookmark Star -->
              <button type="button" class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-action="bookmark" data-id="${item.id}" title="${isBookmarked ? 'Bỏ lưu' : 'Lưu bản cập nhật này (Bookmark)'}">
                <span>${isBookmarked ? '★' : '☆'}</span>
              </button>
              <!-- Select Button -->
              <button type="button" class="select-item-btn" data-action="select" data-id="${item.id}">
                <span class="select-icon">${isSelected ? '✓' : '○'}</span>
                <span>${isSelected ? 'Đang chọn' : 'Chọn bản này'}</span>
              </button>
              <!-- Copy Text Button -->
              <button type="button" class="copy-item-btn" data-action="copy-item" data-id="${item.id}" title="Sao chép nội dung văn bản">
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="copy-btn-text">Sao chép</span>
              </button>
              <!-- Copy Markdown Button -->
              <button type="button" class="copy-md-btn" data-action="copy-md" data-id="${item.id}" title="Sao chép dưới dạng Markdown">
                <span class="md-icon">M↓</span>
                <span class="md-btn-text">Markdown</span>
              </button>
              <!-- Twitter Button -->
              <button type="button" class="quick-tweet-btn" data-action="quick-tweet" data-id="${item.id}" title="Đăng lên Twitter">
                <svg class="twitter-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Đăng Twitter</span>
              </button>
            </div>
          </div>
          <div class="item-body-html">
            ${renderedHtml}
          </div>
        `;

        // Card button events
        const bookmarkBtn = itemCard.querySelector('[data-action="bookmark"]');
        bookmarkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleBookmark(item, bookmarkBtn);
        });

        const selectBtn = itemCard.querySelector('[data-action="select"]');
        selectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSelectItem(item);
        });

        const copyBtn = itemCard.querySelector('[data-action="copy-item"]');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleCopyItemContent(item, copyBtn);
        });

        const copyMdBtn = itemCard.querySelector('[data-action="copy-md"]');
        copyMdBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleCopyMarkdown(item, copyMdBtn);
        });

        const quickTweetBtn = itemCard.querySelector('[data-action="quick-tweet"]');
        quickTweetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectItem(item);
          openTweetModal(item);
        });

        // Clicking the item card selects it
        itemCard.addEventListener('click', () => {
          toggleSelectItem(item);
        });

        itemsList.appendChild(itemCard);
      });

      groupCard.appendChild(itemsList);
      feedContainer.appendChild(groupCard);
    });

    visibleCount.textContent = totalVisible;
    emptyState.classList.toggle('hidden', totalVisible > 0);
  }

  // =========================================================================
  // Copy to Clipboard (Plain Text & Markdown)
  // =========================================================================

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      return success;
    }
  }

  async function handleCopyItemContent(item, btnElement) {
    const formattedText = `[BigQuery Release Note - ${item.date}]
Phân loại: ${item.category}
Nội dung: ${item.full_text}
Tài liệu: ${item.doc_link}`;

    await copyToClipboard(formattedText);

    const textSpan = btnElement.querySelector('.copy-btn-text');
    btnElement.classList.add('copied');
    if (textSpan) textSpan.textContent = '✓ Đã chép';

    setTimeout(() => {
      btnElement.classList.remove('copied');
      if (textSpan) textSpan.textContent = 'Sao chép';
    }, 2000);

    showToast('Đã sao chép nội dung bản cập nhật vào bảng nhớ tạm!', 'success', 2500);
  }

  async function handleCopyMarkdown(item, btnElement) {
    const mdText = `### [BigQuery Update] ${item.date} - ${item.category}
${item.full_text}

- [Xem tài liệu chính thức](${item.doc_link})`;

    await copyToClipboard(mdText);

    const textSpan = btnElement.querySelector('.md-btn-text');
    btnElement.classList.add('copied');
    if (textSpan) textSpan.textContent = '✓ Đã chép';

    setTimeout(() => {
      btnElement.classList.remove('copied');
      if (textSpan) textSpan.textContent = 'Markdown';
    }, 2000);

    showToast('Đã sao chép nội dung dưới dạng Markdown!', 'success', 2500);
  }

  // =========================================================================
  // Export to CSV
  // =========================================================================

  function handleExportCsv() {
    if (!feedData.entries || feedData.entries.length === 0) {
      showToast('Không có dữ liệu để xuất!', 'error');
      return;
    }

    const itemsToExport = [];
    feedData.entries.forEach(entry => {
      entry.items.forEach(item => {
        if (activeCategoryFilter === 'BOOKMARKED') {
          if (!bookmarkedIds.has(item.id)) return;
        } else if (activeCategoryFilter !== 'ALL') {
          if (item.category.toLowerCase() !== activeCategoryFilter.toLowerCase()) return;
        }

        const matchSearch = !searchQuery || 
                            item.full_text.toLowerCase().includes(searchQuery) || 
                            item.category.toLowerCase().includes(searchQuery) ||
                            item.date.toLowerCase().includes(searchQuery);

        if (matchSearch) itemsToExport.push(item);
      });
    });

    if (itemsToExport.length === 0) {
      showToast('Không có bản cập nhật nào phù hợp với bộ lọc để xuất!', 'error');
      return;
    }

    const escapeCsv = (str) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const headers = ['Ngày phát hành', 'Danh mục', 'Tóm tắt', 'Nội dung chi tiết', 'Liên kết tài liệu'];
    const csvRows = [headers.map(escapeCsv).join(',')];

    itemsToExport.forEach(item => {
      csvRows.push([
        escapeCsv(item.date),
        escapeCsv(item.category),
        escapeCsv(item.summary),
        escapeCsv(item.full_text),
        escapeCsv(item.doc_link)
      ].join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);

    const dateSlug = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `bigquery_release_notes_${dateSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    showToast(`Đã xuất thành công ${itemsToExport.length} bản cập nhật sang tệp CSV!`, 'success', 3500);
  }

  // =========================================================================
  // Selection Logic
  // =========================================================================

  function toggleSelectItem(item) {
    if (selectedItemId === item.id) {
      deselectItem();
    } else {
      selectItem(item);
    }
  }

  function selectItem(item) {
    selectedItemId = item.id;

    document.querySelectorAll('.release-item-card').forEach(card => {
      const isSelected = card.dataset.itemId === item.id;
      card.classList.toggle('selected', isSelected);
      const selectBtn = card.querySelector('.select-item-btn');
      if (selectBtn) {
        selectBtn.innerHTML = `
          <span class="select-icon">${isSelected ? '✓' : '○'}</span>
          <span>${isSelected ? 'Đang chọn' : 'Chọn bản này'}</span>
        `;
      }
    });

    selectedBadge.className = `selected-badge ${getBadgeClass(item.category)}`;
    selectedBadge.textContent = item.category;
    selectedDate.textContent = item.date;
    selectedPreview.textContent = item.summary;
    selectedBar.classList.remove('hidden');
  }

  function deselectItem() {
    selectedItemId = null;
    selectedBar.classList.add('hidden');

    document.querySelectorAll('.release-item-card').forEach(card => {
      card.classList.remove('selected');
      const selectBtn = card.querySelector('.select-item-btn');
      if (selectBtn) {
        selectBtn.innerHTML = `
          <span class="select-icon">○</span>
          <span>Chọn bản này</span>
        `;
      }
    });
  }

  function findItemById(id) {
    if (!feedData.items) return null;
    return feedData.items.find(i => i.id === id);
  }

  // =========================================================================
  // Twitter Modal & Share Actions
  // =========================================================================

  function openTweetModal(item) {
    currentModalItem = item;

    modalCategoryBadge.className = `badge ${getBadgeClass(item.category)}`;
    modalCategoryBadge.textContent = item.category;
    modalDate.textContent = item.date;
    modalDocLink.href = item.doc_link;

    tweetContentArea.value = item.tweet_draft;
    updateCharCounter();

    tweetModal.classList.remove('hidden');
    tweetContentArea.focus();
  }

  function closeTweetModal() {
    tweetModal.classList.add('hidden');
    currentModalItem = null;
  }

  function updateCharCounter() {
    const text = tweetContentArea.value;
    const len = text.length;
    charCount.textContent = len;

    charCounter.classList.remove('warning', 'exceeded');
    if (len > 280) {
      charCounter.classList.add('exceeded');
    } else if (len > 240) {
      charCounter.classList.add('warning');
    }
  }

  function insertHashtag(tag) {
    let currentText = tweetContentArea.value;
    if (currentText.includes(tag)) {
      currentText = currentText.replace(new RegExp(`\\s*${tag}`, 'g'), '').trim();
    } else {
      currentText = currentText.trim() + ' ' + tag;
    }
    tweetContentArea.value = currentText;
    updateCharCounter();
  }

  function handleOpenTwitterIntent() {
    const text = tweetContentArea.value.trim();
    if (!text) {
      showToast('Nội dung tweet không được để trống!', 'error');
      return;
    }

    if (text.length > 280) {
      const confirmPost = confirm(`Nội dung đang có ${text.length} ký tự (vượt quá 280 ký tự của Twitter). Bạn vẫn muốn mở Twitter để chỉnh sửa thêm chứ?`);
      if (!confirmPost) return;
    }

    const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    const width = 600;
    const height = 480;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

    window.open(
      tweetIntentUrl,
      'TwitterPostWindow',
      `toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    );

    showToast('Đã mở cửa sổ đăng bài lên Twitter / X!', 'success');
  }

  async function handleCopyTweet() {
    const text = tweetContentArea.value.trim();
    if (!text) {
      showToast('Nội dung rỗng, không có gì để sao chép!', 'error');
      return;
    }

    await copyToClipboard(text);
    showToast('Đã sao chép nội dung Tweet vào bộ nhớ tạm!', 'success');
  }

  async function handleApiPost() {
    const text = tweetContentArea.value.trim();
    const bearerToken = bearerTokenInput.value.trim();

    if (!text) {
      showToast('Vui lòng nhập nội dung tweet!', 'error');
      return;
    }

    apiPostBtn.disabled = true;
    apiPostBtn.textContent = 'Đang gửi...';

    try {
      const response = await fetch('/api/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          bearer_token: bearerToken || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Đã đăng tweet thành công qua Twitter API!', 'success');
        closeTweetModal();
      } else {
        if (result.can_use_intent) {
          showToast(`${result.error}\n💡 ${result.hint || 'Hãy sử dụng nút "Mở Twitter để đăng ngay"' }`, 'info', 6000);
        } else {
          showToast(`Lỗi: ${result.error}`, 'error', 5000);
        }
      }
    } catch (err) {
      showToast(`Lỗi kết nối máy chủ: ${err.message}`, 'error', 4000);
    } finally {
      apiPostBtn.disabled = false;
      apiPostBtn.textContent = 'Gửi qua API Endpoint';
    }
  }

  // =========================================================================
  // Helpers & Toast Notifications
  // =========================================================================

  function updateStats() {
    statEntriesCount.textContent = feedData.total_entries || '0';
    statItemsCount.textContent = feedData.total_items || '0';
    statusText.textContent = `Cập nhật: ${feedData.fetched_at || 'Mới tải'}`;
    updateBookmarkCounts();
  }

  function getBadgeClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('feature')) return 'badge-feature';
    if (cat.includes('change')) return 'badge-change';
    if (cat.includes('announcement')) return 'badge-announcement';
    if (cat.includes('fixed')) return 'badge-fixed';
    if (cat.includes('security')) return 'badge-security';
    if (cat.includes('deprecated')) return 'badge-deprecated';
    return 'badge-feature';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
