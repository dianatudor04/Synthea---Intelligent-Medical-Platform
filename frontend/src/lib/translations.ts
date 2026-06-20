// Flat key → string dictionary. Add keys as you translate more surfaces.
// English is the source of truth; Romanian falls back to English for missing keys.

export const translations = {
  en: {
    // ─── Language toggle ─────────────────────────────────────────
    'lang.toggle.tooltip': 'Switch language',
    'lang.en': 'English',
    'lang.ro': 'Română',

    // ─── Patient layout bottom nav ───────────────────────────────
    'nav.home': 'Home',
    'nav.appointments': 'Appointments',
    'nav.wellness': 'Wellness',
    'nav.askAi': 'Ask AI',
    'nav.alerts': 'Alerts',

    // ─── Patient home page ───────────────────────────────────────
    'home.greeting': 'Hello, {name}',
    'home.subtitle': 'Welcome back to your health dashboard',
    'home.bookAppointment': 'Book an Appointment',

    // ─── Floating chatbot ────────────────────────────────────────
    'chatbot.header.title': 'Health Assistant',
    'chatbot.header.online': 'Online',
    'chatbot.header.thinking': 'Thinking…',
    'chatbot.welcome': "Hello! I'm your health assistant. How can I help you today?",
    'chatbot.input.placeholder': 'Type your message...',
    'chatbot.error.unreachable': 'Sorry, I could not reach the assistant right now. Please try again later.',

    // ─── Medical files section ───────────────────────────────────
    'files.title': 'Medical Files',
    'files.shared.title': 'Shared with Doctor',
    'files.personal.title': 'Personal Uploads',
    'files.dropzone.title': 'Upload New File',
    'files.dropzone.subtitle': 'Drag and drop or click to browse (up to 1 GB)',
    'files.loading': 'Loading your files…',
    'files.empty': 'No files yet — upload your first one below.',
    'files.action.view': 'View',
    'files.action.download': 'Download',
    'files.action.delete': 'Delete',
    'files.confirm.delete': 'Delete this file? This action cannot be undone.',
    'files.cancel': 'Cancel',
    'files.upload': 'Upload',
    'files.cancelUpload': 'Cancel upload',
    'files.category.label': 'Category (optional)',
    'files.category.none': '— None —',
    'files.category.lab': 'Lab results',
    'files.category.imaging': 'Imaging / X-ray',
    'files.category.prescription': 'Prescription',
    'files.category.other': 'Other',
    'files.error.load': 'Failed to load uploads',
    'files.error.upload': 'Upload failed',
    'files.error.open': 'Could not open file',
    'files.error.download': 'Could not download file',
    'files.error.delete': 'Delete failed',

    // ─── Generic ─────────────────────────────────────────────────
    'common.close': 'Close',
  },

  ro: {
    'lang.toggle.tooltip': 'Schimbă limba',
    'lang.en': 'English',
    'lang.ro': 'Română',

    'nav.home': 'Acasă',
    'nav.appointments': 'Programări',
    'nav.wellness': 'Sănătate',
    'nav.askAi': 'Întreabă AI',
    'nav.alerts': 'Notificări',

    'home.greeting': 'Bună, {name}',
    'home.subtitle': 'Bine ai revenit pe panoul tău de sănătate',
    'home.bookAppointment': 'Programează o consultație',

    'chatbot.header.title': 'Asistent Medical',
    'chatbot.header.online': 'Online',
    'chatbot.header.thinking': 'Se gândește…',
    'chatbot.welcome': 'Salut! Sunt asistentul tău medical. Cu ce te pot ajuta astăzi?',
    'chatbot.input.placeholder': 'Scrie un mesaj...',
    'chatbot.error.unreachable':
      'Ne pare rău, asistentul nu este disponibil acum. Vă rugăm să încercați din nou mai târziu.',

    'files.title': 'Documente medicale',
    'files.shared.title': 'Partajate cu medicul',
    'files.personal.title': 'Documente personale',
    'files.dropzone.title': 'Încarcă un fișier nou',
    'files.dropzone.subtitle': 'Trage și plasează sau apasă pentru a alege (până la 1 GB)',
    'files.loading': 'Se încarcă fișierele tale…',
    'files.empty': 'Nu există fișiere încă — încarcă primul tău fișier mai jos.',
    'files.action.view': 'Vizualizează',
    'files.action.download': 'Descarcă',
    'files.action.delete': 'Șterge',
    'files.confirm.delete': 'Ștergi acest fișier? Această acțiune nu poate fi anulată.',
    'files.cancel': 'Anulează',
    'files.upload': 'Încarcă',
    'files.cancelUpload': 'Anulează încărcarea',
    'files.category.label': 'Categorie (opțional)',
    'files.category.none': '— Niciuna —',
    'files.category.lab': 'Rezultate analize',
    'files.category.imaging': 'Imagistică / Radiografie',
    'files.category.prescription': 'Rețetă',
    'files.category.other': 'Altele',
    'files.error.load': 'Încărcarea fișierelor a eșuat',
    'files.error.upload': 'Încărcarea a eșuat',
    'files.error.open': 'Fișierul nu a putut fi deschis',
    'files.error.download': 'Descărcarea a eșuat',
    'files.error.delete': 'Ștergerea a eșuat',

    'common.close': 'Închide',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
