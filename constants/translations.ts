
/**
 * Swedish (sv-SE) Translations for Roast Live
 * Complete localization for the entire application
 */

export const sv = {
  // Common
  common: {
    loading: 'Laddar...',
    error: 'Fel',
    success: 'Lyckades',
    cancel: 'Avbryt',
    confirm: 'Bekräfta',
    save: 'Spara',
    delete: 'Radera',
    edit: 'Redigera',
    close: 'Stäng',
    back: 'Tillbaka',
    next: 'Nästa',
    done: 'Klar',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nej',
    retry: 'Försök igen',
    or: 'ELLER',
  },

  // Authentication
  auth: {
    login: {
      title: 'Välkommen tillbaka',
      subtitle: 'Välkommen tillbaka till livestream-upplevelsen',
      email: 'E-post',
      emailPlaceholder: 'Ange din e-post',
      password: 'Lösenord',
      passwordPlaceholder: 'Ange ditt lösenord',
      forgotPassword: 'Glömt lösenord?',
      signIn: 'LOGGA IN',
      signingIn: 'LOGGAR IN...',
      createAccount: 'Skapa nytt konto',
      error: 'Vänligen fyll i alla fält',
      loginFailed: 'Inloggning misslyckades',
    },
    register: {
      title: 'Gå med i livestream-revolutionen',
      displayName: 'Visningsnamn',
      displayNamePlaceholder: 'Välj ditt visningsnamn',
      email: 'E-post',
      emailPlaceholder: 'Ange din e-post',
      password: 'Lösenord',
      passwordPlaceholder: 'Skapa ett lösenord (minst 6 tecken)',
      confirmPassword: 'Bekräfta lösenord',
      confirmPasswordPlaceholder: 'Bekräfta ditt lösenord',
      createAccount: 'SKAPA KONTO',
      creatingAccount: 'SKAPAR KONTO...',
      alreadyHaveAccount: 'Har du redan ett konto? Logga in',
      error: 'Vänligen fyll i alla fält',
      passwordMismatch: 'Lösenorden matchar inte',
      passwordTooShort: 'Lösenordet måste vara minst 6 tecken',
      registrationFailed: 'Registrering misslyckades',
      successTitle: 'Lyckades!',
      successMessage: 'Ditt konto har skapats. Vänligen kontrollera din e-post för att verifiera ditt konto innan du loggar in.',
    },
  },

  // Broadcaster / Live Streaming
  broadcaster: {
    permissions: {
      title: 'Vi behöver din tillåtelse att använda kameran',
      grantPermission: 'Ge tillåtelse',
    },
    cameraOff: 'Kamera av — Stream fortfarande aktiv',
    readyToGoLive: 'Redo att gå live?',
    goLive: 'GÅ LIVE',
    endLive: 'AVSLUTA LIVE',
    setup: {
      title: 'Konfigurera din stream',
      streamTitle: 'Streamtitel',
      streamTitlePlaceholder: 'Vad streamar du?',
      info: 'Din stream kommer att sändas live till alla tittare. Se till att du har en stabil internetanslutning!',
      startLive: 'STARTA LIVE',
      starting: 'STARTAR...',
      cancel: 'Avbryt',
      missingTitle: 'Saknar titel',
      enterTitle: 'Vänligen ange en streamtitel',
    },
    live: {
      youAreLive: '🔴 Du är LIVE!',
      streamStarted: 'Din stream sänds nu!\n\nStream-ID: {streamId}\n\nTittare kan se dig live!',
      viewerCount: '{count} tittare',
      time: '{time}',
      viewerDiscretionAdvised: 'Tittarens diskretion rekommenderas',
    },
    endStream: {
      title: 'Avsluta livestream?',
      message: 'Är du säker på att du vill avsluta streamen?\n\nDina tittare kommer att kopplas bort.',
      endStream: 'Avsluta stream',
      streamEnded: 'Stream avslutad',
      stats: 'Din livestream har avslutats framgångsrikt.\n\n📊 Statistik:\n• Toppvisningar: {peak}\n• Totalt antal tittare: {total}\n• Totalt antal gåvor: {gifts}\n• Varaktighet: {duration}',
    },
    errors: {
      notLoggedIn: 'Du måste vara inloggad för att starta streaming',
      cannotStartStream: 'Kan inte starta stream',
      failedToStart: 'Misslyckades att starta stream. Vänligen försök igen.',
      noActiveStream: 'Ingen aktiv stream att avsluta',
      failedToEnd: 'Misslyckades att avsluta stream. Vänligen försök igen.',
    },
  },

  // Creator Rules Modal
  creatorRules: {
    title: 'Du är på väg att gå live',
    subtitle: 'Följ reglerna',
    rule1: 'Jag kommer inte att avslöja privat information',
    rule2: 'Jag kommer inte att trakassera minderåriga',
    rule3: 'Roast-interaktioner förblir underhållning',
    explanation1: '🔴 Om din stream får flera allvarliga överträdelser → stream kan pausas',
    explanation2: '⚠️ Upprepade överträdelser → förlust av värdprivilegier',
    explanation3: '💬 Dina moderatorer kan upprätthålla säkerhet',
    confirmAndGoLive: 'BEKRÄFTA & GÅ LIVE',
    starting: 'STARTAR...',
    cancel: 'Avbryt',
  },

  // Content Label Modal
  contentLabel: {
    title: 'Välj innehållsetikett',
    subtitle: 'Hjälp tittare att förstå vad de kan förvänta sig',
    general: {
      title: 'Allmänt',
      description: 'Lämpligt för alla åldrar',
    },
    roastMode: {
      title: 'Roast-läge',
      description: 'Komedi, sarkasm, vänlig banter',
    },
    adultOnly: {
      title: 'Endast vuxna',
      description: 'Mogna teman, starkt språk',
    },
    select: 'Välj',
    cancel: 'Avbryt',
  },

  // Safety
  safety: {
    acknowledgement: {
      title: 'Välkommen till Roast Live',
      subtitle: 'Säkerhets- och gemenskapsriktlinjer',
      intro: 'Innan du använder Roast Live måste du acceptera våra säkerhets- och gemenskapsriktlinjer.',
      rules: [
        'Respektera alla användare och följ gemenskapsriktlinjerna',
        'Inget trakasseri, hatpropaganda eller farligt beteende',
        'Inget vuxeninnehåll eller olämpligt material',
        'Respektera upphovsrätt och immateriella rättigheter',
        'Rapportera överträdelser till vårt modereringsteam',
      ],
      accept: 'JAG ACCEPTERAR',
      accepting: 'ACCEPTERAR...',
      decline: 'Avböj',
      successTitle: 'Välkommen!',
      successMessage: 'Du kan nu använda alla funktioner i Roast Live. Kom ihåg att följa våra gemenskapsriktlinjer!',
    },
    forcedReviewLock: {
      title: 'Konto under granskning',
      message: 'Ditt konto har tillfälligt låsts för granskning på grund av {count} rapporter.\n\nVårt modereringsteam granskar dessa rapporter. Du kommer att meddelas när granskningen är klar.\n\nOm du tror att detta är ett misstag, vänligen kontakta support.',
      close: 'Stäng',
    },
  },

  // Chat
  chat: {
    sendMessage: 'Skicka ett meddelande...',
    showChat: 'Visa chatt',
    hideChat: 'Dölj chatt',
    connected: '✅',
    connecting: '⏳',
  },

  // Gifts
  gifts: {
    sendGift: 'Skicka gåva',
    to: 'till {name}',
    balance: 'Saldo: {amount} kr',
    addBalance: 'Lägg till +',
    insufficientBalance: 'Otillräckligt saldo',
    insufficientBalanceMessage: 'Du behöver lägga till pengar för att skicka gåvor.',
    addBalanceButton: 'Lägg till saldo',
    giftSent: 'Gåva skickad! 🎁',
    giftSentMessage: 'Du skickade {emoji} {name} till {receiver}!',
    sendGiftButton: 'SKICKA GÅVA',
    sending: 'SKICKAR...',
    tiers: {
      all: 'ALLA',
      premium: 'PREMIUM',
      medium: 'MEDIUM',
      cheap: 'BILLIG',
    },
  },

  // Viewer List
  viewerList: {
    title: 'Aktiva tittare ({count})',
    guestSeats: 'Gästplatser: {active}/9',
    locked: 'Låst',
    maxSeatsWarning: 'Maximalt antal gästplatser är fullt',
    autoUpdating: 'Uppdateras automatiskt live',
    noViewers: 'Inga tittare än',
    noViewersSubtext: 'Dela din stream för att få tittare!',
    loading: 'Laddar tittare...',
    badges: {
      guest: 'GÄST',
      mod: 'MOD',
    },
    status: {
      live: 'Live',
      watching: 'Tittar',
    },
    invite: 'Bjud in',
    permissionDenied: 'Tillstånd nekat',
    onlyHostCanInvite: 'Endast värden kan bjuda in gäster.',
    seatsLocked: 'Platser låsta',
    seatsLockedMessage: 'Gästplatser är för närvarande låsta. Lås upp dem för att bjuda in tittare.',
    seatsFull: 'Platser fulla',
    seatsFullMessage: 'Maximalt antal gästplatser är fullt (9/9). Ta bort en gäst för att bjuda in någon ny.',
    alreadyGuest: 'Redan en gäst',
    alreadyGuestMessage: 'Denna tittare är redan en gäst på din stream.',
  },

  // Report Modal
  report: {
    title: 'Rapportera innehåll',
    info: 'Rapporterar @{username}. Din identitet kommer att förbli anonym. Streamen kommer inte att avbrytas.',
    selectCategory: 'Välj en kategori:',
    categories: {
      harassment: 'Trakasseri',
      hateSpeech: 'Hatpropaganda',
      adultContent: 'Vuxeninnehåll',
      dangerousBehavior: 'Farligt beteende',
      spamScam: 'Spam/Bedrägeri',
      copyrightViolation: 'Upphovsrättsbrott',
    },
    additionalDetails: 'Ytterligare detaljer (valfritt):',
    placeholder: 'Ge mer sammanhang om denna rapport...',
    charCount: '{count}/500',
    submitReport: 'Skicka rapport',
    submitting: 'Skickar...',
    cancel: 'Avbryt',
    selectCategoryError: 'Vänligen välj en rapportkategori',
    successTitle: 'Rapport skickad',
    successMessage: 'Tack för din rapport. Vårt team kommer att granska den inom kort. Streamen kommer att fortsätta utan avbrott.',
  },

  // Profile
  profile: {
    loading: 'Laddar profil...',
    followers: 'Följare',
    following: 'Följer',
    posts: 'Inlägg',
    balance: 'Saldo',
    savedStreams: 'Sparade streams',
    streamHistory: 'Streamhistorik',
    editProfile: 'Redigera profil',
    share: 'Dela',
    shareProfile: 'Dela profil',
    post: 'Inlägg',
    story: 'Story',
    tabs: {
      liveReplays: 'LIVE-REPRISER',
      posts: 'INLÄGG',
      stories: 'STORIES',
    },
    empty: {
      noReplays: 'Inga live-repriser än',
      noReplaysSubtext: 'Dina tidigare livestreams kommer att visas här',
      viewStreamHistory: 'Visa streamhistorik',
      noPosts: 'Inga inlägg än',
      createFirstPost: 'Skapa ditt första inlägg',
      noStories: 'Inga story-höjdpunkter',
      createStory: 'Skapa en story',
    },
  },

  // Edit Profile
  editProfile: {
    title: 'Redigera profil',
    addBanner: 'Lägg till banner',
    displayName: 'Visningsnamn',
    displayNamePlaceholder: 'Ditt visningsnamn',
    username: 'Användarnamn',
    usernamePlaceholder: 'användarnamn',
    bio: 'Bio',
    bioPlaceholder: 'Berätta om dig själv...',
    saveChanges: 'SPARA ÄNDRINGAR',
    saving: 'SPARAR...',
    uploadingWithCDN: 'Laddar upp med CDN-optimering...',
    errors: {
      displayNameTooShort: 'Visningsnamnet måste vara minst 3 tecken',
      usernameTooShort: 'Användarnamnet måste vara minst 3 tecken',
      usernameTaken: 'Användarnamnet är redan taget',
      failedToUpdate: 'Misslyckades att uppdatera profil',
    },
    success: 'Profil uppdaterad framgångsrikt med CDN-optimering',
  },

  // Wallet
  wallet: {
    title: 'Saldo',
    currentBalance: 'Aktuellt saldo',
    addBalance: 'Lägg till saldo',
    recentTransactions: 'Senaste transaktioner',
    viewAll: 'Visa alla',
    noTransactions: 'Inga transaktioner än',
    noTransactionsSubtext: 'Lägg till saldo för att börja använda gåvor och funktioner',
    info: 'Ditt saldo kan användas för att köpa gåvor under livestreams och stödja dina favoritkreatörer.',
    transactionTypes: {
      addBalance: 'Lägg till saldo',
      walletTopup: 'Påfyllning av plånbok',
      withdraw: 'Uttag',
      withdrawal: 'Uttag',
      giftPurchase: 'Gåvoköp',
      creatorTip: 'Kreativt tips',
    },
    status: {
      completed: 'slutförd',
      paid: 'betald',
      pending: 'väntande',
      failed: 'misslyckad',
      cancelled: 'avbruten',
    },
  },

  // Tab Bar
  tabs: {
    home: 'Hem',
    explore: 'Utforska',
    goLive: 'Gå live',
    inbox: 'Inkorg',
    profile: 'Profil',
  },

  // Connection Status
  connection: {
    connected: 'Ansluten',
    connecting: 'Ansluter...',
    reconnecting: 'Återansluter... ({attempt}/{max})',
    disconnected: 'Frånkopplad',
    poor: 'Dålig anslutning',
  },

  // Stream Health
  streamHealth: {
    viewers: 'Tittare',
    gifts: 'Gåvor',
  },

  // Buttons
  buttons: {
    addBalance: 'Lägg till saldo',
    withdraw: 'Ta ut',
    send: 'Skicka',
    invite: 'Bjud in',
    remove: 'Ta bort',
    block: 'Blockera',
    unblock: 'Avblockera',
    report: 'Rapportera',
    follow: 'Följ',
    unfollow: 'Sluta följa',
    subscribe: 'Prenumerera',
    unsubscribe: 'Avsluta prenumeration',
  },

  // Errors
  errors: {
    generic: 'Ett oväntat fel uppstod',
    networkError: 'Nätverksfel. Vänligen kontrollera din anslutning.',
    tryAgain: 'Vänligen försök igen',
  },

  // Success Messages
  success: {
    saved: 'Sparat framgångsrikt',
    updated: 'Uppdaterat framgångsrikt',
    deleted: 'Raderat framgångsrikt',
    sent: 'Skickat framgångsrikt',
  },

  // Time Formatting
  time: {
    justNow: 'Just nu',
    minutesAgo: '{count}m sedan',
    hoursAgo: '{count}t sedan',
    daysAgo: '{count}d sedan',
    weeksAgo: '{count}v sedan',
  },

  // Notifications
  notifications: {
    title: 'Aviseringar',
    noNotifications: 'Inga aviseringar',
    markAllRead: 'Markera alla som lästa',
  },

  // Settings
  settings: {
    title: 'Inställningar',
    account: 'Konto',
    security: 'Säkerhet',
    privacy: 'Integritet',
    notifications: 'Aviseringar',
    appearance: 'Utseende',
    language: 'Språk',
    about: 'Om',
    logout: 'Logga ut',
    logoutConfirm: 'Är du säker på att du vill logga ut?',
  },

  // Permissions
  permissions: {
    camera: 'Kamera',
    microphone: 'Mikrofon',
    notifications: 'Aviseringar',
    cameraRequired: 'Kameratillstånd krävs',
    microphoneRequired: 'Mikrofontillstånd krävs',
    grantPermission: 'Ge tillstånd',
  },

  // Live Badge
  live: {
    badge: 'LIVE',
  },

  // Moderation
  moderation: {
    timeout: 'Timeout',
    ban: 'Bannlys',
    unban: 'Avbannlys',
    mute: 'Tysta',
    unmute: 'Avtysta',
    kick: 'Sparka ut',
    warn: 'Varna',
  },
};

export type TranslationKey = typeof sv;

export default sv;
