export type SupportedLocale =
  | 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar';

export const supportedLocales: SupportedLocale[] = [
  'en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'ja', 'ko', 'zh', 'ar',
];

export interface Translations {
  [key: string]: string;

  welcomeEyebrow: string;
  welcomeTitle: string;
  welcomeDescription: string;
  welcomeCta: string;

  goalHeadline: string;
  goalSubheadline: string;
  goalViral: string;
  goalAccessible: string;
  goalBrand: string;
  goalFast: string;
  goalMultilingual: string;
  goalProfessional: string;
  goalCta: string;

  painHeadline: string;
  painSubheadline: string;
  painTyping: string;
  painTools: string;
  painCost: string;
  painTiming: string;
  painStyle: string;
  painOffline: string;
  painPrivacy: string;
  painCtaNone: string;
  painCtaSome: string;

  socialHeadline: string;
  socialSubheadline: string;
  socialCta: string;
  socialTestimonial1Name: string;
  socialTestimonial1Tag: string;
  socialTestimonial1Text: string;
  socialTestimonial2Name: string;
  socialTestimonial2Tag: string;
  socialTestimonial2Text: string;
  socialTestimonial3Name: string;
  socialTestimonial3Tag: string;
  socialTestimonial3Text: string;

  tinderHeadline: string;
  tinderSubheadline: string;
  tinderSkip: string;
  tinderRelate: string;
  tinderRemaining: string;
  tinderRemainingOne: string;
  tinderSkipRemaining: string;

  solutionHeadline: string;
  solutionSubheadline: string;
  solutionSpeedPain: string;
  solutionSpeedSolution: string;
  solutionSpeedStat: string;
  solutionPrivacyPain: string;
  solutionPrivacySolution: string;
  solutionPrivacyStat: string;
  solutionStylePain: string;
  solutionStyleSolution: string;
  solutionStyleStat: string;
  solutionCostPain: string;
  solutionCostSolution: string;
  solutionCostStat: string;
  solutionCta: string;

  prefHeadline: string;
  prefSubheadline: string;
  prefSectionFont: string;
  prefSectionColor: string;
  prefSectionEffect: string;
  prefCta: string;

  permHeadline: string;
  permSubheadline: string;
  permPhotoTitle: string;
  permPhotoBody: string;
  permSpeechTitle: string;
  permSpeechBody: string;
  permGranted: string;
  permLimited: string;
  permDenied: string;
  permRestricted: string;
  permNotDetermined: string;
  permUnavailable: string;
  permEnable: string;
  permRequesting: string;
  permNotNow: string;
  permAllSet: string;

  procTitle: string;
  procSubtitle: string;
  procPhase1: string;
  procPhase2: string;
  procPhase3: string;

  demoHeadline: string;
  demoSubheadline: string;
  demoSectionFont: string;
  demoSectionAccent: string;
  demoSectionEffect: string;
  demoCta: string;
  demoPreviewText: string;

  effectClean: string;
  effectNeon: string;
  effectGlow: string;
  effectCinema: string;

  valueTitle: string;
  valueBody: string;
  valueItemsTitle: string;
  valueGoalFallback: string;
  valueItem1Label: string;
  valueItem1Desc: string;
  valueItem2Label: string;
  valueItem2Desc: string;
  valueItem3Label: string;
  valueItem3Desc: string;
  valueCta: string;

  continue: string;
  skip: string;
  back: string;
}

const en: Translations = {
  welcomeEyebrow: 'Offline. Private. Instant.',
  welcomeTitle: 'Subtitles that make your clips impossible to scroll past',
  welcomeDescription:
    'Import any video. Get clean, perfectly timed captions in under a minute. No uploads. No subscriptions. Just your phone.',
  welcomeCta: 'Get Started',

  goalHeadline: 'What are you trying to achieve?',
  goalSubheadline:
    'Pick the one thing that matters most right now. Voxa will shape your defaults around it.',
  goalViral: 'Keep viewers watching longer',
  goalAccessible: 'Make content easier to follow',
  goalBrand: 'Build a consistent visual style',
  goalFast: 'Post faster without outsourcing',
  goalMultilingual: 'Reach viewers in other languages',
  goalProfessional: 'Make clips feel more polished',
  goalCta: 'Continue',

  painHeadline: 'What slows you down most?',
  painSubheadline:
    'Select everything that gets in your way. Voxa will tune the first setup around it.',
  painTyping: 'Typing captions takes forever',
  painTools: 'Online tools feel slow or risky',
  painCost: 'Subscription fees add up',
  painTiming: 'Timing is hard to get right',
  painStyle: 'Captions look generic',
  painOffline: 'I need to work without internet',
  painPrivacy: 'I do not want footage in the cloud',
  painCtaNone: 'Select at least one',
  painCtaSome: 'Continue',

  socialHeadline: 'Creators are saving hours on subtitles',
  socialSubheadline:
    'Use on-device captioning instead of retyping every line by hand.',
  socialCta: 'Continue',
  socialTestimonial1Name: 'Maya K.',
  socialTestimonial1Tag: 'TikTok creator',
  socialTestimonial1Text:
    'Captions used to take me 45 minutes per video. Now I am done in under a minute, and the neon style actually fits my page.',
  socialTestimonial2Name: 'Jordan T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    'I wanted captions without sending raw footage to another service. Voxa keeps everything on my phone and the results look clean.',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: 'Brand manager',
  socialTestimonial3Text:
    'We batch Reels for three brands. Voxa makes the subtitle pass much faster, and the editing gestures feel natural.',

  tinderHeadline: 'Which ones sound familiar?',
  tinderSubheadline: 'Swipe right if it fits. Swipe left to skip.',
  tinderSkip: 'Skip',
  tinderRelate: 'Relate',
  tinderRemaining: 'cards left',
  tinderRemainingOne: 'card left',
  tinderSkipRemaining: 'Skip remaining',

  solutionHeadline: 'Here is how Voxa helps',
  solutionSubheadline:
    'Based on what you picked, these are the parts Voxa will handle for you.',
  solutionSpeedPain: 'Captioning takes too long',
  solutionSpeedSolution: 'Generate subtitles in under 60 seconds',
  solutionSpeedStat:
    'On-device speech recognition, with no uploads',
  solutionPrivacyPain: 'Online tools feel risky',
  solutionPrivacySolution: 'Your footage stays on your phone',
  solutionPrivacyStat: 'No cloud processing. No video collection.',
  solutionStylePain: 'Captions look generic',
  solutionStyleSolution: 'Choose clean, bold, neon, glow, or cinematic styles',
  solutionStyleStat: 'Fonts, colors, effects, and positions built in',
  solutionCostPain: 'Subscriptions add up',
  solutionCostSolution: 'One app. No recurring fees. No watermarks.',
  solutionCostStat: 'Core tools included from the start',
  solutionCta: 'Show me the styles',

  prefHeadline: 'Pick your caption style',
  prefSubheadline:
    'These will be the defaults for your first project. You can adjust everything later.',
  prefSectionFont: 'Font',
  prefSectionColor: 'Accent Color',
  prefSectionEffect: 'Effect',
  prefCta: 'Continue',

  permHeadline: 'One last setup step',
  permSubheadline:
    'Voxa needs access to your videos and on-device speech recognition. Your clips stay offline.',
  permPhotoTitle: 'Photo Library',
  permPhotoBody:
    'Import videos and save finished clips back to your camera roll.',
  permSpeechTitle: 'Speech Recognition',
  permSpeechBody:
    'Turn audio into subtitles directly on your device.',
  permGranted: 'Granted',
  permLimited: 'Limited access',
  permDenied: 'Access denied',
  permRestricted: 'Restricted',
  permNotDetermined: 'Not decided yet',
  permUnavailable: 'Unavailable',
  permEnable: 'Enable Access',
  permRequesting: 'Requesting...',
  permNotNow: 'Not now',
  permAllSet: 'All set',

  procTitle: 'Setting things up',
  procSubtitle: 'Applying your preferences...',
  procPhase1: 'Applying your preferences...',
  procPhase2: 'Preparing your workspace...',
  procPhase3: 'Almost there...',

  demoHeadline: 'Try the look',
  demoSubheadline:
    'Pick a font, color, and effect. Preview your caption style in real time.',
  demoSectionFont: 'Font',
  demoSectionAccent: 'Accent',
  demoSectionEffect: 'Effect',
  demoCta: 'Use this look',
  demoPreviewText: 'This is how your captions will look',

  effectClean: 'Clean',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Cinema',

  valueTitle: 'You are all set',
  valueBody: 'Voxa is ready to help you',
  valueItemsTitle: "What's ready:",
  valueGoalFallback: 'Create better subtitles',
  valueItem1Label: 'Fast subtitle generation',
  valueItem1Desc: 'Import a video and get captions in seconds',
  valueItem2Label: 'Your style is saved',
  valueItem2Desc: 'Font, color, and effect are ready',
  valueItem3Label: 'Private by default',
  valueItem3Desc: 'Processing happens on your device',
  valueCta: 'Start Creating',

  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',

  homeProjects: 'Projects',
  homeCreateProjectLabel: 'Create project',
  homeCreateProjectHint: 'Create a new project',
  homeOpenSettingsLabel: 'Open settings',
  homeOpenSettingsHint: 'Open app settings',
  homeEmptyProjectTitle: 'Pull down to create',
  homeEmptyProjectFileName: 'Empty',
  homeEmptyTitle: 'Tap + to create.',
  homeEmptyText:
    'Import a local video and Voxa will build the subtitle timeline offline. You can still pull down for a quick create gesture.',
  greetingMorning: 'Good Morning',
  greetingAfternoon: 'Good Afternoon',
  greetingEvening: 'Good Evening',
  projectDelete: 'Delete',
  projectSubtitleBlocks: 'subtitle blocks',
  projectSubtitleBlock: 'subtitle block',

  transcribingLanguageTitle: 'Transcribing Language',
  transcribingLanguageBody:
    'Choose the spoken language for this video before Voxa creates subtitles.',
  appLanguageLabel: 'App language',
  appLanguageFallback: 'app',
  loadingOnDeviceLanguages: 'Loading on-device languages...',
  onDeviceLanguagesAvailable: 'on-device languages available on this device.',
  noOnDeviceLanguages: 'No on-device languages are currently available.',
  loading: 'Loading...',
  transcribeVideo: 'Transcribe Video',

  settingsTitle: 'Settings',
  settingsDefaultExport: 'Default Export',
  settingsUseAppLanguage: 'Use app language',
  settingsUseAppLanguageDescription:
    'New videos use the same language as the app when that speech locale is available.',
  settingsAskBeforeTranscription: 'Ask before each transcription',
  settingsAskBeforeTranscriptionDescription:
    'Show a language picker before each new transcription.',
  settingsRememberLastLanguage: 'Remember last used language',
  settingsLastUsed: 'Last used',
  settingsRememberLastLanguageDescription:
    'Preselect and reuse the last language you transcribed with.',
  settingsSubtitleHighlighting: 'Subtitle Highlighting',
  settingsHighlightEditedWords: 'Highlight edited words',
  settingsHighlightEditedWordsDescription:
    'Approximate word timing after manual subtitle edits.',
  settingsPrivacy: 'Privacy',
  settingsPrivacyBody:
    'Voxa keeps extraction, speech recognition, subtitle editing, and export entirely on-device. Remote media is only used for visual placeholders.',
  settingsReplayOnboarding: 'Replay onboarding',

  speechAccessFailedTitle: 'Speech Access Failed',
  speechAccessFailedBody: 'Unable to request Speech Recognition access right now.',
  languageListFailedTitle: 'Language List Failed',
  languageListFailedBody: 'Unable to load on-device transcription languages right now.',
  selectedVideo: 'Selected video',
  enableSpeechAccess: 'Enable Speech Access',
  grantSpeechAccess: 'Grant Speech Access',
  speechAccessSettingsBody:
    'Speech Recognition is turned off for Voxa. Open Settings to enable it, then return to continue generating subtitles for this video.',
  speechAccessGrantBody:
    'Voxa needs Speech Recognition permission to generate subtitles directly on your device after you import a video.',
  openSettings: 'Open Settings',
  checkingAccess: 'Checking Access...',
  continueManually: 'Continue Manually',

  processingOfflineAi: 'Offline AI',
  processingBody: 'Voxa is processing your video locally on-device.',
  processingExtractingAudio: 'Extracting audio...',
  processingDetectingLanguage: 'Detecting spoken language...',
  processingSelectedLanguage: 'Transcribing with the selected language...',
  processingBestLanguage: 'Transcribing with the best on-device language...',
  processingGeneratingTimeline: 'Generating timeline...',

  exportTitle: 'Export',
  exportResolution: 'Resolution',
  exportToPhotos: 'Export to Photos',
  exportHold: 'Press and hold to export',
  exportingToPhotos: 'Exporting to Photos...',
  exportSaved: 'Saved to Photos',
  exportFailed: 'Export failed. Please try again.',

  retry: 'Retry',
  retrySubtitles: 'Retry Subtitles',
  retrying: 'Retrying...',
  retrySubtitlesBody:
    'Auto Detect picks the best on-device language. Choose a locale manually if detection missed the clip.',
  autoDetect: 'Auto Detect',
  subtitlesCreatedNeedsReview:
    'Subtitles were created, but this project is still marked as requiring review.',
  noSubtitlesGenerated:
    'No subtitles were generated for this clip. Try Auto Detect or pick a language manually.',
  manualEditingAvailable: 'Manual subtitle editing remains available.',
  lastAttempt: 'Last attempt',
  manual: 'manual',
  auto: 'auto',
  chooseLanguageToRetry: 'Choose Auto Detect or a specific on-device language to retry.',
  subtitleRetryFailedTitle: 'Subtitle Retry Failed',
  subtitleRetryFailedBody: 'Unable to regenerate subtitles right now.',
  noSubtitlesCreatedTitle: 'No Subtitles Created',
  noSubtitlesSelectedLanguage: 'No subtitles were generated with the selected language.',
  regenerateSubtitles: 'Regenerate Subtitles',
  regenerating: 'Regenerating...',

  wordHighlight: 'Word Highlight',
  wordHighlightAvailable: 'Accent the currently spoken word.',
  wordTimingUnavailable: 'Word timing unavailable',
  textEffects: 'Text Effects',
  effectNone: 'None',
  effectChrome: 'Chrome',
  effectShadow: 'Shadow',
  recognitionLanguage: 'Recognition Language',
  current: 'Current',
  onDeviceLanguagesAvailableShort: 'on-device languages available',
  subtitleTab: 'Subtitle',
  styleTab: 'Style',
  languageTab: 'Language',
  fxTab: 'FX',
  done: 'Done',
  activeSubtitle: 'Active Subtitle',
  noSubtitleSelected: 'No subtitle selected',
  rewriteSubtitleText: 'Rewrite subtitle text',
  selectSubtitleToEdit: 'Select a subtitle block to edit.',
  styleControls: 'Style Controls',
  fonts: 'Fonts',
  size: 'Size',
  textColor: 'Text Color',
  highlight: 'Highlight',
  background: 'Background',
  positions: 'Positions',
  casing: 'Casing',
  sentence: 'Sentence',
  uppercase: 'Uppercase',
};

const es: Translations = {
  welcomeEyebrow: 'Sin conexión. Privado. Al instante.',
  welcomeTitle: 'Subtítulos que hacen que tus clips se queden en pantalla',
  welcomeDescription:
    'Importa cualquier video y obtén subtítulos limpios, bien sincronizados, en menos de un minuto. Sin subir nada. Sin suscripciones. Solo tu teléfono.',
  welcomeCta: 'Empezar',

  goalHeadline: '¿Qué quieres conseguir?',
  goalSubheadline:
    'Elige lo que más te importa ahora. Voxa ajustará tus valores iniciales a eso.',
  goalViral: 'Mantener a la gente viendo más tiempo',
  goalAccessible: 'Hacer el contenido más fácil de seguir',
  goalBrand: 'Crear un estilo visual consistente',
  goalFast: 'Publicar más rápido sin delegar',
  goalMultilingual: 'Llegar a públicos de otros idiomas',
  goalProfessional: 'Dar a tus clips un acabado más cuidado',
  goalCta: 'Continuar',

  painHeadline: '¿Qué te frena más?',
  painSubheadline:
    'Marca todo lo que te complica el proceso. Voxa lo tendrá en cuenta para el primer ajuste.',
  painTyping: 'Escribir subtítulos toma demasiado tiempo',
  painTools: 'Las herramientas online son lentas o dan poca confianza',
  painCost: 'Las suscripciones se acumulan',
  painTiming: 'Cuesta dejar el timing bien',
  painStyle: 'Los subtítulos se ven genéricos',
  painOffline: 'Necesito trabajar sin internet',
  painPrivacy: 'No quiero mis videos en la nube',
  painCtaNone: 'Elige al menos una opción',
  painCtaSome: 'Continuar',

  socialHeadline: 'Creadores ya están ahorrando horas con sus subtítulos',
  socialSubheadline:
    'Usa subtítulos en el dispositivo en vez de escribir cada línea a mano.',
  socialCta: 'Continuar',
  socialTestimonial1Name: 'Maya G.',
  socialTestimonial1Tag: 'Creadora en TikTok',
  socialTestimonial1Text:
    'Antes me pasaba casi una hora subtitulando cada video. Ahora lo tengo en menos de un minuto y el estilo neón sí encaja con mi cuenta.',
  socialTestimonial2Name: 'Jordi M.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    'Quería subtítulos sin mandar el video original a otra web. Con Voxa todo se queda en el teléfono y el resultado se ve limpio.',
  socialTestimonial3Name: 'Sofía R.',
  socialTestimonial3Tag: 'Responsable de marca',
  socialTestimonial3Text:
    'Preparamos Reels para tres marcas. Voxa nos acelera mucho la parte de subtítulos y editar con gestos se siente muy natural.',

  tinderHeadline: '¿Cuáles te suenan familiares?',
  tinderSubheadline: 'Desliza a la derecha si encaja. A la izquierda para pasar.',
  tinderSkip: 'Pasar',
  tinderRelate: 'Me pasa',
  tinderRemaining: 'tarjetas restantes',
  tinderRemainingOne: 'tarjeta restante',
  tinderSkipRemaining: 'Pasar las restantes',

  solutionHeadline: 'Así te ayuda Voxa',
  solutionSubheadline:
    'Según lo que elegiste, estas son las partes que Voxa puede resolver por ti.',
  solutionSpeedPain: 'Subtitular toma demasiado tiempo',
  solutionSpeedSolution: 'Genera subtítulos en menos de 60 segundos',
  solutionSpeedStat:
    'Reconocimiento de voz en el dispositivo, sin subir archivos',
  solutionPrivacyPain: 'Las herramientas online dan poca confianza',
  solutionPrivacySolution: 'Tus videos se quedan en tu teléfono',
  solutionPrivacyStat: 'Sin procesamiento en la nube. Sin recopilar videos.',
  solutionStylePain: 'Los subtítulos se ven genéricos',
  solutionStyleSolution: 'Elige estilos limpios, llamativos, neón, glow o cine',
  solutionStyleStat: 'Fuentes, colores, efectos y posiciones incluidos',
  solutionCostPain: 'Las suscripciones se acumulan',
  solutionCostSolution: 'Una app. Sin pagos recurrentes. Sin marcas de agua.',
  solutionCostStat: 'Las herramientas principales están incluidas desde el inicio',
  solutionCta: 'Ver los estilos',

  prefHeadline: 'Elige tu estilo de subtítulos',
  prefSubheadline:
    'Estos serán los valores iniciales de tu primer proyecto. Luego puedes ajustar todo.',
  prefSectionFont: 'Fuente',
  prefSectionColor: 'Color de acento',
  prefSectionEffect: 'Efecto',
  prefCta: 'Continuar',

  permHeadline: 'Un último paso de configuración',
  permSubheadline:
    'Voxa necesita acceso a tus videos y al reconocimiento de voz del dispositivo. Tus clips se quedan offline.',
  permPhotoTitle: 'Fotos',
  permPhotoBody:
    'Importa videos y guarda los clips terminados en tu carrete.',
  permSpeechTitle: 'Reconocimiento de voz',
  permSpeechBody:
    'Convierte audio en subtítulos directamente en tu dispositivo.',
  permGranted: 'Concedido',
  permLimited: 'Acceso limitado',
  permDenied: 'Acceso denegado',
  permRestricted: 'Restringido',
  permNotDetermined: 'Aún sin decidir',
  permUnavailable: 'No disponible',
  permEnable: 'Permitir acceso',
  permRequesting: 'Solicitando...',
  permNotNow: 'Ahora no',
  permAllSet: 'Todo listo',

  procTitle: 'Preparando todo',
  procSubtitle: 'Aplicando tus preferencias...',
  procPhase1: 'Aplicando tus preferencias...',
  procPhase2: 'Preparando tu espacio de trabajo...',
  procPhase3: 'Ya casi...',

  demoHeadline: 'Prueba el estilo',
  demoSubheadline:
    'Elige una fuente, un color y un efecto. Mira tu estilo de subtítulos en tiempo real.',
  demoSectionFont: 'Fuente',
  demoSectionAccent: 'Acento',
  demoSectionEffect: 'Efecto',
  demoCta: 'Usar este estilo',
  demoPreviewText: 'Así se verán tus subtítulos',

  effectClean: 'Limpio',
  effectNeon: 'Neón',
  effectGlow: 'Brillo',
  effectCinema: 'Cine',

  valueTitle: 'Todo listo',
  valueBody: 'Voxa está listo para ayudarte a',
  valueItemsTitle: 'Ya tienes preparado:',
  valueGoalFallback: 'Crear mejores subtítulos',
  valueItem1Label: 'Subtítulos rápidos',
  valueItem1Desc: 'Importa un video y obtén subtítulos en segundos',
  valueItem2Label: 'Tu estilo quedó guardado',
  valueItem2Desc: 'Fuente, color y efecto listos para usar',
  valueItem3Label: 'Privado por defecto',
  valueItem3Desc: 'El procesamiento ocurre en tu dispositivo',
  valueCta: 'Empezar a crear',

  continue: 'Continuar',
  skip: 'Pasar',
  back: 'Atrás',
};

const pt: Translations = {
  welcomeEyebrow: 'Offline. Privado. Na hora.',
  welcomeTitle: 'Legendas que fazem seus vídeos segurarem a atenção',
  welcomeDescription:
    'Importe qualquer vídeo e gere legendas limpas, bem sincronizadas, em menos de um minuto. Sem upload. Sem assinatura. Só o seu celular.',
  welcomeCta: 'Começar',

  goalHeadline: 'O que você quer alcançar?',
  goalSubheadline:
    'Escolha o que mais importa agora. O Voxa vai ajustar os padrões iniciais com base nisso.',
  goalViral: 'Manter as pessoas assistindo por mais tempo',
  goalAccessible: 'Deixar o conteúdo mais fácil de acompanhar',
  goalBrand: 'Criar um visual consistente',
  goalFast: 'Postar mais rápido sem terceirizar',
  goalMultilingual: 'Chegar a públicos de outros idiomas',
  goalProfessional: 'Dar um acabamento mais profissional',
  goalCta: 'Continuar',

  painHeadline: 'O que mais te atrasa?',
  painSubheadline:
    'Marque tudo que atrapalha seu fluxo. O Voxa vai levar isso em conta na primeira configuração.',
  painTyping: 'Digitar legendas demora demais',
  painTools: 'Ferramentas online são lentas ou pouco confiáveis',
  painCost: 'Assinaturas acabam pesando',
  painTiming: 'É difícil acertar o timing',
  painStyle: 'As legendas ficam genéricas',
  painOffline: 'Preciso trabalhar sem internet',
  painPrivacy: 'Não quero meus vídeos na nuvem',
  painCtaNone: 'Escolha pelo menos uma opção',
  painCtaSome: 'Continuar',

  socialHeadline: 'Criadores já economizam horas com legendas',
  socialSubheadline:
    'Use legendas no próprio aparelho em vez de digitar cada linha manualmente.',
  socialCta: 'Continuar',
  socialTestimonial1Name: 'Maya C.',
  socialTestimonial1Tag: 'Criadora no TikTok',
  socialTestimonial1Text:
    'Eu gastava quase uma hora legendando cada vídeo. Agora resolvo em menos de um minuto, e o visual neon combina com meu perfil.',
  socialTestimonial2Name: 'João T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    'Eu queria legendar sem mandar o vídeo bruto para outro serviço. No Voxa fica tudo no celular e o resultado sai bem limpo.',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: 'Gerente de marca',
  socialTestimonial3Text:
    'Produzimos Reels em lote para três marcas. O Voxa agilizou muito a etapa das legendas, e editar por gestos é bem natural.',

  tinderHeadline: 'Quais dessas situações parecem familiares?',
  tinderSubheadline: 'Deslize para a direita se combina. Para a esquerda para pular.',
  tinderSkip: 'Pular',
  tinderRelate: 'Acontece comigo',
  tinderRemaining: 'cartões restantes',
  tinderRemainingOne: 'cartão restante',
  tinderSkipRemaining: 'Pular restantes',

  solutionHeadline: 'Como o Voxa ajuda',
  solutionSubheadline:
    'Com base no que você escolheu, estas são as partes que o Voxa resolve para você.',
  solutionSpeedPain: 'Legendar demora demais',
  solutionSpeedSolution: 'Gere legendas em menos de 60 segundos',
  solutionSpeedStat:
    'Reconhecimento de voz no aparelho, sem uploads',
  solutionPrivacyPain: 'Ferramentas online dão pouca confiança',
  solutionPrivacySolution: 'Seus vídeos ficam no seu celular',
  solutionPrivacyStat: 'Sem processamento na nuvem. Sem coleta de vídeos.',
  solutionStylePain: 'As legendas ficam genéricas',
  solutionStyleSolution: 'Escolha estilos limpos, fortes, neon, glow ou cinema',
  solutionStyleStat: 'Fontes, cores, efeitos e posições incluídos',
  solutionCostPain: 'Assinaturas acabam pesando',
  solutionCostSolution: 'Um app. Sem mensalidade. Sem marca d’água.',
  solutionCostStat: 'As ferramentas principais já vêm incluídas',
  solutionCta: 'Ver estilos',

  prefHeadline: 'Escolha seu estilo de legenda',
  prefSubheadline:
    'Esses serão os padrões do seu primeiro projeto. Depois você pode ajustar tudo.',
  prefSectionFont: 'Fonte',
  prefSectionColor: 'Cor de destaque',
  prefSectionEffect: 'Efeito',
  prefCta: 'Continuar',

  permHeadline: 'Um último passo',
  permSubheadline:
    'O Voxa precisa acessar seus vídeos e o reconhecimento de voz do aparelho. Seus clipes continuam offline.',
  permPhotoTitle: 'Fotos',
  permPhotoBody:
    'Importe vídeos e salve os clipes finalizados no rolo da câmera.',
  permSpeechTitle: 'Reconhecimento de voz',
  permSpeechBody:
    'Transforme áudio em legendas diretamente no aparelho.',
  permGranted: 'Permitido',
  permLimited: 'Acesso limitado',
  permDenied: 'Acesso negado',
  permRestricted: 'Restrito',
  permNotDetermined: 'Ainda não definido',
  permUnavailable: 'Indisponível',
  permEnable: 'Permitir acesso',
  permRequesting: 'Solicitando...',
  permNotNow: 'Agora não',
  permAllSet: 'Tudo certo',

  procTitle: 'Preparando tudo',
  procSubtitle: 'Aplicando suas preferências...',
  procPhase1: 'Aplicando suas preferências...',
  procPhase2: 'Preparando seu espaço de trabalho...',
  procPhase3: 'Quase lá...',

  demoHeadline: 'Teste o visual',
  demoSubheadline:
    'Escolha fonte, cor e efeito. Veja o estilo das legendas em tempo real.',
  demoSectionFont: 'Fonte',
  demoSectionAccent: 'Destaque',
  demoSectionEffect: 'Efeito',
  demoCta: 'Usar este estilo',
  demoPreviewText: 'Suas legendas vão ficar assim',

  effectClean: 'Limpo',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Cinema',

  valueTitle: 'Tudo pronto',
  valueBody: 'O Voxa está pronto para ajudar você a',
  valueItemsTitle: 'Já está preparado:',
  valueGoalFallback: 'Criar legendas melhores',
  valueItem1Label: 'Legendas rápidas',
  valueItem1Desc: 'Importe um vídeo e receba legendas em segundos',
  valueItem2Label: 'Seu estilo foi salvo',
  valueItem2Desc: 'Fonte, cor e efeito prontos para usar',
  valueItem3Label: 'Privado por padrão',
  valueItem3Desc: 'O processamento acontece no seu aparelho',
  valueCta: 'Começar a criar',

  continue: 'Continuar',
  skip: 'Pular',
  back: 'Voltar',
};

const fr: Translations = {
  welcomeEyebrow: 'Hors ligne. Privé. Instantané.',
  welcomeTitle: 'Des sous-titres qui retiennent vraiment l’attention',
  welcomeDescription:
    'Importe n’importe quelle vidéo et obtiens des sous-titres propres, bien calés, en moins d’une minute. Pas d’envoi. Pas d’abonnement. Juste ton téléphone.',
  welcomeCta: 'Commencer',

  goalHeadline: 'Qu’est-ce que tu veux améliorer ?',
  goalSubheadline:
    'Choisis ce qui compte le plus maintenant. Voxa adaptera tes réglages de départ.',
  goalViral: 'Garder les spectateurs plus longtemps',
  goalAccessible: 'Rendre le contenu plus facile à suivre',
  goalBrand: 'Créer un style visuel cohérent',
  goalFast: 'Publier plus vite sans déléguer',
  goalMultilingual: 'Toucher des publics dans d’autres langues',
  goalProfessional: 'Donner un rendu plus soigné',
  goalCta: 'Continuer',

  painHeadline: 'Qu’est-ce qui te ralentit le plus ?',
  painSubheadline:
    'Coche tout ce qui bloque ton workflow. Voxa en tiendra compte pour la première configuration.',
  painTyping: 'Taper les sous-titres prend trop de temps',
  painTools: 'Les outils en ligne sont lents ou peu rassurants',
  painCost: 'Les abonnements finissent par coûter cher',
  painTiming: 'Le timing est difficile à caler',
  painStyle: 'Les sous-titres font trop générique',
  painOffline: 'J’ai besoin de travailler sans internet',
  painPrivacy: 'Je ne veux pas mes vidéos dans le cloud',
  painCtaNone: 'Choisis au moins une option',
  painCtaSome: 'Continuer',

  socialHeadline: 'Des créateurs gagnent déjà des heures sur leurs sous-titres',
  socialSubheadline:
    'Utilise le sous-titrage sur l’appareil au lieu de retaper chaque ligne à la main.',
  socialCta: 'Continuer',
  socialTestimonial1Name: 'Maya L.',
  socialTestimonial1Tag: 'Créatrice TikTok',
  socialTestimonial1Text:
    'Je passais presque une heure sur les sous-titres de chaque vidéo. Maintenant, c’est plié en moins d’une minute, avec un style néon qui colle à ma page.',
  socialTestimonial2Name: 'Jordan T.',
  socialTestimonial2Tag: 'YouTubeur',
  socialTestimonial2Text:
    'Je voulais des sous-titres sans envoyer mes rushs à un service en ligne. Avec Voxa, tout reste sur mon téléphone et le rendu est propre.',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: 'Responsable de marque',
  socialTestimonial3Text:
    'On prépare des Reels en série pour trois marques. Voxa accélère vraiment la partie sous-titres, et les gestes d’édition sont naturels.',

  tinderHeadline: 'Qu’est-ce qui te parle ?',
  tinderSubheadline: 'Glisse à droite si ça te correspond. À gauche pour passer.',
  tinderSkip: 'Passer',
  tinderRelate: 'Ça me parle',
  tinderRemaining: 'cartes restantes',
  tinderRemainingOne: 'carte restante',
  tinderSkipRemaining: 'Passer le reste',

  solutionHeadline: 'Comment Voxa t’aide',
  solutionSubheadline:
    'D’après tes choix, voici ce que Voxa peut prendre en charge pour toi.',
  solutionSpeedPain: 'Sous-titrer prend trop de temps',
  solutionSpeedSolution: 'Génère des sous-titres en moins de 60 secondes',
  solutionSpeedStat:
    'Reconnaissance vocale sur l’appareil, sans envoi',
  solutionPrivacyPain: 'Les outils en ligne ne rassurent pas',
  solutionPrivacySolution: 'Tes vidéos restent sur ton téléphone',
  solutionPrivacyStat: 'Pas de traitement cloud. Pas de collecte de vidéos.',
  solutionStylePain: 'Les sous-titres font trop générique',
  solutionStyleSolution: 'Choisis un style sobre, impactant, néon, glow ou cinéma',
  solutionStyleStat: 'Polices, couleurs, effets et positions inclus',
  solutionCostPain: 'Les abonnements s’accumulent',
  solutionCostSolution: 'Une app. Pas de frais récurrents. Pas de filigrane.',
  solutionCostStat: 'Les outils essentiels sont inclus dès le départ',
  solutionCta: 'Voir les styles',

  prefHeadline: 'Choisis ton style de sous-titres',
  prefSubheadline:
    'Ce seront les réglages de ton premier projet. Tu pourras tout modifier ensuite.',
  prefSectionFont: 'Police',
  prefSectionColor: 'Couleur d’accent',
  prefSectionEffect: 'Effet',
  prefCta: 'Continuer',

  permHeadline: 'Dernière étape de configuration',
  permSubheadline:
    'Voxa a besoin d’accéder à tes vidéos et à la reconnaissance vocale de l’appareil. Tes clips restent hors ligne.',
  permPhotoTitle: 'Photos',
  permPhotoBody:
    'Importer des vidéos et enregistrer les clips terminés dans ta pellicule.',
  permSpeechTitle: 'Reconnaissance vocale',
  permSpeechBody:
    'Transformer l’audio en sous-titres directement sur ton appareil.',
  permGranted: 'Autorisé',
  permLimited: 'Accès limité',
  permDenied: 'Accès refusé',
  permRestricted: 'Accès restreint',
  permNotDetermined: 'Pas encore choisi',
  permUnavailable: 'Indisponible',
  permEnable: 'Autoriser l’accès',
  permRequesting: 'Demande en cours...',
  permNotNow: 'Pas maintenant',
  permAllSet: 'C’est prêt',

  procTitle: 'Configuration en cours',
  procSubtitle: 'Application de tes préférences...',
  procPhase1: 'Application de tes préférences...',
  procPhase2: 'Préparation de ton espace de travail...',
  procPhase3: 'Presque terminé...',

  demoHeadline: 'Teste le rendu',
  demoSubheadline:
    'Choisis une police, une couleur et un effet. Prévisualise ton style en temps réel.',
  demoSectionFont: 'Police',
  demoSectionAccent: 'Accent',
  demoSectionEffect: 'Effet',
  demoCta: 'Utiliser ce style',
  demoPreviewText: 'Tes sous-titres ressembleront à ça',

  effectClean: 'Sobre',
  effectNeon: 'Néon',
  effectGlow: 'Glow',
  effectCinema: 'Cinéma',

  valueTitle: 'Tout est prêt',
  valueBody: 'Voxa est prêt à t’aider à',
  valueItemsTitle: 'Déjà configuré :',
  valueGoalFallback: 'Créer de meilleurs sous-titres',
  valueItem1Label: 'Sous-titres rapides',
  valueItem1Desc: 'Importe une vidéo et obtiens des sous-titres en quelques secondes',
  valueItem2Label: 'Ton style est enregistré',
  valueItem2Desc: 'Police, couleur et effet sont prêts',
  valueItem3Label: 'Privé par défaut',
  valueItem3Desc: 'Le traitement se fait sur ton appareil',
  valueCta: 'Commencer à créer',

  continue: 'Continuer',
  skip: 'Passer',
  back: 'Retour',
};

const de: Translations = {
  welcomeEyebrow: 'Offline. Privat. Sofort.',
  welcomeTitle: 'Untertitel, die deine Clips länger im Blick halten',
  welcomeDescription:
    'Importiere ein beliebiges Video und erhalte saubere, präzise getimte Untertitel in unter einer Minute. Keine Uploads. Keine Abos. Nur dein Smartphone.',
  welcomeCta: 'Loslegen',

  goalHeadline: 'Was möchtest du erreichen?',
  goalSubheadline:
    'Wähle aus, was dir gerade am wichtigsten ist. Voxa richtet die Startwerte danach aus.',
  goalViral: 'Zuschauer länger dranhalten',
  goalAccessible: 'Inhalte leichter verständlich machen',
  goalBrand: 'Einen einheitlichen Look aufbauen',
  goalFast: 'Schneller posten, ohne auszulagern',
  goalMultilingual: 'Zielgruppen in anderen Sprachen erreichen',
  goalProfessional: 'Clips hochwertiger wirken lassen',
  goalCta: 'Weiter',

  painHeadline: 'Was bremst dich am meisten?',
  painSubheadline:
    'Markiere alles, was deinen Ablauf stört. Voxa berücksichtigt das bei der ersten Einrichtung.',
  painTyping: 'Untertitel abzutippen dauert zu lange',
  painTools: 'Online-Tools sind langsam oder wirken riskant',
  painCost: 'Abos summieren sich',
  painTiming: 'Das Timing ist schwer sauber zu treffen',
  painStyle: 'Untertitel sehen zu austauschbar aus',
  painOffline: 'Ich muss ohne Internet arbeiten können',
  painPrivacy: 'Ich will mein Material nicht in der Cloud haben',
  painCtaNone: 'Wähle mindestens eine Option',
  painCtaSome: 'Weiter',

  socialHeadline: 'Creator sparen bereits Stunden bei Untertiteln',
  socialSubheadline:
    'Nutze Untertitel direkt auf dem Gerät, statt jede Zeile von Hand zu tippen.',
  socialCta: 'Weiter',
  socialTestimonial1Name: 'Maya K.',
  socialTestimonial1Tag: 'TikTok-Creatorin',
  socialTestimonial1Text:
    'Früher saß ich fast eine Stunde an den Untertiteln für ein Video. Jetzt bin ich in unter einer Minute fertig, und der Neon-Look passt zu meinem Kanal.',
  socialTestimonial2Name: 'Jonas T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    'Ich wollte Untertitel, ohne mein Rohmaterial irgendwo hochzuladen. Mit Voxa bleibt alles auf dem Smartphone und sieht trotzdem sauber aus.',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: 'Brand-Managerin',
  socialTestimonial3Text:
    'Wir erstellen Reels für drei Marken im Batch. Voxa macht den Untertitel-Teil deutlich schneller, und die Gesten fühlen sich direkt richtig an.',

  tinderHeadline: 'Was kommt dir bekannt vor?',
  tinderSubheadline: 'Nach rechts wischen, wenn es passt. Nach links zum Überspringen.',
  tinderSkip: 'Überspringen',
  tinderRelate: 'Kenne ich',
  tinderRemaining: 'Karten übrig',
  tinderRemainingOne: 'Karte übrig',
  tinderSkipRemaining: 'Rest überspringen',

  solutionHeadline: 'So hilft Voxa',
  solutionSubheadline:
    'Aus deinen Antworten ergeben sich die Aufgaben, die Voxa für dich übernimmt.',
  solutionSpeedPain: 'Untertitel dauern zu lange',
  solutionSpeedSolution: 'Erzeuge Untertitel in unter 60 Sekunden',
  solutionSpeedStat:
    'Spracherkennung auf dem Gerät, ohne Uploads',
  solutionPrivacyPain: 'Online-Tools fühlen sich riskant an',
  solutionPrivacySolution: 'Deine Videos bleiben auf deinem Smartphone',
  solutionPrivacyStat: 'Keine Cloud-Verarbeitung. Keine Videosammlung.',
  solutionStylePain: 'Untertitel sehen zu generisch aus',
  solutionStyleSolution: 'Wähle klare, kräftige, Neon-, Glow- oder Kino-Stile',
  solutionStyleStat: 'Schriften, Farben, Effekte und Positionen inklusive',
  solutionCostPain: 'Abos summieren sich',
  solutionCostSolution: 'Eine App. Keine laufenden Gebühren. Kein Wasserzeichen.',
  solutionCostStat: 'Die wichtigsten Werkzeuge sind von Anfang an dabei',
  solutionCta: 'Stile ansehen',

  prefHeadline: 'Wähle deinen Untertitel-Stil',
  prefSubheadline:
    'Das sind die Startwerte für dein erstes Projekt. Später kannst du alles ändern.',
  prefSectionFont: 'Schrift',
  prefSectionColor: 'Akzentfarbe',
  prefSectionEffect: 'Effekt',
  prefCta: 'Weiter',

  permHeadline: 'Ein letzter Einrichtungsschritt',
  permSubheadline:
    'Voxa braucht Zugriff auf deine Videos und die Spracherkennung des Geräts. Deine Clips bleiben offline.',
  permPhotoTitle: 'Fotos',
  permPhotoBody:
    'Videos importieren und fertige Clips wieder in deiner Mediathek speichern.',
  permSpeechTitle: 'Spracherkennung',
  permSpeechBody:
    'Audio direkt auf deinem Gerät in Untertitel umwandeln.',
  permGranted: 'Erlaubt',
  permLimited: 'Eingeschränkter Zugriff',
  permDenied: 'Zugriff abgelehnt',
  permRestricted: 'Beschränkt',
  permNotDetermined: 'Noch nicht entschieden',
  permUnavailable: 'Nicht verfügbar',
  permEnable: 'Zugriff erlauben',
  permRequesting: 'Wird angefragt...',
  permNotNow: 'Nicht jetzt',
  permAllSet: 'Alles bereit',

  procTitle: 'Einrichtung läuft',
  procSubtitle: 'Deine Einstellungen werden übernommen...',
  procPhase1: 'Deine Einstellungen werden übernommen...',
  procPhase2: 'Arbeitsbereich wird vorbereitet...',
  procPhase3: 'Fast fertig...',

  demoHeadline: 'Teste den Look',
  demoSubheadline:
    'Wähle Schrift, Farbe und Effekt. Sieh deinen Untertitel-Stil in Echtzeit.',
  demoSectionFont: 'Schrift',
  demoSectionAccent: 'Akzent',
  demoSectionEffect: 'Effekt',
  demoCta: 'Diesen Stil nutzen',
  demoPreviewText: 'So werden deine Untertitel aussehen',

  effectClean: 'Klar',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Kino',

  valueTitle: 'Alles ist bereit',
  valueBody: 'Voxa ist bereit, dir zu helfen',
  valueItemsTitle: 'Bereits eingerichtet:',
  valueGoalFallback: 'Bessere Untertitel erstellen',
  valueItem1Label: 'Schnelle Untertitel',
  valueItem1Desc: 'Importiere ein Video und erhalte Untertitel in Sekunden',
  valueItem2Label: 'Dein Stil ist gespeichert',
  valueItem2Desc: 'Schrift, Farbe und Effekt sind startklar',
  valueItem3Label: 'Standardmäßig privat',
  valueItem3Desc: 'Die Verarbeitung läuft auf deinem Gerät',
  valueCta: 'Mit dem Erstellen beginnen',

  continue: 'Weiter',
  skip: 'Überspringen',
  back: 'Zurück',
};

const it: Translations = {
  welcomeEyebrow: 'Offline. Privato. Subito.',
  welcomeTitle: 'Sottotitoli che fanno restare le persone sul tuo video',
  welcomeDescription:
    'Importa qualsiasi video e ottieni sottotitoli puliti, ben sincronizzati, in meno di un minuto. Nessun upload. Nessun abbonamento. Solo il tuo telefono.',
  welcomeCta: 'Inizia',

  goalHeadline: 'Che risultato vuoi ottenere?',
  goalSubheadline:
    'Scegli ciò che conta di più adesso. Voxa imposterà i valori iniziali di conseguenza.',
  goalViral: 'Tenere gli spettatori più a lungo',
  goalAccessible: 'Rendere i contenuti più facili da seguire',
  goalBrand: 'Creare uno stile visivo coerente',
  goalFast: 'Pubblicare più in fretta senza delegare',
  goalMultilingual: 'Raggiungere pubblico in altre lingue',
  goalProfessional: 'Dare ai clip un aspetto più curato',
  goalCta: 'Continua',

  painHeadline: 'Cosa ti rallenta di più?',
  painSubheadline:
    'Seleziona tutto ciò che ti blocca. Voxa lo userà per configurare il primo setup.',
  painTyping: 'Scrivere i sottotitoli richiede troppo tempo',
  painTools: 'Gli strumenti online sono lenti o poco affidabili',
  painCost: 'Gli abbonamenti si accumulano',
  painTiming: 'È difficile centrare bene il timing',
  painStyle: 'I sottotitoli sembrano generici',
  painOffline: 'Devo poter lavorare senza internet',
  painPrivacy: 'Non voglio i miei video nel cloud',
  painCtaNone: 'Scegli almeno un’opzione',
  painCtaSome: 'Continua',

  socialHeadline: 'I creator stanno già risparmiando ore sui sottotitoli',
  socialSubheadline:
    'Usa i sottotitoli sul dispositivo invece di riscrivere ogni riga a mano.',
  socialCta: 'Continua',
  socialTestimonial1Name: 'Maya C.',
  socialTestimonial1Tag: 'Creator TikTok',
  socialTestimonial1Text:
    'Prima perdevo quasi un’ora sui sottotitoli di ogni video. Ora chiudo tutto in meno di un minuto, e lo stile neon sta bene sul mio profilo.',
  socialTestimonial2Name: 'Giordano T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    'Volevo sottotitoli senza caricare i girati su un altro servizio. Con Voxa resta tutto sul telefono e il risultato è pulito.',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: 'Brand manager',
  socialTestimonial3Text:
    'Prepariamo Reels in batch per tre brand. Voxa ci fa risparmiare molto tempo sui sottotitoli, e modificare con i gesti è naturale.',

  tinderHeadline: 'Quali situazioni ti suonano familiari?',
  tinderSubheadline: 'Scorri a destra se ti riguarda. A sinistra per saltare.',
  tinderSkip: 'Salta',
  tinderRelate: 'Mi riguarda',
  tinderRemaining: 'schede rimaste',
  tinderRemainingOne: 'scheda rimasta',
  tinderSkipRemaining: 'Salta le restanti',

  solutionHeadline: 'Come ti aiuta Voxa',
  solutionSubheadline:
    'In base alle tue scelte, queste sono le parti che Voxa gestisce per te.',
  solutionSpeedPain: 'Sottotitolare richiede troppo tempo',
  solutionSpeedSolution: 'Genera sottotitoli in meno di 60 secondi',
  solutionSpeedStat:
    'Riconoscimento vocale sul dispositivo, senza upload',
  solutionPrivacyPain: 'Gli strumenti online non mi convincono',
  solutionPrivacySolution: 'I tuoi video restano sul telefono',
  solutionPrivacyStat: 'Nessun cloud. Nessuna raccolta di video.',
  solutionStylePain: 'I sottotitoli sembrano generici',
  solutionStyleSolution: 'Scegli stili puliti, bold, neon, glow o cinema',
  solutionStyleStat: 'Font, colori, effetti e posizioni inclusi',
  solutionCostPain: 'Gli abbonamenti si accumulano',
  solutionCostSolution: 'Un’app. Nessun costo ricorrente. Nessun watermark.',
  solutionCostStat: 'Gli strumenti principali sono inclusi da subito',
  solutionCta: 'Mostra gli stili',

  prefHeadline: 'Scegli lo stile dei sottotitoli',
  prefSubheadline:
    'Questi saranno i valori iniziali del tuo primo progetto. Potrai modificare tutto dopo.',
  prefSectionFont: 'Font',
  prefSectionColor: 'Colore accento',
  prefSectionEffect: 'Effetto',
  prefCta: 'Continua',

  permHeadline: 'Ultimo passaggio di configurazione',
  permSubheadline:
    'Voxa deve accedere ai tuoi video e al riconoscimento vocale del dispositivo. I tuoi clip restano offline.',
  permPhotoTitle: 'Foto',
  permPhotoBody:
    'Importa video e salva i clip finiti nel rullino.',
  permSpeechTitle: 'Riconoscimento vocale',
  permSpeechBody:
    'Trasforma l’audio in sottotitoli direttamente sul dispositivo.',
  permGranted: 'Consentito',
  permLimited: 'Accesso limitato',
  permDenied: 'Accesso negato',
  permRestricted: 'Limitato dal sistema',
  permNotDetermined: 'Non ancora deciso',
  permUnavailable: 'Non disponibile',
  permEnable: 'Consenti accesso',
  permRequesting: 'Richiesta in corso...',
  permNotNow: 'Non ora',
  permAllSet: 'Tutto pronto',

  procTitle: 'Configurazione in corso',
  procSubtitle: 'Applicazione delle preferenze...',
  procPhase1: 'Applicazione delle preferenze...',
  procPhase2: 'Preparazione dello spazio di lavoro...',
  procPhase3: 'Ci siamo quasi...',

  demoHeadline: 'Prova il look',
  demoSubheadline:
    'Scegli font, colore ed effetto. Guarda lo stile dei sottotitoli in tempo reale.',
  demoSectionFont: 'Font',
  demoSectionAccent: 'Accento',
  demoSectionEffect: 'Effetto',
  demoCta: 'Usa questo stile',
  demoPreviewText: 'I tuoi sottotitoli saranno così',

  effectClean: 'Pulito',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Cinema',

  valueTitle: 'Tutto pronto',
  valueBody: 'Voxa è pronto ad aiutarti a',
  valueItemsTitle: 'Già configurato:',
  valueGoalFallback: 'Creare sottotitoli migliori',
  valueItem1Label: 'Sottotitoli rapidi',
  valueItem1Desc: 'Importa un video e ottieni sottotitoli in pochi secondi',
  valueItem2Label: 'Il tuo stile è salvato',
  valueItem2Desc: 'Font, colore ed effetto sono pronti',
  valueItem3Label: 'Privato di default',
  valueItem3Desc: 'L’elaborazione avviene sul dispositivo',
  valueCta: 'Inizia a creare',

  continue: 'Continua',
  skip: 'Salta',
  back: 'Indietro',
};

const ru: Translations = {
  welcomeEyebrow: 'Офлайн. Приватно. Сразу.',
  welcomeTitle: 'Субтитры, которые помогают удержать внимание',
  welcomeDescription:
    'Импортируй любое видео и получи аккуратные, точно синхронизированные субтитры меньше чем за минуту. Без загрузок. Без подписок. Только телефон.',
  welcomeCta: 'Начать',

  goalHeadline: 'Чего ты хочешь добиться?',
  goalSubheadline:
    'Выбери, что сейчас важнее всего. Voxa подстроит стартовые настройки под это.',
  goalViral: 'Удерживать зрителей дольше',
  goalAccessible: 'Сделать контент понятнее',
  goalBrand: 'Собрать единый визуальный стиль',
  goalFast: 'Публиковать быстрее без подрядчиков',
  goalMultilingual: 'Достучаться до аудитории на других языках',
  goalProfessional: 'Сделать ролики более аккуратными',
  goalCta: 'Продолжить',

  painHeadline: 'Что больше всего тормозит?',
  painSubheadline:
    'Отметь всё, что мешает процессу. Voxa учтёт это при первой настройке.',
  painTyping: 'Печатать субтитры слишком долго',
  painTools: 'Онлайн-инструменты медленные или не вызывают доверия',
  painCost: 'Подписки быстро набегают',
  painTiming: 'Тайминг сложно выставить точно',
  painStyle: 'Субтитры выглядят шаблонно',
  painOffline: 'Нужно работать без интернета',
  painPrivacy: 'Не хочу загружать видео в облако',
  painCtaNone: 'Выбери хотя бы один пункт',
  painCtaSome: 'Продолжить',

  socialHeadline: 'Авторы уже экономят часы на субтитрах',
  socialSubheadline:
    'Используй субтитры на устройстве вместо ручного набора каждой строки.',
  socialCta: 'Продолжить',
  socialTestimonial1Name: 'Майя К.',
  socialTestimonial1Tag: 'TikTok-автор',
  socialTestimonial1Text:
    'Раньше я тратила почти час на субтитры к одному ролику. Теперь укладываюсь меньше чем за минуту, а неоновый стиль хорошо смотрится в ленте.',
  socialTestimonial2Name: 'Илья Т.',
  socialTestimonial2Tag: 'YouTube-автор',
  socialTestimonial2Text:
    'Мне нужны были субтитры без загрузки исходников на сторонние сервисы. В Voxa всё остаётся на телефоне, а результат выглядит аккуратно.',
  socialTestimonial3Name: 'София Р.',
  socialTestimonial3Tag: 'Бренд-менеджер',
  socialTestimonial3Text:
    'Мы пачками готовим Reels для трёх брендов. Voxa заметно ускоряет работу с субтитрами, а жесты для правки ощущаются естественно.',

  tinderHeadline: 'Что из этого знакомо?',
  tinderSubheadline: 'Свайп вправо, если подходит. Влево — пропустить.',
  tinderSkip: 'Пропустить',
  tinderRelate: 'Знакомо',
  tinderRemaining: 'карточек осталось',
  tinderRemainingOne: 'карточка осталась',
  tinderSkipRemaining: 'Пропустить остальные',

  solutionHeadline: 'Как Voxa помогает',
  solutionSubheadline:
    'По твоим ответам Voxa возьмёт на себя вот эти части работы.',
  solutionSpeedPain: 'Субтитры занимают слишком много времени',
  solutionSpeedSolution: 'Генерируй субтитры меньше чем за 60 секунд',
  solutionSpeedStat:
    'Распознавание речи на устройстве, без загрузок',
  solutionPrivacyPain: 'Онлайн-инструменты кажутся рискованными',
  solutionPrivacySolution: 'Видео остаётся на твоём телефоне',
  solutionPrivacyStat: 'Без облачной обработки. Без сбора видео.',
  solutionStylePain: 'Субтитры выглядят шаблонно',
  solutionStyleSolution: 'Выбирай чистые, яркие, неоновые, glow- или кино-стили',
  solutionStyleStat: 'Шрифты, цвета, эффекты и позиции уже внутри',
  solutionCostPain: 'Подписки набегают',
  solutionCostSolution: 'Одно приложение. Без регулярных платежей. Без водяных знаков.',
  solutionCostStat: 'Основные инструменты доступны сразу',
  solutionCta: 'Показать стили',

  prefHeadline: 'Выбери стиль субтитров',
  prefSubheadline:
    'Это будут настройки для первого проекта. Потом можно изменить всё.',
  prefSectionFont: 'Шрифт',
  prefSectionColor: 'Акцентный цвет',
  prefSectionEffect: 'Эффект',
  prefCta: 'Продолжить',

  permHeadline: 'Последний шаг настройки',
  permSubheadline:
    'Voxa нужен доступ к видео и распознаванию речи на устройстве. Твои клипы остаются офлайн.',
  permPhotoTitle: 'Фото',
  permPhotoBody:
    'Импортировать видео и сохранять готовые клипы обратно в медиатеку.',
  permSpeechTitle: 'Распознавание речи',
  permSpeechBody:
    'Преобразовывать звук в субтитры прямо на устройстве.',
  permGranted: 'Разрешено',
  permLimited: 'Ограниченный доступ',
  permDenied: 'Доступ запрещён',
  permRestricted: 'Ограничено системой',
  permNotDetermined: 'Ещё не выбрано',
  permUnavailable: 'Недоступно',
  permEnable: 'Разрешить доступ',
  permRequesting: 'Запрашиваем...',
  permNotNow: 'Не сейчас',
  permAllSet: 'Готово',

  procTitle: 'Настраиваем',
  procSubtitle: 'Применяем твои предпочтения...',
  procPhase1: 'Применяем твои предпочтения...',
  procPhase2: 'Готовим рабочее пространство...',
  procPhase3: 'Почти готово...',

  demoHeadline: 'Проверь стиль',
  demoSubheadline:
    'Выбери шрифт, цвет и эффект. Посмотри, как субтитры будут выглядеть в реальном времени.',
  demoSectionFont: 'Шрифт',
  demoSectionAccent: 'Акцент',
  demoSectionEffect: 'Эффект',
  demoCta: 'Использовать этот стиль',
  demoPreviewText: 'Так будут выглядеть твои субтитры',

  effectClean: 'Чистый',
  effectNeon: 'Неон',
  effectGlow: 'Свечение',
  effectCinema: 'Кино',

  valueTitle: 'Всё готово',
  valueBody: 'Voxa готова помочь тебе',
  valueItemsTitle: 'Уже настроено:',
  valueGoalFallback: 'Создавать лучшие субтитры',
  valueItem1Label: 'Быстрые субтитры',
  valueItem1Desc: 'Импортируй видео и получи субтитры за секунды',
  valueItem2Label: 'Твой стиль сохранён',
  valueItem2Desc: 'Шрифт, цвет и эффект уже готовы',
  valueItem3Label: 'Приватно по умолчанию',
  valueItem3Desc: 'Обработка идёт на устройстве',
  valueCta: 'Начать создавать',

  continue: 'Продолжить',
  skip: 'Пропустить',
  back: 'Назад',

  homeProjects: 'Проекты',
  homeCreateProjectLabel: 'Создать проект',
  homeCreateProjectHint: 'Создать новый проект',
  homeOpenSettingsLabel: 'Открыть настройки',
  homeOpenSettingsHint: 'Открыть настройки приложения',
  homeEmptyProjectTitle: 'Потяни вниз, чтобы создать',
  homeEmptyProjectFileName: 'Пусто',
  homeEmptyTitle: 'Нажми +, чтобы создать.',
  homeEmptyText:
    'Импортируй локальное видео, и Voxa соберёт таймлайн субтитров офлайн. Можно также потянуть вниз для быстрого создания.',
  greetingMorning: 'Доброе утро',
  greetingAfternoon: 'Добрый день',
  greetingEvening: 'Добрый вечер',
  projectDelete: 'Удалить',
  projectSubtitleBlocks: 'блоков субтитров',
  projectSubtitleBlock: 'блок субтитров',

  transcribingLanguageTitle: 'Язык транскрибации',
  transcribingLanguageBody:
    'Выбери язык речи в этом видео, прежде чем Voxa создаст субтитры.',
  appLanguageLabel: 'Язык приложения',
  appLanguageFallback: 'приложение',
  loadingOnDeviceLanguages: 'Загружаем языки на устройстве...',
  onDeviceLanguagesAvailable: 'языков на устройстве доступно.',
  noOnDeviceLanguages: 'Сейчас нет доступных языков на устройстве.',
  loading: 'Загрузка...',
  transcribeVideo: 'Транскрибировать видео',

  settingsTitle: 'Настройки',
  settingsDefaultExport: 'Экспорт по умолчанию',
  settingsUseAppLanguage: 'Использовать язык приложения',
  settingsUseAppLanguageDescription:
    'Новые видео используют язык приложения, если такой язык речи доступен.',
  settingsAskBeforeTranscription: 'Спрашивать перед каждой транскрибацией',
  settingsAskBeforeTranscriptionDescription:
    'Показывать выбор языка перед каждой новой транскрибацией.',
  settingsRememberLastLanguage: 'Запоминать последний язык',
  settingsLastUsed: 'Последний',
  settingsRememberLastLanguageDescription:
    'Предвыбирать и повторно использовать последний язык транскрибации.',
  settingsSubtitleHighlighting: 'Подсветка субтитров',
  settingsHighlightEditedWords: 'Подсвечивать изменённые слова',
  settingsHighlightEditedWordsDescription:
    'Приблизительный тайминг слов после ручной правки субтитров.',
  settingsPrivacy: 'Приватность',
  settingsPrivacyBody:
    'Voxa выполняет извлечение, распознавание речи, редактирование субтитров и экспорт полностью на устройстве. Удалённые медиа используются только как визуальные заглушки.',
  settingsReplayOnboarding: 'Повторить онбординг',

  speechAccessFailedTitle: 'Ошибка доступа к речи',
  speechAccessFailedBody: 'Сейчас не удалось запросить доступ к распознаванию речи.',
  languageListFailedTitle: 'Ошибка списка языков',
  languageListFailedBody: 'Сейчас не удалось загрузить языки транскрибации на устройстве.',
  selectedVideo: 'Выбранное видео',
  enableSpeechAccess: 'Включи доступ к речи',
  grantSpeechAccess: 'Разреши доступ к речи',
  speechAccessSettingsBody:
    'Распознавание речи выключено для Voxa. Открой настройки, включи доступ и вернись, чтобы продолжить создание субтитров для этого видео.',
  speechAccessGrantBody:
    'Voxa нужен доступ к распознаванию речи, чтобы создавать субтитры прямо на устройстве после импорта видео.',
  openSettings: 'Открыть настройки',
  checkingAccess: 'Проверяем доступ...',
  continueManually: 'Продолжить вручную',

  processingOfflineAi: 'Офлайн AI',
  processingBody: 'Voxa обрабатывает видео локально на устройстве.',
  processingExtractingAudio: 'Извлекаем аудио...',
  processingDetectingLanguage: 'Определяем язык речи...',
  processingSelectedLanguage: 'Транскрибируем на выбранном языке...',
  processingBestLanguage: 'Транскрибируем на лучшем языке устройства...',
  processingGeneratingTimeline: 'Создаём таймлайн...',

  exportTitle: 'Экспорт',
  exportResolution: 'Разрешение',
  exportToPhotos: 'Экспортировать в Фото',
  exportHold: 'Нажми и удерживай для экспорта',
  exportingToPhotos: 'Экспортируем в Фото...',
  exportSaved: 'Сохранено в Фото',
  exportFailed: 'Экспорт не удался. Попробуй ещё раз.',

  retry: 'Повторить',
  retrySubtitles: 'Повторить субтитры',
  retrying: 'Повторяем...',
  retrySubtitlesBody:
    'Автоопределение выбирает лучший язык на устройстве. Выбери язык вручную, если определение ошиблось.',
  autoDetect: 'Автоопределение',
  subtitlesCreatedNeedsReview:
    'Субтитры созданы, но проект всё ещё помечен как требующий проверки.',
  noSubtitlesGenerated:
    'Для этого клипа не удалось создать субтитры. Попробуй автоопределение или выбери язык вручную.',
  manualEditingAvailable: 'Ручное редактирование субтитров всё ещё доступно.',
  lastAttempt: 'Последняя попытка',
  manual: 'вручную',
  auto: 'авто',
  chooseLanguageToRetry: 'Выбери автоопределение или конкретный язык на устройстве для повтора.',
  subtitleRetryFailedTitle: 'Не удалось повторить субтитры',
  subtitleRetryFailedBody: 'Сейчас не удалось заново создать субтитры.',
  noSubtitlesCreatedTitle: 'Субтитры не созданы',
  noSubtitlesSelectedLanguage: 'На выбранном языке субтитры не были созданы.',
  regenerateSubtitles: 'Создать субтитры заново',
  regenerating: 'Создаём заново...',

  wordHighlight: 'Подсветка слов',
  wordHighlightAvailable: 'Подсвечивать текущее произнесённое слово.',
  wordTimingUnavailable: 'Тайминг слов недоступен',
  textEffects: 'Текстовые эффекты',
  effectNone: 'Нет',
  effectChrome: 'Хром',
  effectShadow: 'Тень',
  recognitionLanguage: 'Язык распознавания',
  current: 'Текущий',
  onDeviceLanguagesAvailableShort: 'языков на устройстве доступно',
  subtitleTab: 'Субтитры',
  styleTab: 'Стиль',
  languageTab: 'Язык',
  fxTab: 'FX',
  done: 'Готово',
  activeSubtitle: 'Активный субтитр',
  noSubtitleSelected: 'Субтитр не выбран',
  rewriteSubtitleText: 'Перепиши текст субтитра',
  selectSubtitleToEdit: 'Выбери блок субтитров для редактирования.',
  styleControls: 'Настройки стиля',
  fonts: 'Шрифты',
  size: 'Размер',
  textColor: 'Цвет текста',
  highlight: 'Подсветка',
  background: 'Фон',
  positions: 'Позиции',
  casing: 'Регистр',
  sentence: 'Обычный',
  uppercase: 'Верхний регистр',
};

const ja: Translations = {
  welcomeEyebrow: 'オフライン。プライベート。すぐに。',
  welcomeTitle: 'スクロールを止める字幕を、あなたの動画に',
  welcomeDescription:
    '動画を読み込むだけで、きれいに同期した字幕を1分以内に作成。アップロードなし。サブスクなし。スマホだけで完結します。',
  welcomeCta: 'はじめる',

  goalHeadline: '何を良くしたいですか？',
  goalSubheadline:
    '今いちばん大事な目的を選んでください。Voxa が初期設定をそれに合わせます。',
  goalViral: '視聴維持率を上げたい',
  goalAccessible: '内容をもっと伝わりやすくしたい',
  goalBrand: '統一感のある見た目にしたい',
  goalFast: '外注せずに早く投稿したい',
  goalMultilingual: '他の言語の視聴者にも届けたい',
  goalProfessional: '動画の仕上がりを良くしたい',
  goalCta: '続ける',

  painHeadline: 'いちばん時間を取られることは？',
  painSubheadline:
    '作業の邪魔になっているものを選んでください。最初の設定に反映します。',
  painTyping: '字幕を手入力するのに時間がかかる',
  painTools: 'オンラインツールは遅い、または不安',
  painCost: 'サブスク費用が積み重なる',
  painTiming: 'タイミング調整が難しい',
  painStyle: '字幕がありきたりに見える',
  painOffline: 'ネットなしで作業したい',
  painPrivacy: '動画をクラウドに上げたくない',
  painCtaNone: '1つ以上選んでください',
  painCtaSome: '続ける',

  socialHeadline: 'クリエイターは字幕作業の時間を減らしています',
  socialSubheadline:
    '1行ずつ手で打つ代わりに、端末上で字幕を作成できます。',
  socialCta: '続ける',
  socialTestimonial1Name: 'マヤ K.',
  socialTestimonial1Tag: 'TikTokクリエイター',
  socialTestimonial1Text:
    '以前は1本の動画の字幕に45分くらいかかっていました。今は1分もかからず、ネオンのスタイルも自分の投稿に合っています。',
  socialTestimonial2Name: 'ジョーダン T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    '素材をどこかにアップロードせずに字幕を付けたかったんです。Voxaなら全部スマホ内で完結して、仕上がりもきれいです。',
  socialTestimonial3Name: 'ソフィア R.',
  socialTestimonial3Tag: 'ブランド担当',
  socialTestimonial3Text:
    '3つのブランド向けにReelsをまとめて作っています。Voxaで字幕作業がかなり速くなり、ジェスチャー編集も自然に使えます。',

  tinderHeadline: '当てはまるものはありますか？',
  tinderSubheadline: '当てはまれば右へ。スキップするなら左へ。',
  tinderSkip: 'スキップ',
  tinderRelate: '当てはまる',
  tinderRemaining: '枚残り',
  tinderRemainingOne: '枚残り',
  tinderSkipRemaining: '残りをスキップ',

  solutionHeadline: 'Voxa ができること',
  solutionSubheadline:
    'あなたの回答に合わせて、Voxa が次の作業をサポートします。',
  solutionSpeedPain: '字幕作成に時間がかかる',
  solutionSpeedSolution: '60秒以内に字幕を生成',
  solutionSpeedStat:
    '端末上の音声認識。アップロードは不要です',
  solutionPrivacyPain: 'オンラインツールは不安',
  solutionPrivacySolution: '動画はスマホの中に残ります',
  solutionPrivacyStat: 'クラウド処理なし。動画収集なし。',
  solutionStylePain: '字幕がありきたり',
  solutionStyleSolution: 'クリーン、太字、ネオン、グロー、シネマ風から選択',
  solutionStyleStat: 'フォント、色、エフェクト、位置を用意',
  solutionCostPain: 'サブスク費用が重なる',
  solutionCostSolution: '1つのアプリ。継続課金なし。ウォーターマークなし。',
  solutionCostStat: '主要機能は最初から使えます',
  solutionCta: 'スタイルを見る',

  prefHeadline: '字幕スタイルを選ぶ',
  prefSubheadline:
    '最初のプロジェクトではこの設定を使います。あとからすべて変更できます。',
  prefSectionFont: 'フォント',
  prefSectionColor: 'アクセントカラー',
  prefSectionEffect: 'エフェクト',
  prefCta: '続ける',

  permHeadline: '最後の設定です',
  permSubheadline:
    'Voxa は動画と端末の音声認識へのアクセスが必要です。クリップはオフラインのままです。',
  permPhotoTitle: '写真',
  permPhotoBody:
    '動画を読み込み、完成したクリップをカメラロールに保存します。',
  permSpeechTitle: '音声認識',
  permSpeechBody:
    '音声を端末上で直接字幕に変換します。',
  permGranted: '許可済み',
  permLimited: '制限付きアクセス',
  permDenied: 'アクセスが拒否されました',
  permRestricted: '制限されています',
  permNotDetermined: 'まだ選択されていません',
  permUnavailable: '利用できません',
  permEnable: 'アクセスを許可',
  permRequesting: 'リクエスト中...',
  permNotNow: '今はしない',
  permAllSet: '準備完了',

  procTitle: '設定しています',
  procSubtitle: '好みを反映しています...',
  procPhase1: '好みを反映しています...',
  procPhase2: '作業スペースを準備しています...',
  procPhase3: 'まもなく完了...',

  demoHeadline: '見た目を試す',
  demoSubheadline:
    'フォント、色、エフェクトを選んで、字幕スタイルをリアルタイムで確認できます。',
  demoSectionFont: 'フォント',
  demoSectionAccent: 'アクセント',
  demoSectionEffect: 'エフェクト',
  demoCta: 'このスタイルを使う',
  demoPreviewText: '字幕はこのように表示されます',

  effectClean: 'クリーン',
  effectNeon: 'ネオン',
  effectGlow: 'グロー',
  effectCinema: 'シネマ',

  valueTitle: '準備できました',
  valueBody: 'Voxa は次の作業をサポートします',
  valueItemsTitle: '設定済みの内容:',
  valueGoalFallback: 'より良い字幕を作る',
  valueItem1Label: 'すばやい字幕生成',
  valueItem1Desc: '動画を読み込むと、数秒で字幕を作成',
  valueItem2Label: 'スタイルを保存済み',
  valueItem2Desc: 'フォント、色、エフェクトの準備が完了',
  valueItem3Label: '最初からプライベート',
  valueItem3Desc: '処理は端末上で行われます',
  valueCta: '作成を始める',

  continue: '続ける',
  skip: 'スキップ',
  back: '戻る',
};

const ko: Translations = {
  welcomeEyebrow: '오프라인. 비공개. 바로.',
  welcomeTitle: '넘기기 어려운 영상을 만드는 자막',
  welcomeDescription:
    '어떤 영상이든 가져오면 1분 안에 깔끔하게 맞춰진 자막을 만들 수 있어요. 업로드 없음. 구독 없음. 휴대폰 하나로 끝.',
  welcomeCta: '시작하기',

  goalHeadline: '무엇을 개선하고 싶나요?',
  goalSubheadline:
    '지금 가장 중요한 목표를 골라주세요. Voxa가 첫 설정을 그에 맞춰 준비합니다.',
  goalViral: '시청자가 더 오래 보게 만들기',
  goalAccessible: '내용을 더 쉽게 따라오게 하기',
  goalBrand: '일관된 비주얼 스타일 만들기',
  goalFast: '외주 없이 더 빠르게 올리기',
  goalMultilingual: '다른 언어권 시청자에게도 닿기',
  goalProfessional: '영상 완성도 높이기',
  goalCta: '계속',

  painHeadline: '가장 시간을 잡아먹는 건 무엇인가요?',
  painSubheadline:
    '작업을 막는 항목을 모두 선택하세요. 첫 설정에 반영할게요.',
  painTyping: '자막을 직접 치는 데 시간이 너무 오래 걸림',
  painTools: '온라인 도구가 느리거나 불안함',
  painCost: '구독 비용이 계속 쌓임',
  painTiming: '타이밍 맞추기가 어려움',
  painStyle: '자막이 너무 평범해 보임',
  painOffline: '인터넷 없이 작업하고 싶음',
  painPrivacy: '영상을 클라우드에 올리고 싶지 않음',
  painCtaNone: '하나 이상 선택하세요',
  painCtaSome: '계속',

  socialHeadline: '크리에이터들이 자막 작업 시간을 줄이고 있어요',
  socialSubheadline:
    '한 줄씩 직접 입력하는 대신, 기기에서 바로 자막을 만들어보세요.',
  socialCta: '계속',
  socialTestimonial1Name: '마야 K.',
  socialTestimonial1Tag: '틱톡 크리에이터',
  socialTestimonial1Text:
    '예전에는 영상 하나 자막에 45분씩 걸렸어요. 이제는 1분도 안 걸리고, 네온 스타일도 제 피드랑 잘 맞아요.',
  socialTestimonial2Name: '조던 T.',
  socialTestimonial2Tag: '유튜버',
  socialTestimonial2Text:
    '원본 영상을 다른 서비스에 올리지 않고 자막을 만들고 싶었어요. Voxa는 전부 폰 안에서 처리되고 결과도 깔끔해요.',
  socialTestimonial3Name: '소피아 R.',
  socialTestimonial3Tag: '브랜드 매니저',
  socialTestimonial3Text:
    '세 브랜드의 Reels를 한꺼번에 만들고 있어요. Voxa 덕분에 자막 작업이 훨씬 빨라졌고, 제스처 편집도 자연스러워요.',

  tinderHeadline: '어떤 말이 익숙한가요?',
  tinderSubheadline: '해당되면 오른쪽으로, 넘기려면 왼쪽으로 밀어주세요.',
  tinderSkip: '넘기기',
  tinderRelate: '공감',
  tinderRemaining: '장 남음',
  tinderRemainingOne: '장 남음',
  tinderSkipRemaining: '남은 카드 넘기기',

  solutionHeadline: 'Voxa가 이렇게 도와드려요',
  solutionSubheadline:
    '선택한 답변을 바탕으로 Voxa가 아래 작업을 대신 덜어줍니다.',
  solutionSpeedPain: '자막 작업에 시간이 너무 오래 걸림',
  solutionSpeedSolution: '60초 안에 자막 생성',
  solutionSpeedStat:
    '업로드 없이 기기에서 음성 인식',
  solutionPrivacyPain: '온라인 도구가 불안함',
  solutionPrivacySolution: '영상은 휴대폰 안에 그대로',
  solutionPrivacyStat: '클라우드 처리 없음. 영상 수집 없음.',
  solutionStylePain: '자막이 너무 평범함',
  solutionStyleSolution: '깔끔한 스타일, 볼드, 네온, 글로우, 시네마 룩 선택',
  solutionStyleStat: '폰트, 색상, 효과, 위치가 모두 포함됨',
  solutionCostPain: '구독 비용이 쌓임',
  solutionCostSolution: '앱 하나로 끝. 반복 결제 없음. 워터마크 없음.',
  solutionCostStat: '핵심 도구는 처음부터 포함되어 있어요',
  solutionCta: '스타일 보기',

  prefHeadline: '자막 스타일을 선택하세요',
  prefSubheadline:
    '첫 프로젝트에 이 설정을 사용할게요. 나중에 모두 바꿀 수 있습니다.',
  prefSectionFont: '폰트',
  prefSectionColor: '강조 색상',
  prefSectionEffect: '효과',
  prefCta: '계속',

  permHeadline: '마지막 설정 단계입니다',
  permSubheadline:
    'Voxa는 영상 접근 권한과 기기 음성 인식 권한이 필요합니다. 클립은 오프라인에 남아 있어요.',
  permPhotoTitle: '사진',
  permPhotoBody:
    '영상을 가져오고 완성된 클립을 카메라 롤에 저장합니다.',
  permSpeechTitle: '음성 인식',
  permSpeechBody:
    '오디오를 기기에서 바로 자막으로 바꿉니다.',
  permGranted: '허용됨',
  permLimited: '제한된 접근',
  permDenied: '접근 거부됨',
  permRestricted: '제한됨',
  permNotDetermined: '아직 선택하지 않음',
  permUnavailable: '사용할 수 없음',
  permEnable: '접근 허용',
  permRequesting: '요청 중...',
  permNotNow: '나중에',
  permAllSet: '준비 완료',

  procTitle: '설정 중',
  procSubtitle: '선호 설정을 적용하고 있어요...',
  procPhase1: '선호 설정을 적용하고 있어요...',
  procPhase2: '작업 공간을 준비하고 있어요...',
  procPhase3: '거의 다 됐어요...',

  demoHeadline: '스타일을 시험해보세요',
  demoSubheadline:
    '폰트, 색상, 효과를 고르고 자막 스타일을 실시간으로 확인하세요.',
  demoSectionFont: '폰트',
  demoSectionAccent: '강조',
  demoSectionEffect: '효과',
  demoCta: '이 스타일 사용',
  demoPreviewText: '자막은 이렇게 보입니다',

  effectClean: '클린',
  effectNeon: '네온',
  effectGlow: '글로우',
  effectCinema: '시네마',

  valueTitle: '준비가 끝났어요',
  valueBody: 'Voxa가 도와드릴 준비가 됐습니다',
  valueItemsTitle: '준비된 항목:',
  valueGoalFallback: '더 좋은 자막 만들기',
  valueItem1Label: '빠른 자막 생성',
  valueItem1Desc: '영상을 가져오면 몇 초 안에 자막 생성',
  valueItem2Label: '스타일 저장 완료',
  valueItem2Desc: '폰트, 색상, 효과가 준비되어 있어요',
  valueItem3Label: '기본값은 비공개',
  valueItem3Desc: '처리는 기기에서 이루어집니다',
  valueCta: '만들기 시작',

  continue: '계속',
  skip: '건너뛰기',
  back: '뒤로',
};

const zh: Translations = {
  welcomeEyebrow: '离线。私密。马上生成。',
  welcomeTitle: '让观众不想划走的字幕',
  welcomeDescription:
    '导入任意视频，不到一分钟生成干净、对齐准确的字幕。无需上传。无需订阅。只用你的手机。',
  welcomeCta: '开始',

  goalHeadline: '你想先解决什么？',
  goalSubheadline:
    '选择现在最重要的一项。Voxa 会根据它设置你的初始偏好。',
  goalViral: '让观众看得更久',
  goalAccessible: '让内容更容易看懂',
  goalBrand: '建立统一的视觉风格',
  goalFast: '不用外包，更快发布',
  goalMultilingual: '触达其他语言的观众',
  goalProfessional: '让视频更有完成度',
  goalCta: '继续',

  painHeadline: '最拖慢你的是什么？',
  painSubheadline:
    '选出所有影响你流程的内容。Voxa 会在首次设置里考虑这些。',
  painTyping: '手打字幕太耗时间',
  painTools: '在线工具慢，或让人不放心',
  painCost: '订阅费用越攒越多',
  painTiming: '时间轴很难对准',
  painStyle: '字幕看起来太普通',
  painOffline: '我需要离线工作',
  painPrivacy: '不想把视频传到云端',
  painCtaNone: '请至少选择一项',
  painCtaSome: '继续',

  socialHeadline: '创作者已经在字幕上节省时间',
  socialSubheadline:
    '不用一行行手打，直接在设备上生成字幕。',
  socialCta: '继续',
  socialTestimonial1Name: 'Maya K.',
  socialTestimonial1Tag: 'TikTok 创作者',
  socialTestimonial1Text:
    '以前每条视频做字幕都要花四五十分钟。现在不到一分钟就能完成，霓虹样式也很适合我的账号。',
  socialTestimonial2Name: 'Jordan T.',
  socialTestimonial2Tag: 'YouTuber',
  socialTestimonial2Text:
    '我想做字幕，但不想把原片传到别的服务。Voxa 全部在手机上处理，效果也很干净。',
  socialTestimonial3Name: 'Sofia R.',
  socialTestimonial3Tag: '品牌经理',
  socialTestimonial3Text:
    '我们会批量给三个品牌做 Reels。Voxa 让字幕流程快了很多，手势编辑也很顺手。',

  tinderHeadline: '哪些情况你也遇到过？',
  tinderSubheadline: '符合就向右滑。想跳过就向左滑。',
  tinderSkip: '跳过',
  tinderRelate: '有同感',
  tinderRemaining: '张剩余',
  tinderRemainingOne: '张剩余',
  tinderSkipRemaining: '跳过剩余',

  solutionHeadline: 'Voxa 可以这样帮你',
  solutionSubheadline:
    '根据你的选择，Voxa 会帮你处理这些部分。',
  solutionSpeedPain: '字幕制作太花时间',
  solutionSpeedSolution: '60 秒内生成字幕',
  solutionSpeedStat:
    '设备端语音识别，无需上传',
  solutionPrivacyPain: '在线工具让人不放心',
  solutionPrivacySolution: '你的视频留在手机里',
  solutionPrivacyStat: '不做云端处理。不收集视频。',
  solutionStylePain: '字幕太普通',
  solutionStyleSolution: '可选干净、醒目、霓虹、发光或电影感样式',
  solutionStyleStat: '内置字体、颜色、效果和位置',
  solutionCostPain: '订阅费用越攒越多',
  solutionCostSolution: '一个 App。无周期扣费。无水印。',
  solutionCostStat: '核心工具从一开始就可用',
  solutionCta: '看看样式',

  prefHeadline: '选择你的字幕风格',
  prefSubheadline:
    '第一个项目会使用这些初始设置。之后你可以随时修改。',
  prefSectionFont: '字体',
  prefSectionColor: '强调色',
  prefSectionEffect: '效果',
  prefCta: '继续',

  permHeadline: '最后一步设置',
  permSubheadline:
    'Voxa 需要访问你的视频和设备语音识别。你的片段会保持离线。',
  permPhotoTitle: '照片',
  permPhotoBody:
    '导入视频，并把完成的片段保存回相册。',
  permSpeechTitle: '语音识别',
  permSpeechBody:
    '直接在设备上把音频转换成字幕。',
  permGranted: '已允许',
  permLimited: '访问受限',
  permDenied: '访问被拒绝',
  permRestricted: '已受限制',
  permNotDetermined: '尚未选择',
  permUnavailable: '不可用',
  permEnable: '允许访问',
  permRequesting: '正在请求...',
  permNotNow: '暂时不要',
  permAllSet: '准备好了',

  procTitle: '正在设置',
  procSubtitle: '正在应用你的偏好...',
  procPhase1: '正在应用你的偏好...',
  procPhase2: '正在准备工作区...',
  procPhase3: '马上就好...',

  demoHeadline: '试试效果',
  demoSubheadline:
    '选择字体、颜色和效果，实时预览你的字幕风格。',
  demoSectionFont: '字体',
  demoSectionAccent: '强调',
  demoSectionEffect: '效果',
  demoCta: '使用这个风格',
  demoPreviewText: '你的字幕会像这样显示',

  effectClean: '干净',
  effectNeon: '霓虹',
  effectGlow: '发光',
  effectCinema: '电影感',

  valueTitle: '已准备好',
  valueBody: 'Voxa 已准备好帮你',
  valueItemsTitle: '已完成设置:',
  valueGoalFallback: '制作更好的字幕',
  valueItem1Label: '快速生成字幕',
  valueItem1Desc: '导入视频，几秒内得到字幕',
  valueItem2Label: '你的风格已保存',
  valueItem2Desc: '字体、颜色和效果已准备好',
  valueItem3Label: '默认私密',
  valueItem3Desc: '处理会在你的设备上完成',
  valueCta: '开始创作',

  continue: '继续',
  skip: '跳过',
  back: '返回',
};

const ar: Translations = {
  welcomeEyebrow: 'بلا إنترنت. خاص. فوري.',
  welcomeTitle: 'ترجمات تخلي مقاطعك أصعب في التجاوز',
  welcomeDescription:
    'استورد أي فيديو واحصل على ترجمة نظيفة ومضبوطة في أقل من دقيقة. بدون رفع. بدون اشتراك. من هاتفك فقط.',
  welcomeCta: 'ابدأ',

  goalHeadline: 'ما الذي تريد تحسينه؟',
  goalSubheadline:
    'اختر الشيء الأهم الآن. سيضبط Voxa الإعدادات الأولى بناءً عليه.',
  goalViral: 'إبقاء المشاهدين مدة أطول',
  goalAccessible: 'جعل المحتوى أسهل في المتابعة',
  goalBrand: 'بناء أسلوب بصري ثابت',
  goalFast: 'النشر أسرع بدون الاستعانة بأحد',
  goalMultilingual: 'الوصول إلى جمهور بلغات أخرى',
  goalProfessional: 'إظهار المقاطع بشكل أكثر احترافية',
  goalCta: 'متابعة',

  painHeadline: 'ما أكثر شيء يبطئك؟',
  painSubheadline:
    'اختر كل ما يعطل سير عملك. سيأخذ Voxa ذلك في الحسبان عند الإعداد الأول.',
  painTyping: 'كتابة الترجمة يدويًا تأخذ وقتًا طويلًا',
  painTools: 'الأدوات أونلاين بطيئة أو غير مريحة',
  painCost: 'الاشتراكات تتراكم',
  painTiming: 'ضبط التوقيت بدقة صعب',
  painStyle: 'الترجمة تبدو عادية جدًا',
  painOffline: 'أحتاج إلى العمل بدون إنترنت',
  painPrivacy: 'لا أريد رفع الفيديو إلى السحابة',
  painCtaNone: 'اختر خيارًا واحدًا على الأقل',
  painCtaSome: 'متابعة',

  socialHeadline: 'صنّاع المحتوى يوفرون ساعات في إعداد الترجمات',
  socialSubheadline:
    'استخدم الترجمة على الجهاز بدل كتابة كل سطر يدويًا.',
  socialCta: 'متابعة',
  socialTestimonial1Name: 'مايا ك.',
  socialTestimonial1Tag: 'صانعة محتوى على TikTok',
  socialTestimonial1Text:
    'كنت أقضي قرابة ساعة على ترجمة كل فيديو. الآن أنتهي في أقل من دقيقة، وستايل النيون مناسب جدًا لحسابي.',
  socialTestimonial2Name: 'جوردان ت.',
  socialTestimonial2Tag: 'يوتيوبر',
  socialTestimonial2Text:
    'كنت أريد ترجمة بدون رفع الفيديو الخام إلى خدمة أخرى. مع Voxa يبقى كل شيء على الهاتف والنتيجة مرتبة.',
  socialTestimonial3Name: 'صوفيا ر.',
  socialTestimonial3Tag: 'مديرة علامة تجارية',
  socialTestimonial3Text:
    'نجهز Reels لثلاث علامات تجارية دفعة واحدة. Voxa سرّع مرحلة الترجمة كثيرًا، والتحرير بالإيماءات يبدو طبيعيًا.',

  tinderHeadline: 'أي العبارات تشبه تجربتك؟',
  tinderSubheadline: 'اسحب يمينًا إذا كانت مناسبة. ويسارًا للتخطي.',
  tinderSkip: 'تخطي',
  tinderRelate: 'يناسبني',
  tinderRemaining: 'بطاقات متبقية',
  tinderRemainingOne: 'بطاقة متبقية',
  tinderSkipRemaining: 'تخطي الباقي',

  solutionHeadline: 'كيف يساعدك Voxa',
  solutionSubheadline:
    'بناءً على اختياراتك، هذه هي الأجزاء التي يمكن أن يتولاها Voxa عنك.',
  solutionSpeedPain: 'إضافة الترجمة تستغرق وقتًا طويلًا',
  solutionSpeedSolution: 'أنشئ ترجمات في أقل من 60 ثانية',
  solutionSpeedStat:
    'تعرف صوتي على الجهاز، بدون رفع',
  solutionPrivacyPain: 'الأدوات أونلاين لا تطمئنني',
  solutionPrivacySolution: 'فيديوهاتك تبقى على هاتفك',
  solutionPrivacyStat: 'لا معالجة سحابية. لا جمع للفيديوهات.',
  solutionStylePain: 'الترجمة تبدو عادية',
  solutionStyleSolution: 'اختر أسلوبًا نظيفًا، بارزًا، نيون، توهج، أو سينمائيًا',
  solutionStyleStat: 'خطوط وألوان وتأثيرات ومواضع جاهزة',
  solutionCostPain: 'الاشتراكات تتراكم',
  solutionCostSolution: 'تطبيق واحد. بدون رسوم متكررة. بدون علامة مائية.',
  solutionCostStat: 'الأدوات الأساسية متاحة من البداية',
  solutionCta: 'عرض الأساليب',

  prefHeadline: 'اختر أسلوب الترجمة',
  prefSubheadline:
    'ستُستخدم هذه الإعدادات في أول مشروع. يمكنك تعديل كل شيء لاحقًا.',
  prefSectionFont: 'الخط',
  prefSectionColor: 'لون التمييز',
  prefSectionEffect: 'التأثير',
  prefCta: 'متابعة',

  permHeadline: 'خطوة إعداد أخيرة',
  permSubheadline:
    'يحتاج Voxa إلى الوصول إلى الفيديوهات والتعرف الصوتي على الجهاز. مقاطعك تبقى أوفلاين.',
  permPhotoTitle: 'الصور',
  permPhotoBody:
    'استيراد الفيديوهات وحفظ المقاطع النهائية في ألبوم الكاميرا.',
  permSpeechTitle: 'التعرف على الكلام',
  permSpeechBody:
    'تحويل الصوت إلى ترجمة مباشرة على جهازك.',
  permGranted: 'مسموح',
  permLimited: 'وصول محدود',
  permDenied: 'تم رفض الوصول',
  permRestricted: 'مقيّد',
  permNotDetermined: 'لم يتم الاختيار بعد',
  permUnavailable: 'غير متاح',
  permEnable: 'السماح بالوصول',
  permRequesting: 'جارٍ الطلب...',
  permNotNow: 'ليس الآن',
  permAllSet: 'جاهز',

  procTitle: 'جارٍ الإعداد',
  procSubtitle: 'يتم تطبيق تفضيلاتك...',
  procPhase1: 'يتم تطبيق تفضيلاتك...',
  procPhase2: 'يتم تجهيز مساحة العمل...',
  procPhase3: 'اقتربنا...',

  demoHeadline: 'جرّب الشكل',
  demoSubheadline:
    'اختر الخط واللون والتأثير، وشاهد أسلوب الترجمة مباشرة.',
  demoSectionFont: 'الخط',
  demoSectionAccent: 'التمييز',
  demoSectionEffect: 'التأثير',
  demoCta: 'استخدام هذا الأسلوب',
  demoPreviewText: 'ستظهر ترجمتك بهذا الشكل',

  effectClean: 'نظيف',
  effectNeon: 'نيون',
  effectGlow: 'توهج',
  effectCinema: 'سينمائي',

  valueTitle: 'كل شيء جاهز',
  valueBody: 'Voxa جاهز لمساعدتك على',
  valueItemsTitle: 'تم تجهيز:',
  valueGoalFallback: 'إنشاء ترجمات أفضل',
  valueItem1Label: 'ترجمة سريعة',
  valueItem1Desc: 'استورد فيديو واحصل على ترجمة خلال ثوانٍ',
  valueItem2Label: 'تم حفظ أسلوبك',
  valueItem2Desc: 'الخط واللون والتأثير جاهزون',
  valueItem3Label: 'خاص بشكل افتراضي',
  valueItem3Desc: 'المعالجة تتم على جهازك',
  valueCta: 'ابدأ الإنشاء',

  continue: 'متابعة',
  skip: 'تخطي',
  back: 'رجوع',
};

export const translations: Record<SupportedLocale, Translations> = {
  en,
  es,
  pt,
  fr,
  de,
  it,
  ru,
  ja,
  ko,
  zh,
  ar,
};

export function resolveLocale(raw: string): SupportedLocale {
  const base = raw.split('-')[0].toLowerCase();
  if (supportedLocales.includes(base as SupportedLocale)) {
    return base as SupportedLocale;
  }
  return 'en';
}
