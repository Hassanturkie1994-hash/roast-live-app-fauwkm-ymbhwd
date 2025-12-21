
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
    startingStream: 'Startar din stream...',
  },

  // Content Label Modal
  contentLabel: {
    title: 'Välj innehållsetikett',
    subtitle: 'Välj lämplig innehållsklassificering för din stream',
    familyFriendly: {
      title: 'Familjevänligt',
      description: 'Lämpligt för alla åldrar. Rent innehåll utan explicit språk eller teman.',
    },
    roastMode: {
      title: 'Roast & Komedi-läge',
      description: 'Komisk roasting och banter. Kan innehålla milt språk och skämt.',
    },
    adultOnly: {
      title: '18+ Begränsat',
      description: 'Explicit roast-innehåll. Starkt språk och vuxna teman. Åldersverifiering krävs.',
    },
    warning: 'Felaktig representation av ditt innehåll kan leda till varningar eller avstängning',
    confirm: 'Bekräfta',
    cancel: 'Avbryt',
  },

  // Safety
  safety: {
    acknowledgement: {
      title: 'Välkommen till Roast Live',
      subtitle: 'Håll Roast Live säkert',
      intro: 'Innan du använder Roast Live måste du acceptera våra säkerhets- och gemenskapsriktlinjer.',
      communityValues: '✅ Våra gemenskapsvärden',
      communityValuesText: '- Respekt och vänlighet mot alla medlemmar\n- Kreativt och underhållande innehåll\n- Lekfull roasting som förblir rolig\n- Stöd till skapare och andra tittare\n- Rapportera överträdelser när du ser dem',
      zeroTolerance: '🚫 Nolltolerans för',
      zeroToleranceText: '- Trakasserier, mobbning eller hatpropaganda\n- Hot om våld eller skada\n- Sexuellt innehåll som involverar minderåriga\n- Delning av privat information\n- Olagliga aktiviteter eller innehåll\n- Spam eller bot-beteende',
      importantNotes: '⚠️ Viktiga anteckningar',
      importantNotesText: '- Du måste acceptera dessa riktlinjer för att livestreama\n- Överträdelser kan leda till varningar, avstängningar eller bannlysningar\n- Varningar upphör efter 7-60 dagar beroende på allvarlighetsgrad\n- Flera rapporter kan utlösa säkerhetsgranskningar\n- Falska rapporter kan leda till åtgärder mot ditt konto',
      responsibilities: '💬 Dina ansvar',
      responsibilitiesText: '- Följ alla gemenskapsriktlinjer\n- Respektera innehållsklassificeringar (Familjevänligt, Roast-läge, 18+)\n- Moderera din egen chatt om du är en skapare\n- Rapportera överträdelser du stöter på\n- Håll ditt konto säkert',
      highlightText: 'Genom att acceptera godkänner du att följa dessa riktlinjer och förstår att överträdelser kan leda till kontobegränsningar.',
      scrollToContinue: 'Scrolla för att fortsätta',
      accept: 'Acceptera gemenskapsriktlinjer',
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
    // Localized sound descriptions for all gift sounds
    sounds: {
      crowd_boo: 'Publiken buade',
      tomato_splat: 'Tomat-plask ljudeffekt',
      sitcom_laugh: 'Sitcom-skrattspår',
      slap_sound: 'Örfil ljudeffekt',
      cricket_chirp: 'Syrsor som tjirpar',
      yawn_sound: 'Gäspande ljud',
      clown_horn: 'Clownhorn tuta',
      trash_dump: 'Sopor som dumpas',
      death_sound: 'Dödsljud effekt',
      fart_sound: 'Prutt ljud',
      mic_drop_thud: 'Mikrofon-släpp duns',
      airhorn_blast: 'Högt lufthorn',
      crowd_roar: 'Publiken vrålar',
      boxing_bell: 'Boxningsklocka ding',
      fire_whoosh: 'Eld vischande ljud',
      explosion_boom: 'Explosions-boom',
      gasp_sound: 'Chockad flämtning',
      savage_sound: 'Vild ljudeffekt',
      salt_pour: 'Salt som hälls',
      tea_spill: 'Te som spills',
      flamethrower: 'Eldkastare ljud',
      stamp_slam: 'Stämpel som slår',
      gavel_bang: 'Domarklubba smäll',
      crown_fanfare: 'Kronfanfar',
      punch_knockout: 'Knockout-slag',
      bomb_explosion: 'Bomb-explosion',
      thunder_crack: 'Åskknall',
      trophy_win: 'Trofé-vinstfanfar',
      earthquake_rumble: 'Jordbävnings-dån',
      slow_motion: 'Slow motion-effekt',
      spotlight_on: 'Strålkastare tänds',
      mute_sound: 'Tysta ljud',
      time_stop: 'Tidsfrysnings-effekt',
      nuke_explosion: 'Kärnvapenexplosion',
      shame_bell_ring: 'Skamklocka ringer',
      meteor_impact: 'Meteor-nedslag',
      funeral_march: 'Begravningsmarsch musik',
      riot_chaos: 'Upplopp kaos-ljud',
      execution_sound: 'Avrättnings-ljud',
      game_over: 'Game over-ljud',
      apocalypse_sound: 'Apokalyps-ljud',
      sigh_sound: 'Suck ljud',
      snore_sound: 'Snarkande ljud',
      cringe_sound: 'Cringe ljud',
      hammer_slam: 'Hammar-slag',
      sword_slash: 'Svärd-hugg',
      shield_block: 'Sköld-blockering',
      dragon_roar: 'Drak-vrål',
      siren: 'Siren ljud',
      crowd_chant: 'Publiken skanderar',
      church_bell: 'Kyrkklocka',
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

  // Settings
  settings: {
    title: 'Inställningar',
    dashboardTools: 'Instrumentpanel & Verktyg',
    general: 'Allmänt',
    accountSecurity: 'Konto & Säkerhet',
    streaming: 'Streaming',
    walletGifts: 'Plånbok & Gåvor',
    safetyRules: 'Säkerhet & Regler',
    profilePreferences: 'Profilinställningar',
    appearance: 'Utseende',
    profileSettings: 'Profilinställningar',
    notifications: 'Aviseringar',
    savedStreams: 'Sparade streams',
    achievements: 'Prestationer',
    accountSecurityItem: 'Kontosäkerhet',
    changePassword: 'Ändra lösenord',
    blockedUsers: 'Blockerade användare',
    streamDashboard: 'Stream-instrumentpanel',
    streamDashboardSubtext: 'Hantera VIP-klubb, moderatorer & mer',
    streamHistory: 'Streamhistorik',
    premiumMembership: 'PREMIUM-medlemskap',
    premiumSubtext: 'Lås upp exklusiva fördelar – 89 SEK/mån',
    wallet: 'Saldo',
    giftInformation: 'Gåvoinformation',
    manageSubscriptions: 'Hantera prenumerationer',
    withdrawEarnings: 'Ta ut intäkter',
    transactionHistory: 'Transaktionshistorik',
    safetyCommunityRules: 'Säkerhet & Gemenskapsregler',
    appealsViolations: 'Överklaganden & Överträdelser',
    termsOfService: 'Användarvillkor',
    privacyPolicy: 'Integritetspolicy',
    privateProfile: 'Privat profil',
    whoCanComment: 'Vem kan kommentera',
    commentPermissions: {
      everyone: 'Alla',
      followers: 'Följare',
      noOne: 'Ingen',
    },
    logout: 'Logga ut',
    logoutConfirm: 'Är du säker på att du vill logga ut?',
    cannotLogout: 'Kan inte logga ut',
    endLiveFirst: 'Du måste avsluta din live-session innan du loggar ut.',
    logoutEndLiveSubtext: 'Avsluta live-session först',
    roleNames: {
      headAdmin: 'Huvudadministratörs-instrumentpanel',
      admin: 'Administratörs-instrumentpanel',
      support: 'Support-instrumentpanel',
      moderator: 'Moderator-instrumentpanel',
    },
    roleDescriptions: {
      headAdmin: 'Full plattformskontroll',
      admin: 'Hantera rapporter & användare',
      support: 'Granska överklaganden & ärenden',
      moderator: 'Stream-modereringsverktyg',
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
