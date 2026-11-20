/**
 * TASKIFY PRODUCT WEBSITE SCRIPT
 * Architecture: GSAP 3.12 + Native Interactive Reactivity
 * Zero build-step, instant client-side execution
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // 1. TOP SCROLL PROGRESS BAR
  // -------------------------------------------------------------------------
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

  // -------------------------------------------------------------------------
  // 2. MOBILE HAMBURGER MENU DRAWER & FULLSCREEN BACKDROP
  // -------------------------------------------------------------------------
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

  if (hamburgerBtn && mobileMenu) {
    const closeDrawer = () => {
      hamburgerBtn.classList.remove('active');
      mobileMenu.classList.remove('open');
      if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    };

    const openDrawer = () => {
      hamburgerBtn.classList.add('active');
      mobileMenu.classList.add('open');
      if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('open');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
    };

    const toggleMenu = () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };

    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener('click', () => {
        closeDrawer();
      });
    }

    // Close menu when clicking any mobile navigation link
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu-link, .btn-primary');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  // -------------------------------------------------------------------------
  // 3. BACK TO TOP BUTTON
  // -------------------------------------------------------------------------
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -------------------------------------------------------------------------
  // 4. HERO INTERACTIVE MACOS MOCKUP WINDOW (Tabs & Reactive Engine)
  // -------------------------------------------------------------------------

  // 4A. Live Mockup Clock
  const clockEl = document.getElementById('mockup-live-clock');
  const updateClock = () => {
    if (!clockEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
  };
  updateClock();
  setInterval(updateClock, 30000);

  // 4B. Tab Switcher
  const tabButtons = document.querySelectorAll('.mockup-tab-btn');
  const panels = document.querySelectorAll('.mockup-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      panels.forEach((panel) => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(`mockup-panel-${targetTab}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // 4C. PANEL 1: Today Checklist & Streak Button
  const todayTasksContainer = document.getElementById('today-interactive-tasks');
  const pendingTasksCaption = document.getElementById('today-tasks-pending-caption');

  const updatePendingCount = () => {
    if (!todayTasksContainer || !pendingTasksCaption) return;
    const totalItems = todayTasksContainer.querySelectorAll('.mockup-task-item').length;
    const completedItems = todayTasksContainer.querySelectorAll('.mockup-task-item.completed').length;
    const pending = totalItems - completedItems;
    pendingTasksCaption.textContent = `Today Focus: ${pending} ${pending === 1 ? 'task' : 'tasks'} pending`;
  };

  if (todayTasksContainer) {
    todayTasksContainer.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.mockup-task-item');
      if (!taskItem) return;

      taskItem.classList.toggle('completed');
      const circle = taskItem.querySelector('.mockup-check-circle');
      if (circle) {
        if (taskItem.classList.contains('completed')) {
          circle.classList.add('checked');
          circle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
          circle.classList.remove('checked');
          circle.innerHTML = '';
        }
      }
      updatePendingCount();
    });
  }

  // Today Streak Check-in Button
  const streakBtn = document.getElementById('btn-checkin-today');
  const streakValEl = document.getElementById('streak-counter-val');
  if (streakBtn && streakValEl) {
    let streakCount = 14;
    streakBtn.addEventListener('click', () => {
      if (streakBtn.classList.contains('done')) return;
      streakCount += 1;
      streakValEl.textContent = `${streakCount} Days`;
      streakBtn.classList.add('done');
      streakBtn.textContent = '✓ Checked In!';
    });
  }

  // 4D. PANEL 2: Tasks Module (Quick Add & Filters)
  const taskInput = document.getElementById('input-quick-task');
  const taskAddBtn = document.getElementById('btn-add-quick-task');
  const tasksModuleList = document.getElementById('tasks-module-list');
  const countAllTasksEl = document.getElementById('count-all-tasks');

  const updateAllTasksCount = () => {
    if (!tasksModuleList || !countAllTasksEl) return;
    const count = tasksModuleList.querySelectorAll('.mockup-task-item').length;
    countAllTasksEl.textContent = String(count);
  };

  const addNewTask = () => {
    if (!taskInput || !tasksModuleList) return;
    const val = taskInput.value.trim();
    if (!val) return;

    const newItem = document.createElement('div');
    newItem.className = 'mockup-task-item';
    newItem.innerHTML = `
      <div class="mockup-task-left">
        <div class="mockup-check-circle"></div>
        <div class="mockup-task-info">
          <span class="mockup-task-title">${escapeHTML(val)}</span>
          <span class="mockup-task-meta">Added just now • Priority Normal</span>
        </div>
      </div>
      <span class="mockup-tag tag-orange">New</span>
    `;

    tasksModuleList.prepend(newItem);
    taskInput.value = '';
    updateAllTasksCount();
  };

  if (taskAddBtn && taskInput) {
    taskAddBtn.addEventListener('click', addNewTask);
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewTask();
      }
    });
  }

  if (tasksModuleList) {
    tasksModuleList.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.mockup-task-item');
      if (!taskItem) return;

      taskItem.classList.toggle('completed');
      const circle = taskItem.querySelector('.mockup-check-circle');
      if (circle) {
        if (taskItem.classList.contains('completed')) {
          circle.classList.add('checked');
          circle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
          circle.classList.remove('checked');
          circle.innerHTML = '';
        }
      }
    });
  }

  // Filter chips in tasks panel
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // 4E. PANEL 3: Habits Check-in Buttons
  const habitButtons = document.querySelectorAll('.habit-checkin-btn');
  habitButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('done')) return;
      btn.classList.add('done');
      btn.textContent = '✓ Done';
      const streakSpan = btn.closest('.mockup-habit-card')?.querySelector('.habit-streak-num');
      if (streakSpan) {
        const currentNum = parseInt(streakSpan.textContent, 10) || 0;
        streakSpan.textContent = `${currentNum + 1} days unbroken`;
      }
    });
  });

  // 4F. PANEL 4: Notes Editor & Live Counters
  const noteTextarea = document.getElementById('mockup-note-input');
  const noteStatsText = document.getElementById('note-stats-text');

  const updateNoteStats = () => {
    if (!noteTextarea || !noteStatsText) return;
    const text = noteTextarea.value.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    noteStatsText.textContent = `${words} ${words === 1 ? 'word' : 'words'} • ${chars} characters`;
  };

  if (noteTextarea) {
    noteTextarea.addEventListener('input', updateNoteStats);
    updateNoteStats();

    // Toolbar formatting buttons
    const toolBold = document.getElementById('tool-bold');
    const toolItalic = document.getElementById('tool-italic');
    const toolHeading = document.getElementById('tool-heading');
    const toolList = document.getElementById('tool-list');
    const toolHighlight = document.getElementById('tool-highlight');

    const insertFormatting = (prefix, suffix = '') => {
      const start = noteTextarea.selectionStart;
      const end = noteTextarea.selectionEnd;
      const selected = noteTextarea.value.substring(start, end) || 'text';
      const replacement = `${prefix}${selected}${suffix}`;
      noteTextarea.setRangeText(replacement, start, end, 'end');
      noteTextarea.focus();
      updateNoteStats();
    };

    if (toolBold) toolBold.addEventListener('click', () => insertFormatting('**', '**'));
    if (toolItalic) toolItalic.addEventListener('click', () => insertFormatting('*', '*'));
    if (toolHeading) toolHeading.addEventListener('click', () => insertFormatting('\n# '));
    if (toolList) toolList.addEventListener('click', () => insertFormatting('\n- '));
    if (toolHighlight) toolHighlight.addEventListener('click', () => insertFormatting('==', '=='));

    // Color accents
    const colorDots = document.querySelectorAll('.color-dot');
    const notesWrap = document.querySelector('.mockup-notes-wrap');
    colorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        if (notesWrap) {
          notesWrap.style.borderColor = dot.style.background;
        }
      });
    });
  }

  // 4G. PANEL 5: Pomodoro Focus Timer
  const timerDisplay = document.getElementById('focus-time-display');
  const timerCircle = document.getElementById('focus-progress-circle');
  const timerToggleBtn = document.getElementById('btn-focus-toggle');
  const timerResetBtn = document.getElementById('btn-focus-reset');
  const presetPills = document.querySelectorAll('.focus-preset-pill');

  let currentPresetMinutes = 25;
  let remainingSeconds = 25 * 60;
  let timerInterval = null;
  const circumference = 283; // 2 * pi * 45 ≈ 282.74

  const updateTimerDisplay = () => {
    if (!timerDisplay) return;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerCircle) {
      const totalSeconds = currentPresetMinutes * 60;
      const fraction = remainingSeconds / totalSeconds;
      const offset = circumference * (1 - fraction);
      timerCircle.style.strokeDashoffset = offset;
    }
  };

  presetPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      presetPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentPresetMinutes = parseInt(pill.getAttribute('data-minutes'), 10) || 25;
      remainingSeconds = currentPresetMinutes * 60;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (timerToggleBtn) timerToggleBtn.textContent = 'Start Focus';
      }
      updateTimerDisplay();
    });
  });

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', () => {
      if (timerInterval) {
        // Pause timer
        clearInterval(timerInterval);
        timerInterval = null;
        timerToggleBtn.textContent = 'Resume Focus';
      } else {
        // Start timer
        timerToggleBtn.textContent = 'Pause';
        timerInterval = setInterval(() => {
          if (remainingSeconds > 0) {
            remainingSeconds -= 1;
            updateTimerDisplay();
          } else {
            clearInterval(timerInterval);
            timerInterval = null;
            timerToggleBtn.textContent = 'Cycle Done!';
          }
        }, 1000);
      }
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      remainingSeconds = currentPresetMinutes * 60;
      if (timerToggleBtn) timerToggleBtn.textContent = 'Start Focus';
      updateTimerDisplay();
    });
  }

  // -------------------------------------------------------------------------
  // 5. GSAP ENTRANCE & SCROLLTRIGGER ANIMATIONS
  // -------------------------------------------------------------------------
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
      .fromTo('.hero-headline', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, delay: 0.1 })
      .fromTo('.hero-subtext', { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
      .fromTo('.hero-cta-group', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
      .fromTo('.hero-frame-wrapper', { scale: 0.95, opacity: 0, y: 35 }, { scale: 1, opacity: 1, y: 0, duration: 1.0 }, '-=0.5');

    // Word scrubbing in Our Promise section
    const manifestoContainer = document.getElementById('manifesto-text');
    if (manifestoContainer) {
      const rawText = manifestoContainer.innerText.trim();
      const words = rawText.split(/\s+/);

      manifestoContainer.innerHTML = words
        .map((word) => `<span class="scrub-word">${escapeHTML(word)}</span>`)
        .join(' ');

      const scrubWords = manifestoContainer.querySelectorAll('.scrub-word');

      gsap.fromTo(
        scrubWords,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: {
            trigger: '.manifesto-section',
            start: 'top 75%',
            end: 'bottom 45%',
            scrub: 0.8,
          },
        }
      );
    }

    // Bento cards stagger
    const bentoCards = gsap.utils.toArray('.bento-card');
    if (bentoCards.length > 0) {
      gsap.fromTo(
        bentoCards,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 82%',
            end: 'bottom 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Refresh ScrollTrigger on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    });
  }

  // Helper function to escape HTML
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // 6. INTERACTIVE DATA SOVEREIGNTY CONSOLE (#commitment)
  // -------------------------------------------------------------------------
  const consoleTabBtns = document.querySelectorAll('.console-tab-btn');
  const consolePanels = document.querySelectorAll('.console-panel');

  consoleTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-console-mode');
      consoleTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      consolePanels.forEach((p) => p.classList.remove('active'));
      const activePanel = document.getElementById(`console-panel-${mode}`);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // Live AES-GCM Ciphertext simulation on keystroke
  const plainInput = document.getElementById('console-plain-input');
  const cipherDisplay = document.getElementById('console-cipher-display');

  // Simple deterministic client hash generator for instant responsive feedback
  const computeCipherSim = (str) => {
    if (!str) return 'e0a1 0000 0000 0000 0000 0000 0000 0000 (Empty plain text)';
    let hash = 0x811c9dc5;
    const hexParts = [];
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
      if (i % 2 === 0) {
        const hex = ((hash ^ (i * 0x5bd1e995)) >>> 0).toString(16).padStart(8, '0');
        hexParts.push(hex.substring(0, 4), hex.substring(4, 8));
      }
    }
    while (hexParts.length < 8) {
      hash = (hash * 0x01000193) >>> 0;
      hexParts.push((hash >>> 0).toString(16).padStart(4, '0'));
    }
    return hexParts.slice(0, 10).join(' ') + ' [AES-GCM-256 Auth Tag: ' + (hash >>> 16).toString(16).padStart(4, '0') + ']';
  };

  if (plainInput && cipherDisplay) {
    plainInput.addEventListener('input', () => {
      const val = plainInput.value.trim();
      const codeEl = cipherDisplay.querySelector('code');
      if (codeEl) {
        codeEl.textContent = computeCipherSim(val);
      }
    });
  }

  // Airgap connectivity simulation buttons
  const btnAirgapOffline = document.getElementById('btn-airgap-offline');
  const btnAirgapOnline = document.getElementById('btn-airgap-online');
  const valRequests = document.getElementById('val-telemetry-requests');
  const valLatency = document.getElementById('val-telemetry-latency');
  const valLockin = document.getElementById('val-telemetry-lockin');

  if (btnAirgapOffline && btnAirgapOnline) {
    btnAirgapOffline.addEventListener('click', () => {
      btnAirgapOffline.classList.add('active');
      btnAirgapOnline.classList.remove('active');
      if (valRequests) valRequests.textContent = '0';
      if (valLatency) valLatency.textContent = '< 1.2 ms';
      if (valLockin) valLockin.textContent = '0.0%';
    });

    btnAirgapOnline.addEventListener('click', () => {
      btnAirgapOnline.classList.add('active');
      btnAirgapOffline.classList.remove('active');
      if (valRequests) valRequests.textContent = '0';
      if (valLatency) valLatency.textContent = '< 1.2 ms';
      if (valLockin) valLockin.textContent = '0.0%';
    });
  }

  // Copy Schema Button
  const btnCopySchema = document.getElementById('btn-copy-schema');
  if (btnCopySchema) {
    btnCopySchema.addEventListener('click', () => {
      const schemaCode = `db.version(1).stores({
  tasks: '++id, title, completed, priority, dueDate, createdAt',
  habits: '++id, title, frequency, streak, createdAt',
  habitLogs: '++id, habitId, date, completed',
  notes: '++id, title, isPinned, colorTag, updatedAt',
  transactions: '++id, amount, category, type, date',
  settings: 'key, value'
});`;
      navigator.clipboard.writeText(schemaCode).then(() => {
        btnCopySchema.textContent = '✓ Schema Copied!';
        setTimeout(() => {
          btnCopySchema.textContent = '○ Copy Schema';
        }, 2000);
      }).catch(() => {
        btnCopySchema.textContent = '✓ Selected';
      });
    });
  }

});
