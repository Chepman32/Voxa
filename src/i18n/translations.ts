export type SupportedLocale =
  | 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar';

export const supportedLocales: SupportedLocale[] = [
  'en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'ja', 'ko', 'zh', 'ar',
];

export interface Translations {
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
    'Import any video. Get perfectly timed, cinematic captions in under a minute. No uploads. No subscriptions. Just your phone.',
  welcomeCta: 'Get Started',

  goalHeadline: 'What are you trying to achieve?',
  goalSubheadline:
    'Pick the one that matters most right now. We will tailor your experience around it.',
  goalViral: 'Go viral with better retention',
  goalAccessible: 'Make content accessible',
  goalBrand: 'Build a consistent brand look',
  goalFast: 'Post faster without outsourcing',
  goalMultilingual: 'Reach non-English audiences',
  goalProfessional: 'Look more professional',
  goalCta: 'Continue',

  painHeadline: 'What slows you down most?',
  painSubheadline:
    'Select everything that frustrates you. We have been there too.',
  painTyping: 'Typing captions takes forever',
  painTools: 'Online tools feel sketchy or slow',
  painCost: 'Subscription fees add up fast',
  painTiming: 'Timing never lines up perfectly',
  painStyle: 'Captions look boring and generic',
  painOffline: 'I need to work without internet',
  painPrivacy: 'I do not want my footage in the cloud',
  painCtaNone: 'Select at least one',
  painCtaSome: 'Continue',

  socialHeadline: 'Creators like you are already saving hours',
  socialSubheadline:
    'Join thousands who ditched manual captioning for good.',
  socialCta: 'Continue',

  tinderHeadline: 'Which statements do you relate to?',
  tinderSubheadline: 'Swipe right if it resonates. Swipe left to skip.',
  tinderSkip: 'Skip',
  tinderRelate: 'Relate',
  tinderRemaining: 'more cards',
  tinderRemainingOne: 'more card',
  tinderSkipRemaining: 'Skip remaining',

  solutionHeadline: 'Here is how Voxa fixes that',
  solutionSubheadline:
    'You told us what frustrates you. Here is exactly what changes.',
  solutionSpeedPain: 'Captioning takes forever',
  solutionSpeedSolution: 'Auto-generate subtitles in under 60 seconds',
  solutionSpeedStat:
    'On-device speech recognition — no waiting, no uploading',
  solutionPrivacyPain: 'I do not trust online tools',
  solutionPrivacySolution: '100% offline. Your footage never leaves your phone',
  solutionPrivacyStat: 'Zero cloud processing. Zero data collection.',
  solutionStylePain: 'My captions look boring',
  solutionStyleSolution: 'Cinematic styles: neon, glow, chrome, and more',
  solutionStyleStat: '7 fonts, 5 colors, 5 effects, 3 positions',
  solutionCostPain: 'Subscriptions add up',
  solutionCostSolution: 'One app. No recurring fees. No watermarks.',
  solutionCostStat: 'Full feature set included — no premium tier gates',
  solutionCta: 'Show me the styles',

  prefHeadline: 'Pick your signature look',
  prefSubheadline:
    'These are the defaults we will use for your first project. You can change them anytime.',
  prefSectionFont: 'Font',
  prefSectionColor: 'Accent Color',
  prefSectionEffect: 'Effect',
  prefCta: 'Continue',

  permHeadline: 'One last thing before we begin',
  permSubheadline:
    'Voxa needs two permissions to work its magic. Everything stays offline.',
  permPhotoTitle: 'Photo Library',
  permPhotoBody:
    'To import your videos and save finished clips back to your camera roll.',
  permSpeechTitle: 'Speech Recognition',
  permSpeechBody:
    'To transcribe audio into subtitles directly on your device. No cloud involved.',
  permGranted: 'Granted',
  permEnable: 'Enable Access',
  permRequesting: 'Requesting...',
  permNotNow: 'Not now',
  permAllSet: 'All set',

  procTitle: 'Setting things up',
  procSubtitle: 'Analyzing your preferences...',
  procPhase1: 'Analyzing your preferences...',
  procPhase2: 'Preparing your workspace...',
  procPhase3: 'Almost there...',

  demoHeadline: 'Try it now',
  demoSubheadline:
    'Pick a font, color, and effect. See your style come alive in real time.',
  demoSectionFont: 'Font',
  demoSectionAccent: 'Accent',
  demoSectionEffect: 'Effect',
  demoCta: 'I love this look',
  demoPreviewText: 'This is how your captions will look',

  effectClean: 'Clean',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Cinema',

  valueTitle: 'You are all set',
  valueBody: 'We have customized Voxa to help you',
  valueItemsTitle: "What's ready for you:",
  valueGoalFallback: 'Create amazing subtitles',
  valueItem1Label: 'One-tap subtitle generation',
  valueItem1Desc: 'Import a video and get captions in seconds',
  valueItem2Label: 'Your signature style saved',
  valueItem2Desc: 'Default font, color, and effect pre-selected',
  valueItem3Label: 'Private by default',
  valueItem3Desc: 'Everything processed on your device',
  valueCta: 'Start Creating',

  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',
};

const es: Translations = {
  welcomeEyebrow: 'Sin conexion. Privado. Al instante.',
  welcomeTitle: 'Subtitulos que hacen que nadie pueda dejar de ver tus clips',
  welcomeDescription:
    'Importa cualquier video. Consigue subtitulos cinematicos perfectamente sincronizados en menos de un minuto. Sin subidas. Sin suscripciones. Solo tu telefono.',
  welcomeCta: 'Empezar',

  goalHeadline: 'Que quieres lograr?',
  goalSubheadline:
    'Elige lo que mas te importa ahora. Adaptaremos tu experiencia a ello.',
  goalViral: 'Viralizar con mejor retencion',
  goalAccessible: 'Hacer el contenido accesible',
  goalBrand: 'Construir una imagen de marca solida',
  goalFast: 'Publicar mas rapido sin externalizar',
  goalMultilingual: 'Llegar a audiencias no hispanas',
  goalProfessional: 'Lucir mas profesional',
  goalCta: 'Continuar',

  painHeadline: 'Que te frena mas?',
  painSubheadline:
    'Selecciona todo lo que te frustra. Nosotros tambien lo hemos pasado.',
  painTyping: 'Escribir subtitulos me lleva una eternidad',
  painTools: 'Las herramientas online parecen inseguras o lentas',
  painCost: 'Las suscripciones se acumulan rapido',
  painTiming: 'La sincronizacion nunca queda bien',
  painStyle: 'Los subtitulos se ven aburridos y genericos',
  painOffline: 'Necesito trabajar sin internet',
  painPrivacy: 'No quiero mis videos en la nube',
  painCtaNone: 'Selecciona al menos una',
  painCtaSome: 'Continuar',

  socialHeadline: 'Creadores como tu ya ahorran horas',
  socialSubheadline:
    'Unete a miles que dejaron los subtitulos manuales para siempre.',
  socialCta: 'Continuar',

  tinderHeadline: 'Con cuales te identificas?',
  tinderSubheadline: 'Desliza a la derecha si te representa. A la izquierda para saltar.',
  tinderSkip: 'Saltar',
  tinderRelate: 'Identifico',
  tinderRemaining: 'tarjetas mas',
  tinderRemainingOne: 'tarjeta mas',
  tinderSkipRemaining: 'Saltar restantes',

  solutionHeadline: 'Asi es como Voxa lo soluciona',
  solutionSubheadline:
    'Nos contaste que te frustra. Esto es exactamente lo que cambia.',
  solutionSpeedPain: 'Los subtitulos tardan una eternidad',
  solutionSpeedSolution: 'Genera subtitulos automaticamente en menos de 60 segundos',
  solutionSpeedStat:
    'Reconocimiento de voz en el dispositivo — sin esperas ni subidas',
  solutionPrivacyPain: 'No confio en las herramientas online',
  solutionPrivacySolution: '100% offline. Tus videos nunca salen de tu telefono',
  solutionPrivacyStat: 'Cero procesamiento en la nube. Cero recoleccion de datos.',
  solutionStylePain: 'Mis subtitulos se ven aburridos',
  solutionStyleSolution: 'Estilos cinematicos: neon, brillo, cromado y mas',
  solutionStyleStat: '7 fuentes, 5 colores, 5 efectos, 3 posiciones',
  solutionCostPain: 'Las suscripciones se acumulan',
  solutionCostSolution: 'Una app. Sin cuotas recurrentes. Sin marcas de agua.',
  solutionCostStat: 'Todas las funciones incluidas — sin planes premium',
  solutionCta: 'Muestrame los estilos',

  prefHeadline: 'Elige tu estilo caracteristico',
  prefSubheadline:
    'Estos seran los valores predeterminados para tu primer proyecto. Puedes cambiarlos cuando quieras.',
  prefSectionFont: 'Fuente',
  prefSectionColor: 'Color de acento',
  prefSectionEffect: 'Efecto',
  prefCta: 'Continuar',

  permHeadline: 'Una ultima cosa antes de empezar',
  permSubheadline:
    'Voxa necesita dos permisos para funcionar. Todo se mantiene offline.',
  permPhotoTitle: 'Biblioteca de fotos',
  permPhotoBody:
    'Para importar tus videos y guardar los clips terminados en tu carrete.',
  permSpeechTitle: 'Reconocimiento de voz',
  permSpeechBody:
    'Para transcribir el audio a subtitulos directamente en tu dispositivo. Sin nube.',
  permGranted: 'Permitido',
  permEnable: 'Activar acceso',
  permRequesting: 'Solicitando...',
  permNotNow: 'Ahora no',
  permAllSet: 'Todo listo',

  procTitle: 'Preparando todo',
  procSubtitle: 'Analizando tus preferencias...',
  procPhase1: 'Analizando tus preferencias...',
  procPhase2: 'Preparando tu espacio de trabajo...',
  procPhase3: 'Casi listo...',

  demoHeadline: 'Pruebalo ahora',
  demoSubheadline:
    'Elige una fuente, color y efecto. Ve tu estilo cobrar vida en tiempo real.',
  demoSectionFont: 'Fuente',
  demoSectionAccent: 'Acento',
  demoSectionEffect: 'Efecto',
  demoCta: 'Me encanta este look',
  demoPreviewText: 'Asi se veran tus subtitulos',

  effectClean: 'Limpio',
  effectNeon: 'Neon',
  effectGlow: 'Brillo',
  effectCinema: 'Cine',

  valueTitle: 'Todo listo',
  valueBody: 'Hemos personalizado Voxa para ayudarte a',
  valueItemsTitle: 'Lo que tienes listo:',
  valueGoalFallback: 'Crear subtitulos increibles',
  valueItem1Label: 'Generacion de subtitulos con un toque',
  valueItem1Desc: 'Importa un video y obten subtitulos en segundos',
  valueItem2Label: 'Tu estilo guardado',
  valueItem2Desc: 'Fuente, color y efecto predeterminados preseleccionados',
  valueItem3Label: 'Privado por defecto',
  valueItem3Desc: 'Todo se procesa en tu dispositivo',
  valueCta: 'Empezar a crear',

  continue: 'Continuar',
  skip: 'Saltar',
  back: 'Atras',
};

const pt: Translations = {
  welcomeEyebrow: 'Offline. Privado. Instantaneo.',
  welcomeTitle: 'Legendas que fazem seus clips serem impossiveis de ignorar',
  welcomeDescription:
    'Importe qualquer video. Obtenha legendas cinematicas perfeitamente sincronizadas em menos de um minuto. Sem uploads. Sem assinaturas. Apenas o seu celular.',
  welcomeCta: 'Comecar',

  goalHeadline: 'O que voce quer alcancar?',
  goalSubheadline:
    'Escolha o que mais importa agora. Vamos adaptar sua experiencia para isso.',
  goalViral: 'Viralizar com melhor retencao',
  goalAccessible: 'Tornar o conteudo acessivel',
  goalBrand: 'Construir uma identidade visual consistente',
  goalFast: 'Postar mais rapido sem terceirizar',
  goalMultilingual: 'Alcancar audiencias nao portuguesas',
  goalProfessional: 'Parecer mais profissional',
  goalCta: 'Continuar',

  painHeadline: 'O que mais te atrasa?',
  painSubheadline:
    'Selecione tudo que te frustra. A gente tambem ja passou por isso.',
  painTyping: 'Digitar legendas leva uma eternidade',
  painTools: 'Ferramentas online parecem inseguras ou lentas',
  painCost: 'Assinaturas acumulam rapido demais',
  painTiming: 'A sincronizacao nunca fica perfeita',
  painStyle: 'As legendas parecem sem graca e genericas',
  painOffline: 'Preciso trabalhar sem internet',
  painPrivacy: 'Nao quero meus videos na nuvem',
  painCtaNone: 'Selecione pelo menos uma',
  painCtaSome: 'Continuar',

  socialHeadline: 'Criadores como voce ja economizam horas',
  socialSubheadline:
    'Junte-se a milhares que abandonaram as legendas manuais de vez.',
  socialCta: 'Continuar',

  tinderHeadline: 'Com quais voce se identifica?',
  tinderSubheadline:
    'Deslize para a direita se representa. Para a esquerda para pular.',
  tinderSkip: 'Pular',
  tinderRelate: 'Identifico',
  tinderRemaining: 'cartoes restantes',
  tinderRemainingOne: 'cartao restante',
  tinderSkipRemaining: 'Pular restantes',

  solutionHeadline: 'E assim que o Voxa resolve isso',
  solutionSubheadline:
    'Voce nos contou o que te frustra. Isso e exatamente o que muda.',
  solutionSpeedPain: 'Legendas demoram uma eternidade',
  solutionSpeedSolution: 'Gere legendas automaticamente em menos de 60 segundos',
  solutionSpeedStat:
    'Reconhecimento de voz no dispositivo — sem esperas nem uploads',
  solutionPrivacyPain: 'Nao confio em ferramentas online',
  solutionPrivacySolution: '100% offline. Seus videos nunca saem do seu celular',
  solutionPrivacyStat: 'Zero processamento na nuvem. Zero coleta de dados.',
  solutionStylePain: 'Minhas legendas parecem sem graca',
  solutionStyleSolution: 'Estilos cinematograficos: neon, brilho, cromado e mais',
  solutionStyleStat: '7 fontes, 5 cores, 5 efeitos, 3 posicoes',
  solutionCostPain: 'Assinaturas acumulam',
  solutionCostSolution: 'Um app. Sem taxas recorrentes. Sem marcas d agua.',
  solutionCostStat: 'Todas as funcoes inclusas — sem planos premium',
  solutionCta: 'Me mostre os estilos',

  prefHeadline: 'Escolha o seu visual caracteristico',
  prefSubheadline:
    'Esses serao os padroes do seu primeiro projeto. Voce pode mudar quando quiser.',
  prefSectionFont: 'Fonte',
  prefSectionColor: 'Cor de destaque',
  prefSectionEffect: 'Efeito',
  prefCta: 'Continuar',

  permHeadline: 'Uma ultima coisa antes de comecarmos',
  permSubheadline:
    'O Voxa precisa de duas permissoes para funcionar. Tudo fica offline.',
  permPhotoTitle: 'Biblioteca de fotos',
  permPhotoBody:
    'Para importar seus videos e salvar os clips prontos no seu rolo de camera.',
  permSpeechTitle: 'Reconhecimento de voz',
  permSpeechBody:
    'Para transcrever o audio em legendas diretamente no seu dispositivo. Sem nuvem.',
  permGranted: 'Permitido',
  permEnable: 'Ativar acesso',
  permRequesting: 'Solicitando...',
  permNotNow: 'Agora nao',
  permAllSet: 'Tudo certo',

  procTitle: 'Preparando tudo',
  procSubtitle: 'Analisando suas preferencias...',
  procPhase1: 'Analisando suas preferencias...',
  procPhase2: 'Preparando seu espaco de trabalho...',
  procPhase3: 'Quase la...',

  demoHeadline: 'Experimente agora',
  demoSubheadline:
    'Escolha uma fonte, cor e efeito. Veja seu estilo ganhar vida em tempo real.',
  demoSectionFont: 'Fonte',
  demoSectionAccent: 'Destaque',
  demoSectionEffect: 'Efeito',
  demoCta: 'Adoro esse visual',
  demoPreviewText: 'Assim suas legendas vao ficar',

  effectClean: 'Limpo',
  effectNeon: 'Neon',
  effectGlow: 'Brilho',
  effectCinema: 'Cinema',

  valueTitle: 'Tudo pronto',
  valueBody: 'Personalizamos o Voxa para ajudar voce a',
  valueItemsTitle: 'O que esta pronto para voce:',
  valueGoalFallback: 'Criar legendas incriveis',
  valueItem1Label: 'Geracao de legendas com um toque',
  valueItem1Desc: 'Importe um video e obtenha legendas em segundos',
  valueItem2Label: 'Seu estilo salvo',
  valueItem2Desc: 'Fonte, cor e efeito padrao pre-selecionados',
  valueItem3Label: 'Privado por padrao',
  valueItem3Desc: 'Tudo processado no seu dispositivo',
  valueCta: 'Comecar a criar',

  continue: 'Continuar',
  skip: 'Pular',
  back: 'Voltar',
};

const fr: Translations = {
  welcomeEyebrow: 'Hors ligne. Prive. Instantane.',
  welcomeTitle: 'Des sous-titres qui rendent tes clips irresistibles',
  welcomeDescription:
    "Importe n'importe quelle video. Obtiens des legendes cinematographiques parfaitement synchronisees en moins d'une minute. Pas d'upload. Pas d'abonnement. Juste ton telephone.",
  welcomeCta: 'Commencer',

  goalHeadline: "Qu'est-ce que tu veux accomplir ?",
  goalSubheadline:
    "Choisis ce qui compte le plus pour toi maintenant. On adaptera ton experience.",
  goalViral: 'Devenir viral avec une meilleure retention',
  goalAccessible: 'Rendre mon contenu accessible',
  goalBrand: 'Construire une identite visuelle coherente',
  goalFast: 'Publier plus vite sans externaliser',
  goalMultilingual: 'Toucher des audiences non francophones',
  goalProfessional: "Avoir l'air plus pro",
  goalCta: 'Continuer',

  painHeadline: "Qu'est-ce qui te ralentit le plus ?",
  painSubheadline:
    "Selectionne tout ce qui t'frustre. On a tous connu ca.",
  painTyping: 'Taper les sous-titres prend une eternite',
  painTools: "Les outils en ligne ont l'air chelous ou sont lents",
  painCost: "Les abonnements s'accumulent trop vite",
  painTiming: 'Le timing est jamais parfait',
  painStyle: 'Les sous-titres ont l air basiques et generiques',
  painOffline: "J'ai besoin de bosser sans internet",
  painPrivacy: 'J veux pas mes videos dans le cloud',
  painCtaNone: 'Selectionne au moins un',
  painCtaSome: 'Continuer',

  socialHeadline: 'Des createurs comme toi economisent deja des heures',
  socialSubheadline:
    "Rejoins les milliers qui ont definitivement lache les sous-titres manuels.",
  socialCta: 'Continuer',

  tinderHeadline: 'Avec lesquels tu te reconnais ?',
  tinderSubheadline: "Swipe a droite si ca te parle. A gauche pour passer.",
  tinderSkip: 'Passer',
  tinderRelate: 'Ca me parle',
  tinderRemaining: 'cartes restantes',
  tinderRemainingOne: 'carte restante',
  tinderSkipRemaining: 'Passer le reste',

  solutionHeadline: 'Voici comment Voxa regle ca',
  solutionSubheadline:
    "Tu nous as dit ce qui t'frustre. Voici exactement ce qui change.",
  solutionSpeedPain: 'Les sous-titres prennent une eternite',
  solutionSpeedSolution:
    'Genere automatiquement les sous-titres en moins de 60 secondes',
  solutionSpeedStat:
    "Reconnaissance vocale sur l'appareil — pas d'attente, pas d'upload",
  solutionPrivacyPain: "J'ai pas confiance dans les outils en ligne",
  solutionPrivacySolution:
    '100% hors ligne. Tes videos quittent jamais ton telephone',
  solutionPrivacyStat: 'Zero traitement cloud. Zero collecte de donnees.',
  solutionStylePain: 'Mes sous-titres ont l air fades',
  solutionStyleSolution: 'Styles cinematographiques : neon, lueur, chrome et plus',
  solutionStyleStat: '7 polices, 5 couleurs, 5 effets, 3 positions',
  solutionCostPain: "Les abonnements s'accumulent",
  solutionCostSolution: 'Une seule app. Pas de frais recurrents. Pas de watermark.',
  solutionCostStat: 'Toutes les fonctions incluses — pas de barrieres premium',
  solutionCta: 'Montre-moi les styles',

  prefHeadline: 'Choisis ton style signature',
  prefSubheadline:
    "Ce seront les parametres par defaut pour ton premier projet. Tu peux changer quand tu veux.",
  prefSectionFont: 'Police',
  prefSectionColor: "Couleur d'accent",
  prefSectionEffect: 'Effet',
  prefCta: 'Continuer',

  permHeadline: 'Une derniere chose avant de commencer',
  permSubheadline:
    "Voxa a besoin de deux permissions pour fonctionner. Tout reste hors ligne.",
  permPhotoTitle: 'Bibliotheque de photos',
  permPhotoBody:
    "Pour importer tes videos et sauvegarder les clips finis dans ton pellicule.",
  permSpeechTitle: 'Reconnaissance vocale',
  permSpeechBody:
    "Pour transcrire l'audio en sous-titres directement sur ton appareil. Pas de cloud.",
  permGranted: 'Autorise',
  permEnable: "Activer l'acces",
  permRequesting: 'Demande en cours...',
  permNotNow: 'Pas maintenant',
  permAllSet: 'Tout bon',

  procTitle: 'Preparation en cours',
  procSubtitle: 'Analyse de tes preferences...',
  procPhase1: 'Analyse de tes preferences...',
  procPhase2: 'Preparation de ton espace...',
  procPhase3: 'Presque fini...',

  demoHeadline: 'Essaie maintenant',
  demoSubheadline:
    "Choisis une police, une couleur et un effet. Regarde ton style prendre vie en temps reel.",
  demoSectionFont: 'Police',
  demoSectionAccent: 'Accent',
  demoSectionEffect: 'Effet',
  demoCta: "J'adore ce look",
  demoPreviewText: 'Voici comment tes sous-titres vont rendre',

  effectClean: 'Net',
  effectNeon: 'Neon',
  effectGlow: 'Lueur',
  effectCinema: 'Cinema',

  valueTitle: 'Tout est pret',
  valueBody: 'On a personnalise Voxa pour t aider a',
  valueItemsTitle: 'Ce qui t attend :',
  valueGoalFallback: 'Creer des sous-titres incroyables',
  valueItem1Label: 'Generation de sous-titres en un geste',
  valueItem1Desc: 'Importe une video et obtiens des sous-titres en quelques secondes',
  valueItem2Label: 'Ton style enregistre',
  valueItem2Desc: 'Police, couleur et effet par defaut pre-selectionnes',
  valueItem3Label: 'Prive par defaut',
  valueItem3Desc: 'Tout est traite sur ton appareil',
  valueCta: 'Commencer a creer',

  continue: 'Continuer',
  skip: 'Passer',
  back: 'Retour',
};

const de: Translations = {
  welcomeEyebrow: 'Offline. Privat. Sofort.',
  welcomeTitle: 'Untertitel, die deine Clips unwiderstehlich machen',
  welcomeDescription:
    'Importiere jedes Video. Erhalte perfekt getimte, filmische Untertitel in unter einer Minute. Keine Uploads. Keine Abos. Nur dein Handy.',
  welcomeCta: 'Loslegen',

  goalHeadline: 'Was mochtest du erreichen?',
  goalSubheadline:
    'Waehle das, was dir gerade am wichtigsten ist. Wir passen deine Erfahrung daran an.',
  goalViral: 'Viral gehen mit besserer Retention',
  goalAccessible: 'Inhalte barrierefrei machen',
  goalBrand: 'Ein konsistentes Markenbild aufbauen',
  goalFast: 'Schneller posten ohne Outsourcing',
  goalMultilingual: 'Nicht-deutsche Zielgruppen erreichen',
  goalProfessional: 'Professioneller wirken',
  goalCta: 'Weiter',

  painHeadline: 'Was bremst dich am meisten aus?',
  painSubheadline:
    'Waehle alles, was dich frustriert. Wir kennen das auch.',
  painTyping: 'Untertitel tippen dauert ewig',
  painTools: 'Online-Tools wirken unserioes oder sind langsam',
  painCost: 'Abos summieren sich schnell',
  painTiming: 'Das Timing stimmt nie perfekt',
  painStyle: 'Untertitel wirken langweilig und austauschbar',
  painOffline: 'Ich muss offline arbeiten koennen',
  painPrivacy: 'Ich will mein Material nicht in der Cloud',
  painCtaNone: 'Waehle mindestens eins aus',
  painCtaSome: 'Weiter',

  socialHeadline: 'Creator wie du sparen schon Stunden',
  socialSubheadline:
    'Schliesse dich Tausenden an, die manuelle Untertitel endgueltig hinter sich gelassen haben.',
  socialCta: 'Weiter',

  tinderHeadline: 'Mit welchen Aussagen kannst du dich identifizieren?',
  tinderSubheadline: 'Swipe rechts, wenn es dich trifft. Links zum Ueberspringen.',
  tinderSkip: 'Ueberspringen',
  tinderRelate: 'Trifft mich',
  tinderRemaining: 'Karten uebrig',
  tinderRemainingOne: 'Karte uebrig',
  tinderSkipRemaining: 'Rest ueberspringen',

  solutionHeadline: 'So loest Voxa das',
  solutionSubheadline:
    'Du hast uns gesagt, was dich frustriert. Das aendert sich jetzt.',
  solutionSpeedPain: 'Untertitel dauern ewig',
  solutionSpeedSolution: 'Untertitel in unter 60 Sekunden automatisch generieren',
  solutionSpeedStat:
    'Spracherkennung auf dem Geraet — kein Warten, kein Upload',
  solutionPrivacyPain: 'Ich traue Online-Tools nicht',
  solutionPrivacySolution:
    '100% offline. Deine Videos verlassen nie dein Handy',
  solutionPrivacyStat: 'Zero Cloud-Verarbeitung. Zero Datensammlung.',
  solutionStylePain: 'Meine Untertitel wirken langweilig',
  solutionStyleSolution: 'Filmische Stile: Neon, Glow, Chrom und mehr',
  solutionStyleStat: '7 Schriftarten, 5 Farben, 5 Effekte, 3 Positionen',
  solutionCostPain: 'Abos summieren sich',
  solutionCostSolution: 'Eine App. Keine wiederkehrenden Kosten. Kein Wasserzeichen.',
  solutionCostStat: 'Alle Funktionen inklusive — keine Premium-Schraenken',
  solutionCta: 'Zeig mir die Stile',

  prefHeadline: 'Waehle deinen Signature-Look',
  prefSubheadline:
    'Das sind die Voreinstellungen fuer dein erstes Projekt. Du kannst sie jederzeit aendern.',
  prefSectionFont: 'Schriftart',
  prefSectionColor: 'Akzentfarbe',
  prefSectionEffect: 'Effekt',
  prefCta: 'Weiter',

  permHeadline: 'Noch eine Sache, bevor wir loslegen',
  permSubheadline:
    'Voxa braucht zwei Berechtigungen, um zu funktionieren. Alles bleibt offline.',
  permPhotoTitle: 'Fotobibliothek',
  permPhotoBody:
    'Um Videos zu importieren und fertige Clips zurueck in deine Kamerarolle zu speichern.',
  permSpeechTitle: 'Spracherkennung',
  permSpeechBody:
    'Um Audio direkt auf deinem Geraet in Untertitel zu transkribieren. Keine Cloud.',
  permGranted: 'Erlaubt',
  permEnable: 'Zugriff aktivieren',
  permRequesting: 'Anfrage laeuft...',
  permNotNow: 'Spaeter',
  permAllSet: 'Alles bereit',

  procTitle: 'Alles vorbereiten',
  procSubtitle: 'Deine Vorlieben werden analysiert...',
  procPhase1: 'Deine Vorlieben werden analysiert...',
  procPhase2: 'Dein Arbeitsbereich wird vorbereitet...',
  procPhase3: 'Gleich fertig...',

  demoHeadline: 'Probier es aus',
  demoSubheadline:
    'Waehle Schriftart, Farbe und Effekt. Sieh deinen Stil in Echtzeit zum Leben erwachen.',
  demoSectionFont: 'Schriftart',
  demoSectionAccent: 'Akzent',
  demoSectionEffect: 'Effekt',
  demoCta: 'Ich liebe diesen Look',
  demoPreviewText: 'So werden deine Untertitel aussehen',

  effectClean: 'Klar',
  effectNeon: 'Neon',
  effectGlow: 'Glow',
  effectCinema: 'Kino',

  valueTitle: 'Alles bereit',
  valueBody: 'Wir haben Voxa fuer dich personalisiert, damit du',
  valueItemsTitle: 'Das erwartet dich:',
  valueGoalFallback: 'Erstelle fantastische Untertitel',
  valueItem1Label: 'Untertitel mit einem Tap generieren',
  valueItem1Desc: 'Importiere ein Video und erhalte Untertitel in Sekunden',
  valueItem2Label: 'Dein Stil gespeichert',
  valueItem2Desc: 'Schriftart, Farbe und Effekt vorab ausgewaehlt',
  valueItem3Label: 'Standardmaessig privat',
  valueItem3Desc: 'Alles wird auf deinem Geraet verarbeitet',
  valueCta: 'Los geht\'s',

  continue: 'Weiter',
  skip: 'Ueberspringen',
  back: 'Zurueck',
};

const it: Translations = {
  welcomeEyebrow: 'Offline. Privato. Istantaneo.',
  welcomeTitle: 'Sottotitoli che rendono i tuoi clip irresistibili',
  welcomeDescription:
    'Importa qualsiasi video. Ottieni didascalie cinematografiche perfettamente sincronizzate in meno di un minuto. Nessun upload. Nessun abbonamento. Solo il tuo telefono.',
  welcomeCta: 'Inizia',

  goalHeadline: 'Cosa vuoi ottenere?',
  goalSubheadline:
    "Scegli cio che conta di piu per te ora. Adatteremo la tua esperienza.",
  goalViral: 'Diventare virale con retention migliore',
  goalAccessible: 'Rendere i contenuti accessibili',
  goalBrand: "Costruire un'immagine di marca coerente",
  goalFast: 'Pubblicare piu velocemente senza esternalizzare',
  goalMultilingual: 'Raggiungere audience non italiane',
  goalProfessional: 'Sembrare piu professionale',
  goalCta: 'Continua',

  painHeadline: 'Cosa ti rallenta di piu?',
  painSubheadline:
    'Seleziona tutto cio che ti frustra. Anche noi ci siamo passati.',
  painTyping: 'Scrivere i sottotitoli richiede una vita',
  painTools: 'Gli strumenti online sembrano inaffidabili o lenti',
  painCost: 'Gli abbonamenti si accumulano in fretta',
  painTiming: 'La sincronizzazione non e mai perfetta',
  painStyle: 'I sottotitoli sembrano noiosi e generici',
  painOffline: 'Ho bisogno di lavorare senza internet',
  painPrivacy: 'Non voglio i miei video nel cloud',
  painCtaNone: 'Seleziona almeno uno',
  painCtaSome: 'Continua',

  socialHeadline: 'Creator come te stanno gia risparmiando ore',
  socialSubheadline:
    'Unisciti a migliaia che hanno abbandonato i sottotitoli manuali per sempre.',
  socialCta: 'Continua',

  tinderHeadline: 'Con quali ti identifichi?',
  tinderSubheadline: 'Scorri a destra se ti rappresenta. A sinistra per saltare.',
  tinderSkip: 'Salta',
  tinderRelate: 'Mi identifico',
  tinderRemaining: 'carte rimaste',
  tinderRemainingOne: 'carta rimasta',
  tinderSkipRemaining: 'Salta le restanti',

  solutionHeadline: 'Ecco come Voxa risolve il problema',
  solutionSubheadline:
    'Ci hai detto cosa ti frustra. Ecco esattamente cosa cambia.',
  solutionSpeedPain: 'I sottotitoli richiedono una vita',
  solutionSpeedSolution: 'Genera sottotitoli automaticamente in meno di 60 secondi',
  solutionSpeedStat:
    'Riconoscimento vocale sul dispositivo — nessuna attesa, nessun upload',
  solutionPrivacyPain: 'Non mi fido degli strumenti online',
  solutionPrivacySolution:
    '100% offline. I tuoi video non lasciano mai il telefono',
  solutionPrivacyStat: 'Zero elaborazione cloud. Zero raccolta dati.',
  solutionStylePain: 'I miei sottotitoli sembrano noiosi',
  solutionStyleSolution: 'Stili cinematografici: neon, bagliore, cromato e altro',
  solutionStyleStat: '7 font, 5 colori, 5 effetti, 3 posizioni',
  solutionCostPain: 'Gli abbonamenti si accumulano',
  solutionCostSolution: 'Un app sola. Nessun costo ricorrente. Nessun watermark.',
  solutionCostStat: 'Tutte le funzioni incluse — nessun muro premium',
  solutionCta: 'Mostrami gli stili',

  prefHeadline: 'Scegli il tuo look distintivo',
  prefSubheadline:
    "Queste saranno le impostazioni predefinite per il tuo primo progetto. Puoi cambiarle quando vuoi.",
  prefSectionFont: 'Font',
  prefSectionColor: 'Colore accento',
  prefSectionEffect: 'Effetto',
  prefCta: 'Continua',

  permHeadline: 'Un ultima cosa prima di iniziare',
  permSubheadline:
    "Voxa ha bisogno di due permessi per funzionare. Tutto rimane offline.",
  permPhotoTitle: 'Libreria foto',
  permPhotoBody:
    'Per importare i tuoi video e salvare i clip finiti nel rullino.',
  permSpeechTitle: 'Riconoscimento vocale',
  permSpeechBody:
    "Per trascrivere l'audio in sottotitoli direttamente sul tuo dispositivo. Nessun cloud.",
  permGranted: 'Consentito',
  permEnable: 'Attiva accesso',
  permRequesting: 'Richiesta in corso...',
  permNotNow: 'Non ora',
  permAllSet: 'Tutto pronto',

  procTitle: 'Preparazione in corso',
  procSubtitle: 'Analisi delle tue preferenze...',
  procPhase1: 'Analisi delle tue preferenze...',
  procPhase2: 'Preparazione del tuo spazio...',
  procPhase3: 'Quasi pronto...',

  demoHeadline: 'Provalo ora',
  demoSubheadline:
    "Scegli un font, un colore e un effetto. Guarda il tuo stile prendere vita in tempo reale.",
  demoSectionFont: 'Font',
  demoSectionAccent: 'Accento',
  demoSectionEffect: 'Effetto',
  demoCta: 'Adoro questo look',
  demoPreviewText: 'Ecco come saranno i tuoi sottotitoli',

  effectClean: 'Pulito',
  effectNeon: 'Neon',
  effectGlow: 'Bagliore',
  effectCinema: 'Cinema',

  valueTitle: 'Tutto pronto',
  valueBody: 'Abbiamo personalizzato Voxa per aiutarti a',
  valueItemsTitle: 'Cosa hai pronto:',
  valueGoalFallback: 'Creare sottotitoli incredibili',
  valueItem1Label: 'Generazione sottotitoli con un tocco',
  valueItem1Desc: 'Importa un video e ottieni sottotitoli in pochi secondi',
  valueItem2Label: 'Il tuo stile salvato',
  valueItem2Desc: 'Font, colore ed effetto predefiniti preselezionati',
  valueItem3Label: 'Privato di default',
  valueItem3Desc: 'Tutto elaborato sul tuo dispositivo',
  valueCta: 'Inizia a creare',

  continue: 'Continua',
  skip: 'Salta',
  back: 'Indietro',
};

const ru: Translations = {
  welcomeEyebrow: 'Offlain. Privatno. Mgnovenno.',
  welcomeTitle: 'Subtitry, iz-za kotorykh nevozmozhno proskrollit klip',
  welcomeDescription:
    'Importirui liuboe video. Poluchi idealno sinkhronizirovannye kinematograficheskie subtitry menshe chem za minutu. Bez zagruzok. Bez podpisok. Tolko tvoi telefon.',
  welcomeCta: 'Nachat',

  goalHeadline: 'Chego ty khochesh dobitsia?',
  goalSubheadline:
    'Vyberi to, chto vazhnee vsego priamo seichas. My podstroim opyt pod tebia.',
  goalViral: 'Vzorvat virusnost i uderzhanie',
  goalAccessible: 'Sdelat kontent dostupnym',
  goalBrand: 'Vystroit uznavayemy vizual',
  goalFast: 'Postit bystree bez autsorsa',
  goalMultilingual: 'Vykhodit na neangloiazychnuiu auditoriiu',
  goalProfessional: 'Vygliadet professionalnee',
  goalCta: 'Prodolzhit',

  painHeadline: 'Chto bol she vsego tormozit?',
  painSubheadline:
    'Vyberi vse, chto besit. My tozhe chereze eto prokhodili.',
  painTyping: 'Pisat subtitry — vechnost',
  painTools: 'Onlain-instrumenty vygliadiat somnitelno ili tormoziati',
  painCost: 'Podpiski nakaplivaiutsia kak snezhnyi kom',
  painTiming: 'Taiming nikogda ne idealen',
  painStyle: 'Subtitry vygliadiat skuchno i shablonno',
  painOffline: 'Nuzhno rabotat bez interneta',
  painPrivacy: 'Ne khochu svoi video v oblake',
  painCtaNone: 'Vyberi khotia by odin punkt',
  painCtaSome: 'Prodolzhit',

  socialHeadline: 'Kreatory kak ty uzhe ekonomiati chasy',
  socialSubheadline:
    'Prisoediniai sia k tysiacham, kto navsegda zabil pro ruchnye subtitry.',
  socialCta: 'Prodolzhit',

  tinderHeadline: 'S chem ty sebia assotsiiruesh?',
  tinderSubheadline: 'Svaip vpravo, esli blizko. Vlevo — propustit.',
  tinderSkip: 'Propustit',
  tinderRelate: 'Blizko',
  tinderRemaining: 'kart ostalos',
  tinderRemainingOne: 'karta ostalas',
  tinderSkipRemaining: 'Propustit ostavshiesia',

  solutionHeadline: 'Vot kak Voxa eto reshaet',
  solutionSubheadline:
    'Ty rasskazal, chto besit. Vot chto konkretno izmenitsia.',
  solutionSpeedPain: 'Subtitry zanimaiut vechnost',
  solutionSpeedSolution: 'Avtogeneratsiia subtitrov menshe chem za 60 sekund',
  solutionSpeedStat:
    'Raspoznavanie rechi na ustroistve — bez ozhidanii i zagruzok',
  solutionPrivacyPain: 'Ne doveriaiut onlain-instrumentam',
  solutionPrivacySolution:
    '100% offlain. Tvoi video nikogda ne pokidaiut telefon',
  solutionPrivacyStat: 'Nol oblachnoi obrabotki. Nol sbora dannykh.',
  solutionStylePain: 'Moi subtitry vygliadiat skuchno',
  solutionStyleSolution: 'Kinematograficheskie stili: neon, svechenie, khrom i drugie',
  solutionStyleStat: '7 shriftov, 5 tsvetov, 5 effektov, 3 pozitsii',
  solutionCostPain: 'Podpiski nakaplivaiutsia',
  solutionCostSolution:
    'Odno prilozhenie. Bez reguliarnykh platezhei. Bez vodianykh znakov.',
  solutionCostStat: 'Ves funktsional vkluchen — bez premiumnykh ogranichenii',
  solutionCta: 'Pokazhi stili',

  prefHeadline: 'Vyberi svoi firmennyi stil',
  prefSubheadline:
    'Eto budut nastroiki po umolchaniiu dlia pervogo proekta. Mozhesh pomeniat v liuboi moment.',
  prefSectionFont: 'Shrift',
  prefSectionColor: 'Aktsentnyi tsvet',
  prefSectionEffect: 'Effekt',
  prefCta: 'Prodolzhit',

  permHeadline: 'Poslednii shag pered startom',
  permSubheadline:
    'Voxa nuzhno dva razresheniia, chtoby rabotat. Vse ostaetsia offlain.',
  permPhotoTitle: 'Fotoplienka',
  permPhotoBody:
    'Chtoby importirovat video i sokhriniat gotovye klipy obratno v galeriiu.',
  permSpeechTitle: 'Raspoznavanie rechi',
  permSpeechBody:
    'Chtoby transkribirovat audio v subtitry priamo na ustroistve. Bez oblaka.',
  permGranted: 'Razresheno',
  permEnable: 'Vkluchit dostup',
  permRequesting: 'Zaprashivaem...',
  permNotNow: 'Ne seichas',
  permAllSet: 'Vse gotovo',

  procTitle: 'Nastraivaem vse',
  procSubtitle: 'Analiziruem tvoi predpochteniia...',
  procPhase1: 'Analiziruem tvoi predpochteniia...',
  procPhase2: 'Gotovim tvoi rabochii prostranstvo...',
  procPhase3: 'Pochti gotovo...',

  demoHeadline: 'Poprobui seichas',
  demoSubheadline:
    'Vyberi shrift, tsvet i effekt. Uvid, kak stil ozhivaet v realnom vremeni.',
  demoSectionFont: 'Shrift',
  demoSectionAccent: 'Aktsent',
  demoSectionEffect: 'Effekt',
  demoCta: 'Obozhaiu etot stil',
  demoPreviewText: 'Tak budut vygliadet tvoi subtitry',

  effectClean: 'Chistyi',
  effectNeon: 'Neon',
  effectGlow: 'Svechenie',
  effectCinema: 'Kino',

  valueTitle: 'Vse gotovo',
  valueBody: 'My nastroili Voxa, chtoby pomoch tebe',
  valueItemsTitle: 'Chto tebia zhdet:',
  valueGoalFallback: 'Sozdavat krutye subtitry',
  valueItem1Label: 'Generatsiia subtitrov v odin tap',
  valueItem1Desc: 'Importirui video i poluchi subtitry za sekundy',
  valueItem2Label: 'Tvoi stil sokhranen',
  valueItem2Desc: 'Shrift, tsvet i effekt vybrany zaranee',
  valueItem3Label: 'Privatnost po umolchaniiu',
  valueItem3Desc: 'Vsia obrabotka — na tvoem ustroistve',
  valueCta: 'Nachat sozdavat',

  continue: 'Prodolzhit',
  skip: 'Propustit',
  back: 'Nazad',
};

const ja: Translations = {
  welcomeEyebrow: 'Offlain. Puraibeto. Sokuzani.',
  welcomeTitle: 'Sukurooru sasenai jimaku de, kurippu wo hikitomeru',
  welcomeDescription:
    'Donna douga mo inpo-to. 1-fun inai ni kanpeki na shinematikkku jimaku wo seisei. Appuro-do fuyou. Sabusuku fuyou. Sumaho dake de kanketsu.',
  welcomeCta: 'Hajimeru',

  goalHeadline: 'Nani wo tasshi tai desu ka?',
  goalSubheadline:
    'Ima motto mo taisetsu na koto wo eran de kudasai. Sore ni awasete taiken wo saiteki ka shimasu.',
  goalViral: 'Ritenshon koujou de bazuru',
  goalAccessible: 'Kontentsu wo dare ni demo todokeru',
  goalBrand: 'Ikkan sei no aru burando bijuaru wo tsukuru',
  goalFast: 'Gaichu nashi de subayaku toukou suru',
  goalMultilingual: 'Nihongo-ken gai no shichou sha ni mo todokeru',
  goalProfessional: 'Puroppoku miseru',
  goalCta: 'Tsugi e',

  painHeadline: 'Ichiban no sutoresu wa nan desu ka?',
  painSubheadline:
    'Atte hamaru mono wo subete eran de kudasai. Watashitachi mo onaji keiken wo shiteimasu.',
  painTyping: 'Jimaku nyuuryoku ni jikan ga kakari sugiru',
  painTools: 'Onrain tsu-ru ga fuantei ayashii',
  painCost: 'Sabusuku no tsumikasane ga itai',
  painTiming: 'Taimingu ga pittari awanai',
  painStyle: 'Jimaku ga jimi de me wo hikanai',
  painOffline: 'Offrain de sagyou shitai',
  painPrivacy: 'Douga wo kuraudo ni okitakunai',
  painCtaNone: '1-tsu ijou eran de kudasai',
  painCtaSome: 'Tsugi e',

  socialHeadline:
    'Anata to onaji kurieita- ga, mou nanjikan mo setsuyaku shite iru',
  socialSubheadline:
    'Shudou jimaku wo sotsugyou shita suusen nin no nakama ni hairou.',
  socialCta: 'Tsugi e',

  tinderHeadline: 'Kyoukan dekiru mono wa?',
  tinderSubheadline: 'Kyoukan dekitara migi he suwaipu. Sukippu wa hidari e.',
  tinderSkip: 'Sukippu',
  tinderRelate: 'Kyoukan',
  tinderRemaining: 'mai nokori',
  tinderRemainingOne: 'mai nokori',
  tinderSkipRemaining: 'Nokori wo sukippu',

  solutionHeadline: 'Voxa ga kou kaiketsu shimasu',
  solutionSubheadline:
    'Anata no fuman wo kikimashita. Kore ga konkret ni kawaru koto desu.',
  solutionSpeedPain: 'Jimaku dzukuri ni jikan ga kakari sugiru',
  solutionSpeedSolution: '60-byou mi de jidou seisei',
  solutionSpeedStat:
    'Debaisu nai onsei ninshiki — machi jikan zero, appuro-do fuyou',
  solutionPrivacyPain: 'Onrain tsu-ru ga shin\'you dekinai',
  solutionPrivacySolution: '100% offrain. Douga wa tanmatsu kara demasen',
  solutionPrivacyStat: 'Kuraudo shori zero. De-ta shuushuu zero.',
  solutionStylePain: 'Jimaku ga jimi sugiru',
  solutionStyleSolution: 'Shinematikku sutairu: neon, gurow, kuroomu nado',
  solutionStyleStat: '7 shotai, 5 shoku, 5 efekuto, 3 pojishon',
  solutionCostPain: 'Sabusuku ga tsumikasumu',
  solutionCostSolution:
    'Kono apuri hitotsu. Teiki kakin nashi. Uo-ta-ma-ku nashi.',
  solutionCostStat: 'Zen kinou hyoujun tousai — puremiamu no kabe nashi',
  solutionCta: 'Sutairu wo misete',

  prefHeadline: 'Anata no teiban sutairu wo erabou',
  prefSubheadline:
    'Saisho no purojekuto no deforuto ni narimasu. Itsu demo henkou dekimasu.',
  prefSectionFont: 'Shotai',
  prefSectionColor: 'Akusento kara-',
  prefSectionEffect: 'Efekuto',
  prefCta: 'Tsugi e',

  permHeadline: 'Hajimeru mae ni saigo no kakunin',
  permSubheadline:
    'Voxa ga sayou suru ni wa 2-tsu no kyoka ga hitsuyou desu. Subete offrain de okonawaremasu.',
  permPhotoTitle: 'Foto raiburari',
  permPhotoBody:
    'Douga wo inpo-to shite, kansei shita kurippu wo kamera ro-ru ni hozon suru tame.',
  permSpeechTitle: 'Onsei ninshiki',
  permSpeechBody:
    'Onsei wo tanmatsu jou de chokusetsu jimaku ni henkan suru tame. Kuraudo wa tsukaimasen.',
  permGranted: 'Kyoka sumi',
  permEnable: 'Kyoka suru',
  permRequesting: 'Rikuesuto chuu...',
  permNotNow: 'Ato de',
  permAllSet: 'Junbi kanryou',

  procTitle: 'Junbi chuu',
  procSubtitle: 'Settei wo bunseki chuu...',
  procPhase1: 'Settei wo bunseki chuu...',
  procPhase2: 'Waku wo junbi chuu...',
  procPhase3: 'Mou sukoshi...',

  demoHeadline: 'Ima sugu tamesu',
  demoSubheadline:
    'Shotai, kara-, efekuto wo eran de, riarutaimu de sutairu wo kakunin shiyou.',
  demoSectionFont: 'Shotai',
  demoSectionAccent: 'Akusento',
  demoSectionEffect: 'Efekuto',
  demoCta: 'Kono sutairu ga ki ni itta',
  demoPreviewText: 'Jimaku wa kou narimasu',

  effectClean: 'Kurin',
  effectNeon: 'Neon',
  effectGlow: 'Gurow',
  effectCinema: 'Shinema',

  valueTitle: 'Junbi kanryou',
  valueBody: 'Voxa wo anata ni awasete kasutamaizu shimashita',
  valueItemsTitle: 'Anata ni tekishita settei:',
  valueGoalFallback: 'Subarashii jimaku wo sakusei',
  valueItem1Label: 'Wan tappu jimaku seisei',
  valueItem1Desc: 'Douga wo inpo-to shite, suu byou de jimaku wo shuutoku',
  valueItem2Label: 'Okiniri no sutairu wo hozon',
  valueItem2Desc: 'Shotai, kara-, efekuto wo arakajime sentaku zumi',
  valueItem3Label: 'Deforuto de puraibe-to',
  valueItem3Desc: 'Subete tanmatsu jou de shori',
  valueCta: 'Sakusei wo hajimeru',

  continue: 'Tsugi e',
  skip: 'Sukippu',
  back: 'Modoru',
};

const ko: Translations = {
  welcomeEyebrow: 'Opeurain. Peuraibit. Jiksi.',
  welcomeTitle: 'Seukeuroll-eul meomchuge mandeuneun jamak',
  welcomeDescription:
    'Eotteon yeongsang-ideun gajeo oseyo. 1-bun an-e wanbyeokhage singkeu doen sinematig jamak-eul mandeulmida. Eopdeurodeu eopseum. Seobeuseukeub eopseum. Hyudaepon hanaro kkeut.',
  welcomeCta: 'Sijakhagi',

  goalHeadline: 'Mueos-eul ilugo sipeusin gayo?',
  goalSubheadline:
    'Jigeum gajang jungyohan geos hana-reul gollajuseyo. Geu-e matchwo gyeongheom-eul jojeonghae deurimnida.',
  goalViral: 'Ritensyeon nopyeoseo baireul doegi',
  goalAccessible: 'Modu-ege danneun kontencheu mandeulgi',
  goalBrand: 'Ilgwandoen beuraendeu ruk guchuk-hagi',
  goalFast: 'Oeju eobsi ppaleureuge eopdeurodeu-hagi',
  goalMultilingual: 'Hangugeo oe sicheongja-ege do dahgi',
  goalProfessional: 'Deo peuropesyeoneolhae boigi',
  goalCta: 'Gyesok',

  painHeadline: 'Gajang mangmanghan jeom-eun mueos-ingayo?',
  painSubheadline:
    'Haedangdoeneun geos-eul modu seontaekhaejuseyo. Jeohuideudo da gyeokk-eobwasseoyo.',
  painTyping: 'Jamak chineun de neo-mu orae geollim',
  painTools: 'Onlain tul-i buran-hageona neurim',
  painCost: 'Seobeuseukeub-yi ssahyeoseo budamseureoum',
  painTiming: 'Taiming-i ttak matji aneum',
  painStyle: 'Jamak-i jiru-hago hoegiljeog-im',
  painOffline: 'Inteonet eobsi jag-eob-hago sipeum',
  painPrivacy: 'Yeongsang-eul keullaudeu-e olligi sireum',
  painCtaNone: 'Choedo 1gae-reul seontaekhaseyo',
  painCtaSome: 'Gyesok',

  socialHeadline: 'Dangsin gateun keurieiteo-ga imi sigan-eul akkigo isseoyo',
  socialSubheadline:
    'Sudeong jamak-eseo haebangdoen sucheon myeong-ui keurieiteodeul-e hamnyeo-haseyo.',
  socialCta: 'Gyesok',

  tinderHeadline: 'Gonggamdoeneun munjang-i issnayo?',
  tinderSubheadline:
    'Gonggamdoemyeon oreunjjog-euro seuwaipeu. Neomgireun woenjjog-euro.',
  tinderSkip: 'Neomgigi',
  tinderRelate: 'Gonggam',
  tinderRemaining: 'jang nameum',
  tinderRemainingOne: 'jang nameum',
  tinderSkipRemaining: 'Nameun geos neomgigi',

  solutionHeadline: 'Voxa-neun ireoke haegyeolhamnida',
  solutionSubheadline:
    'Bulpyeonhan jeom-eul deullyeojusyeosseoyo. Ijegumeonjeog dallajil jeom-ibnida.',
  solutionSpeedPain: 'Jamak mandeuneun de neo-mu orae geollim',
  solutionSpeedSolution: '60-cho an-e jadong-euro jamak saengseong',
  solutionSpeedStat:
    'Gigi nae eumseong insik — daegi eobseum, eopdeurodeu eobseum',
  solutionPrivacyPain: 'Onlain tul-eul mot mitgesseum',
  solutionPrivacySolution:
    '100% opeurain. Yeongsang-eun jeoldae hyudaepon-eul beoseonaji aneum',
  solutionPrivacyStat: 'Keullaudeu cheori jero. Deiteo sujip jero.',
  solutionStylePain: 'Jamak-i neo-mu mitmitam',
  solutionStyleSolution: 'Sinematig seutail: neyon, geullou, keulom deung',
  solutionStyleStat: '7gaji ponteu, 5gaji saeksang, 5gaji hyogwa, 3gaji wichi',
  solutionCostPain: 'Seobeuseukeub-yi ssah-im',
  solutionCostSolution:
    'I aebeu hana. Banbok gyeolje eobseum. Woteomakeu eobseum.',
  solutionCostStat: 'Modeun gineung poham — peurimieom byeok eobseum',
  solutionCta: 'Seutail boyeojwo',

  prefHeadline: 'Naman-ui sigeunicho ruk-eul goreuseyo',
  prefSubheadline:
    'Cheot peurojekteu-ui gibon-gabs-i doem니다. Eonjedeun byeongyeong hal su isseoyo.',
  prefSectionFont: 'Ponte-u',
  prefSectionColor: 'Gangjo saeksang',
  prefSectionEffect: 'Hyogwa',
  prefCta: 'Gyesok',

  permHeadline: 'Sijakhagi jeon majimak dangye',
  permSubheadline:
    'Voxa-ga jaghadorago hamyeon du gaji gwonhan-i piryohamnida. Modeun cheori-neun opeurain-eseo irueojimnida.',
  permPhotoTitle: 'Sajin raibeureori',
  permPhotoBody:
    'Yeongsang-eul gajeo-ogo wanseongdoen keullib-eul kaemera rol-e jeojang-hagi wihae piryohamnida.',
  permSpeechTitle: 'Eumseong insik',
  permSpeechBody:
    'Odioreul gigi-eseo jikjeop jamak-euro byeongyeon-hagi wihae piryohamnida. Keullaudeu eobseum.',
  permGranted: 'Heoyongdoem',
  permEnable: 'Jeopgeun heoyong',
  permRequesting: 'Yocheung jung...',
  permNotNow: 'Najung-e',
  permAllSet: 'Junbi wallyo',

  procTitle: 'Seoljeong jung',
  procSubtitle: 'Seonhodo bunseok jung...',
  procPhase1: 'Seonhodo bunseok jung...',
  procPhase2: 'Ilgonggan junbi jung...',
  procPhase3: 'Ije gyeolguk...',

  demoHeadline: 'Jigeum baro cheheomhaeboseyo',
  demoSubheadline:
    'Ponte-u, saeksang, hyogwa-reul goreugo sillsigan-euro seutail-i sarananeun geol hwagin-haseyo.',
  demoSectionFont: 'Ponte-u',
  demoSectionAccent: 'Gangjo',
  demoSectionEffect: 'Hyogwa',
  demoCta: 'I ruk ma-eum-e deureoyo',
  demoPreviewText: 'Jamak-i ireoke boyeoyo',

  effectClean: 'Kkaekkeuthan',
  effectNeon: 'Neyon',
  effectGlow: 'Geullou',
  effectCinema: 'Sinemma',

  valueTitle: 'Modeun junbi-ga wallyeodoeeosseumnida',
  valueBody: 'Voxa-reul dangsin-ege matchweon matcum seoljeonghaesseumnida',
  valueItemsTitle: 'Junbi-doen gineung:',
  valueGoalFallback: 'Meosjin jamak mandeulgi',
  valueItem1Label: 'Taep han beon-euro jamak saengseong',
  valueItem1Desc: 'Yeongsang-eul gajeo-omyeon myocho an-e jamak wanseong',
  valueItem2Label: 'Naman-ui seutail jeojang wallyo',
  valueItem2Desc: 'Ponte-u, saeksang, hyogwa-ga miri seontaekdoeeo isseum',
  valueItem3Label: 'Gibonjeogeuro peuraibit',
  valueItem3Desc: 'Modeun cheori-ga gigi nae-eseo irueojim',
  valueCta: 'Jejak sijak',

  continue: 'Gyesok',
  skip: 'Geonneomugi',
  back: 'Dwiro',
};

const zh: Translations = {
  welcomeEyebrow: 'Li xian. Si mi. Ji ke.',
  welcomeTitle: 'Rang ren ting bu xia shou zhi de zi mu',
  welcomeDescription:
    'Dao ru ren yi shi pin. Bu dao yi fen zhong ji ke huo de jing zhun tong bu de dian ying ji zi mu. Wu xu shang chuan. Wu xu ding yue. Zhi xu ni de shou ji.',
  welcomeCta: 'Kai shi',

  goalHeadline: 'Ni xiang da cheng shen me mu biao?',
  goalSubheadline:
    'Xuan chu mu qian dui ni zui zhong yao de yi ge. Wo men hui wei rao ta wei ni ding zhi ti yan.',
  goalViral: 'Ti sheng liu cun, zhi zao bao kuan',
  goalAccessible: 'Rang nei rong chu da geng duo ren',
  goalBrand: 'Da zao tong yi de pin pai shi jue',
  goalFast: 'Wu xu wai bao, kuai su fa bu',
  goalMultilingual: 'Chu da fei zhong wen shou zhong',
  goalProfessional: 'Kan qi lai geng zhuan ye',
  goalCta: 'Ji xu',

  painHeadline: 'Zui rang ni tou teng de shi shen me?',
  painSubheadline:
    'Xuan chu suo you rang ni zhua kuang de xuan xiang. Wo men ye jing li guo.',
  painTyping: 'Da zi mu tai fei shi jian',
  painTools: 'Zai xian gong ju bu ke kao huo tai man',
  painCost: 'Ding yue fei yong ji shao cheng duo',
  painTiming: 'Shi jian zhou yong yuan dui bu zhun',
  painStyle: 'Zi mu kan qi lai dan diao fa wei',
  painOffline: 'Wo xu yao li xian gong zuo',
  painPrivacy: 'Bu xiang ba su cai chuan dao yun duan',
  painCtaNone: 'Qing zhi shao xuan ze yi xiang',
  painCtaSome: 'Ji xu',

  socialHeadline: 'Xiang ni zhe yang de chuang zuo zhe yi jing zai jie sheng da liang shi jian',
  socialSubheadline:
    'Jia ru cheng qian shang wan che di gao bie shou dong zi mu de chuang zuo zhe hang lie.',
  socialCta: 'Ji xu',

  tinderHeadline: 'Na xie shuo fa rang ni gan tong shen shou?',
  tinderSubheadline: 'You gong ming jiu xiang you hua. Xiang zuo hua tiao guo.',
  tinderSkip: 'Tiao guo',
  tinderRelate: 'Gong ming',
  tinderRemaining: 'zhang sheng yu',
  tinderRemainingOne: 'zhang sheng yu',
  tinderSkipRemaining: 'Tiao guo sheng yu',

  solutionHeadline: 'Voxa zhe yang jie jue ni de wen ti',
  solutionSubheadline:
    'Ni gao su le wo men ni de frustrations. Yi xia shi ju ti hui gai bian de di fang.',
  solutionSpeedPain: 'Zuo zi mu hao shi tai jiu',
  solutionSpeedSolution: '60 miao nei zi dong sheng cheng zi mu',
  solutionSpeedStat:
    'She bei duan yu yin shi bie — wu xu deng dai, wu xu shang chuan',
  solutionPrivacyPain: 'Bu xin ren zai xian gong ju',
  solutionPrivacySolution: '100% li xian. Ni de shi pin yong yuan bu hui li kai shou ji',
  solutionPrivacyStat: 'Ling yun duan chu li. Ling shu ju cai ji.',
  solutionStylePain: 'Wo de zi mu kan qi lai tai pu tong',
  solutionStyleSolution: 'Dian ying ji feng ge: ni hong, fa guang, du ge deng duo zhong xiao guo',
  solutionStyleStat: '7 zhong zi ti, 5 zhong yan se, 5 zhong xiao guo, 3 zhong wei zhi',
  solutionCostPain: 'Ding yue fei yong ji shao cheng duo',
  solutionCostSolution: 'Yi ge App. Wu recurring fei yong. Wu shui yin.',
  solutionCostStat: 'Quan bu gong neng nei zhi — wu fu fei qiang',
  solutionCta: 'Kan kan zhe xie feng ge',

  prefHeadline: 'Xuan ze ni de zhuan shu feng ge',
  prefSubheadline:
    'Zhe jiang shi ni di yi ge xiang mu de mo ren she zhi. Sui shi ke yi geng gai.',
  prefSectionFont: 'Zi ti',
  prefSectionColor: 'Qiang tiao se',
  prefSectionEffect: 'Xiao guo',
  prefCta: 'Ji xu',

  permHeadline: 'Kai shi qian de zui hou yi bu',
  permSubheadline:
    'Voxa xu yao liang xiang quan xian cai neng yun xing. Suo you chu li jun zai li xian zhuang tai xia wan cheng.',
  permPhotoTitle: 'Zhao pian tu ku',
  permPhotoBody:
    'Yong yu dao ru shi pin bing jiang wan cheng de pian duan bao cun hui xiang ce.',
  permSpeechTitle: 'Yu yin shi bie',
  permSpeechBody:
    'Yong yu zai she bei duan zhi jie jiang yin pin zhuan lu wei zi mu. Bu she ji yun duan.',
  permGranted: 'Yi yun xu',
  permEnable: 'Kai qi quan xian',
  permRequesting: 'Qing qiu zhong...',
  permNotNow: 'Shao hou zai shuo',
  permAllSet: 'Yi qie jiu xu',

  procTitle: 'Zheng zai zhun bei',
  procSubtitle: 'Zheng zai fen xi ni de pian hao...',
  procPhase1: 'Zheng zai fen xi ni de pian hao...',
  procPhase2: 'Zheng zai zhun bei ni de gong zuo qu...',
  procPhase3: 'Kuai yao wan cheng le...',

  demoHeadline: 'Li ji ti yan',
  demoSubheadline:
    'Xuan ze zi ti, yan se he xiao guo, shi shi yu lan ni de feng ge.',
  demoSectionFont: 'Zi ti',
  demoSectionAccent: 'Qiang tiao se',
  demoSectionEffect: 'Xiao guo',
  demoCta: 'Xi huan zhe ge feng ge',
  demoPreviewText: 'Ni de zi mu kan qi lai hui shi zhe yang',

  effectClean: 'Jian jie',
  effectNeon: 'Ni hong',
  effectGlow: 'Fa guang',
  effectCinema: 'Dian ying',

  valueTitle: 'Yi qie jiu xu',
  valueBody: 'Wo men yi gen ju ni de xu qiu ding zhi le Voxa',
  valueItemsTitle: 'Yi wei ni zhun bei hao:',
  valueGoalFallback: 'Chuang zao jing cai zi mu',
  valueItem1Label: 'Yi jian sheng cheng zi mu',
  valueItem1Desc: 'Dao ru shi pin, shu miao nei huo de zi mu',
  valueItem2Label: 'Ni de feng ge yi bao cun',
  valueItem2Desc: 'Zi ti, yan se, xiao guo yi yu xian xuan hao',
  valueItem3Label: 'Mo ren si mi',
  valueItem3Desc: 'Suo you chu li jun zai she bei duan wan cheng',
  valueCta: 'Kai shi chuang zuo',

  continue: 'Ji xu',
  skip: 'Tiao guo',
  back: 'Fan hui',
};

const ar: Translations = {
  welcomeEyebrow: 'Bidun intarnit. Khass. Fawri.',
  welcomeTitle: "Tarjama takhalli al-mushahid ma yaqdir yatajawwaz maqati'ak",
  welcomeDescription:
    "Istawrid ayy fidyo. Ihsal ala tarjama sinamayiya mutazamana bishakl mithali fi aqall min daqiqa. Bidun raf'. Bidun ishtirakat. Bas jawwak.",
  welcomeCta: "Ibda'",

  goalHeadline: 'Wash illi tahqiqah?',
  goalSubheadline:
    'Ikhtar illi yihimmak al-hin. Rah nukhassis al-tajriba hawlah.',
  goalViral: "Intishar aqwa ma'a ihtifaz akbar",
  goalAccessible: "Muhtawa yusil lil-jami'",
  goalBrand: "Bina' hawiya basariyya thabita",
  goalFast: "Nashr asra' bidun ta'aqidat",
  goalMultilingual: "Wusul li-jumhur ghayr natiq bil-'arabiyya",
  goalProfessional: 'Mazhar akthar ihtirafiyya',
  goalCta: 'Istamirr',

  painHeadline: "Wash illi ya'tallik akthar?",
  painSubheadline:
    "Ikhtar kull illi yuda'iqak. Ihna murrina binafs al-shay'.",
  painTyping: 'Kitabat al-tarjama takhudh waqt tawil',
  painTools: "Al-adawat al-onlayn tibda muriyba aw bati'a",
  painCost: "Al-ishtirakat tatrakam bisur'a",
  painTiming: "Al-tazamun ma yitla' mazzbut",
  painStyle: "Al-tarjama tibda mumilla wa 'adiyya",
  painOffline: 'Ahtaj ashtaghil bidun nit',
  painPrivacy: "Ma abgha maqati'i 'ala al-sahaba",
  painCtaNone: "Ikhtar wahid 'ala al-aqall",
  painCtaSome: 'Istamirr',

  socialHeadline: "Sunna' muhtawa mithlak yuwaffirun sa'at",
  socialSubheadline:
    "Inzam ila alaf illi taraku al-tarjama al-yadiyya nihaiyan.",
  socialCta: 'Istamirr',

  tinderHeadline: "Ayy 'ibarat tash'ur fiha?",
  tinderSubheadline: 'Is-hab yamin law tahs fiha. Yasar lit-takhti.',
  tinderSkip: 'Takhati',
  tinderRelate: 'Ahs fiha',
  tinderRemaining: 'bataqat mutabqiya',
  tinderRemainingOne: 'bataqa mutabqiya',
  tinderSkipRemaining: 'Takhati al-mutabqi',

  solutionHeadline: 'Kadha Voxa yahluha',
  solutionSubheadline:
    "Qult lina wash illi yuda'iqak. Hadhihi al-taghyirat bid-dabt.",
  solutionSpeedPain: 'Al-tarjama takhudh waqt tawil',
  solutionSpeedSolution: "Tawlid tarjama tilqai' fi aqall min 60 thaniya",
  solutionSpeedStat:
    "Ta'aruf sawti 'ala al-jihaz — bidun intizar wala raf'",
  solutionPrivacyPain: 'Ma athiq bil-adawat al-onlayn',
  solutionPrivacySolution:
    "100% bidun nit. Maqati'ak ma titla' min jawwalk",
  solutionPrivacyStat: "Sifr mu'alaja sahabiyya. Sifr jam' bayanat.",
  solutionStylePain: 'Tarjamati tibda mumilla',
  solutionStyleSolution: 'Anmat sinamayiya: niyun, tawahhuj, kurum wa-ghayruha',
  solutionStyleStat: "7 khutut, 5 alwan, 5 athar, 3 mawadi'",
  solutionCostPain: 'Al-ishtirakat tatrakam',
  solutionCostSolution:
    "Tatbiq wahid. Bidun rusum dooriyya. Bidun 'alama mayyiyya.",
  solutionCostStat: "Jami' al-mumayyizat mudmuna — bidun hawa'ij mumayyaza",
  solutionCta: 'Warri al-anmat',

  prefHeadline: "Ikhtar tab'ak al-mumayyaz",
  prefSubheadline:
    "Hadhi al-i'adat al-iftira'iyya li-mashru'ak al-awwal. Tiqdar taghyirha matma tibgha.",
  prefSectionFont: 'Al-khatt',
  prefSectionColor: 'Lawn al-tamayyuz',
  prefSectionEffect: 'Al-athar',
  prefCta: 'Istamirr',

  permHeadline: "Shay' akhir qabla ma nabda'",
  permSubheadline:
    "Voxa yahtaju tasrihayn yashtaghil. Kull shay' yabqa bidun nit.",
  permPhotoTitle: 'Maktabat al-suwar',
  permPhotoBody:
    "Li-istirad fidiyuhatak wa-hifz al-maqati' al-jahiza fi album al-kamira.",
  permSpeechTitle: "Ta'aruf al-kalam",
  permSpeechBody:
    "Li-tahwil al-sawt ila tarjama mubasharatan 'ala jihazak. Bidun sahaba.",
  permGranted: 'Musmuh',
  permEnable: "Taf'il al-wusul",
  permRequesting: 'Qiyam al-talab...',
  permNotNow: 'Mush al-hin',
  permAllSet: "Kull shay' jahiz",

  procTitle: 'Jari al-tajhiz',
  procSubtitle: 'Jari tahlll afdaliyyatik...',
  procPhase1: 'Jari tahlll afdaliyyatik...',
  procPhase2: "Jari i'dad makan al-'amal...",
  procPhase3: 'Qariban...',

  demoHeadline: 'Jarrab al-hin',
  demoSubheadline:
    "Ikhtar khatt wa-lawn wa-athar. Shuf tab'ak yitla' hayy bi-l-waqt al-haqiqi.",
  demoSectionFont: 'Al-khatt',
  demoSectionAccent: 'Al-tamayyuz',
  demoSectionEffect: 'Al-athar',
  demoCta: "'Jabni hatha al-tab'",
  demoPreviewText: "Hakadha tarjamatak rah titla'",

  effectClean: 'Nadif',
  effectNeon: 'Niyun',
  effectGlow: 'Tawahhuj',
  effectCinema: 'Sinama',

  valueTitle: "Kull shay' jahiz",
  valueBody: "Khassasna Voxa yusaa'idak",
  valueItemsTitle: 'Hadha ma huwa jahiz:',
  valueGoalFallback: "Ibnat tarajim ra'i'a",
  valueItem1Label: "Tawlid tarjama bil-lamsa al-wahida",
  valueItem1Desc: "Istawrid fidyo wa-ihsal 'ala tarjama fi thanayat",
  valueItem2Label: "Tab'ak al-mahfuz",
  valueItem2Desc: 'Al-khatt wa-l-lawn wa-l-athar mukhtarin musbaqan',
  valueItem3Label: "Khass iftira'iyan",
  valueItem3Desc: "Kull al-mu'alaja 'ala jihazak",
  valueCta: "Ibda' al-ibda'",

  continue: 'Istamirr',
  skip: 'Takhati',
  back: "Ruju'",
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
