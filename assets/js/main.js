const STORAGE_KEY = "eysae-language";
const RTL_LANGS = new Set(["ar"]);

const translations = {
  "en": {
    "common": {
      "openMenu": "Open menu"
    },
    "brand": {
      "subtitle": "Empowering Youth for Sustainable Agriculture and Entrepreneurship"
    },
    "nav": {
      "home": "Home",
      "project": "Project",
      "partners": "Partners",
      "news": "News",
      "community": "Community",
      "contact": "Contact"
    },
    "cta": {
      "joinHub": "Join Hub"
    },
    "footer": {
      "tagline": "A project website presenting cooperation, activities, visibility and results related to EYSAE within the Erasmus+ framework.",
      "navTitle": "Navigation",
      "noteTitle": "Institutional Note",
      "noteBody": "Co-funded cooperation projects and related communication materials should reflect visibility and acknowledgement requirements in line with Erasmus+ framework expectations.",
      "copyright": "© 2026 EYSAE",
      "disclaimer": "The content of this website is the responsibility of the project partnership and is intended for information and dissemination purposes."
    },
    "home": {
      "metaTitle": "EYSAE — Empowering Youth for Sustainable Agriculture and Entrepreneurship",
      "kicker": "Erasmus+ Cooperation Project",
      "heroTitle": "Empowering Youth for Sustainable Agriculture and Entrepreneurship",
      "heroDesc": "EYSAE supports young people through practical learning, entrepreneurial thinking, sustainable agriculture knowledge and international cooperation.",
      "heroPrimaryCta": "Explore the Project",
      "heroSecondaryCta": "Open Community Hub",
      "stat1Number": "6+",
      "stat1Label": "Partner organisations",
      "stat2Number": "4",
      "stat2Label": "Website languages",
      "stat3Number": "EU",
      "stat3Label": "Youth, sustainability, mobility",
      "note1Label": "Focus",
      "note1Value": "Green skills & youth entrepreneurship",
      "note2Label": "Approach",
      "note2Value": "International learning and local impact"
    },
    "framework": {
      "eyebrow": "Project framework",
      "title": "Implemented within the Erasmus+ cooperation framework",
      "body": "This website presents the activities, partnership, results and visibility actions of the EYSAE project in line with European cooperation priorities in youth, sustainability and entrepreneurship."
    },
    "hub": {
      "eyebrow": "Community Hub",
      "title": "Give the project a real social layer",
      "body": "Members can create accounts, publish updates, share social links and exchange direct messages inside a dedicated community page connected to Firebase.",
      "card1Title": "Member sign-up",
      "card1Body": "Email/password access with editable profile, organisation, role, short bio and one social link.",
      "card2Title": "Posts and updates",
      "card2Body": "Users can publish discussion posts, project updates or community notices in a shared live feed.",
      "card3Title": "Direct messages",
      "card3Body": "Signed-in members can contact each other privately through a lightweight inbox built on Firestore.",
      "primaryCta": "Open community page",
      "secondaryCta": "Open project page"
    },
    "about": {
      "eyebrow": "About",
      "title": "About the Project",
      "body": "EYSAE is designed to strengthen youth capacities in sustainable agriculture and entrepreneurship by combining learning, cooperation, practical engagement and international exchange.",
      "reasonTitle": "Why this project matters",
      "reasonBody": "Young people need practical pathways to build green skills, entrepreneurial confidence and stronger links to sustainable local economies.",
      "deliverTitle": "What EYSAE delivers",
      "deliverBody": "The project creates learning opportunities, cooperation activities, visibility actions and transferable results for youth workers, young participants and partner organisations."
    },
    "objectives": {
      "eyebrow": "Objectives",
      "title": "Project Objectives",
      "obj1Title": "Strengthen green competencies",
      "obj1Body": "Support young people in understanding sustainable agriculture, environmental responsibility and local resilience.",
      "obj2Title": "Promote entrepreneurship",
      "obj2Body": "Encourage initiative, innovation and entrepreneurial thinking linked to rural and sustainable development opportunities.",
      "obj3Title": "Build international cooperation",
      "obj3Body": "Create stronger collaboration between partners, communities and youth stakeholders across participating countries.",
      "obj4Title": "Increase visibility and transferability",
      "obj4Body": "Share methods, activities and project results in a way that supports broader use and long-term sustainability."
    },
    "partners": {
      "eyebrow": "Partnership",
      "title": "Project Partners",
      "body": "EYSAE is implemented through a partnership of organisations committed to youth development, sustainability, entrepreneurship and European cooperation.",
      "p1Country": "Slovenia",
      "p1Body": "Project coordination, management and dissemination support.",
      "p2Country": "Greece",
      "p2Body": "Youth engagement, educational activities and local implementation.",
      "p3Country": "Morocco",
      "p3Body": "Training support, cross-border cooperation and participant outreach.",
      "p4Country": "Tunisia",
      "p4Body": "Community engagement, sustainability methods and youth participation.",
      "p5Country": "Jordan",
      "p5Body": "Communication support, visibility actions and dissemination outputs.",
      "p6Country": "Syria",
      "p6Body": "Local coordination, stakeholder cooperation and pilot support."
    },
    "news": {
      "eyebrow": "News",
      "title": "Latest Project Updates",
      "body": "Follow the latest visibility actions, partnership steps and implementation highlights from the EYSAE project.",
      "n1Meta": "March 2026 Project Launch",
      "n1Title": "EYSAE project implementation officially begins",
      "n1Body": "Partners have aligned the initial coordination steps, visibility direction and implementation priorities for the first phase of the project.",
      "n2Meta": "March 2026 Mobility Preparation",
      "n2Title": "Preparations for international project activities are underway",
      "n2Body": "The partnership is developing organisational steps, communication materials and participant-oriented preparation for upcoming cooperation activities.",
      "n3Meta": "March 2026 Visibility",
      "n3Title": "Visibility and outreach framework introduced on the website",
      "n3Body": "The project website now provides a stronger public-facing structure for presenting partnership information, activities and future updates.",
      "readMore": "Read more",
      "communityCta": "Open community feed"
    },
    "contact": {
      "eyebrow": "Contact",
      "title": "Official Project Contact",
      "body": "For partnership communication, project visibility, implementation-related questions or dissemination enquiries, please contact the coordinating organisation.",
      "coordinatorLabel": "Coordinator",
      "emailLabel": "Email",
      "locationLabel": "Location",
      "locationValue": "Slovenia",
      "sideTitle": "Project visibility and cooperation",
      "sideBody": "The website will continue to be updated with project news, cooperation milestones, activities and public-facing results as implementation progresses.",
      "cta": "Send an Email"
    },
    "project": {
      "metaTitle": "EYSAE Project Page",
      "kicker": "Dedicated project page",
      "title": "A clearer project story, structure and implementation path",
      "body": "This page gives EYSAE its own project space with a clearer story, easier navigation and stronger room for future updates, documents and timelines.",
      "primaryCta": "Go to Community",
      "secondaryCta": "Back to News",
      "pill1": "01 Clear project overview",
      "pill2": "02 Separated from homepage scrolling",
      "pill3": "03 Ready for future milestones and downloads",
      "overviewEyebrow": "Overview",
      "overviewTitle": "What this project page should do",
      "overviewBody": "It should explain the project quickly, make key information easy to find and send visitors to the next action: partners, updates, or the community hub.",
      "clarityTitle": "Public-facing clarity",
      "clarityBody": "Visitors immediately understand the purpose, the target group and the value of the project.",
      "architectureTitle": "Better information architecture",
      "architectureBody": "The project now has a dedicated destination page with space for richer content and clearer navigation.",
      "futureTitle": "Future-ready structure",
      "futureBody": "You can later add downloadable outputs, event pages, galleries and partner subpages without cluttering the homepage.",
      "blocksEyebrow": "Core blocks",
      "blocksTitle": "Main project content",
      "blocksBody": "The four core content blocks stay, but they now live in a cleaner page hierarchy.",
      "block1Title": "About",
      "block1Body": "Explain why the project matters, what challenge it addresses and why the partnership is relevant.",
      "block2Title": "Objectives",
      "block2Body": "State the intended competency-building, entrepreneurial mindset and cooperation outcomes clearly.",
      "block3Title": "Activities",
      "block3Body": "Show what people actually do in the project, not only the abstract idea behind it.",
      "block4Title": "Results",
      "block4Body": "Show what remains after the activity cycle: materials, stronger cooperation and visible public outputs.",
      "timelineEyebrow": "Implementation flow",
      "timelineTitle": "Suggested timeline blocks",
      "timelineBody": "Use these placeholders to convert the page into a real project timeline once implementation milestones are finalised.",
      "phase1Label": "Phase 1",
      "phase1Title": "Launch and partner alignment",
      "phase1Body": "Kick-off, role alignment, visibility setup and operational planning.",
      "phase2Label": "Phase 2",
      "phase2Title": "Workshops and local actions",
      "phase2Body": "Practical learning activities, local mobilisation and thematic engagement.",
      "phase3Label": "Phase 3",
      "phase3Title": "Mobility and exchange moments",
      "phase3Body": "International cooperation, cross-border learning and exchange of methods.",
      "phase4Label": "Phase 4",
      "phase4Title": "Dissemination and community follow-up",
      "phase4Body": "Publishing results, sharing updates and keeping engagement active through the community hub.",
      "ctaEyebrow": "Next step",
      "ctaTitle": "Connect the project page with the member hub",
      "ctaBody": "That way, people do not just read about the project. They can join, post, contact each other and follow updates.",
      "ctaPrimary": "Open community",
      "ctaSecondary": "Contact coordinator"
    },
    "community": {
      "metaTitle": "EYSAE Community Hub",
      "brandTitle": "Community hub",
      "logoutBtn": "Log out",
      "kicker": "Member space",
      "title": "Sign up, post updates and message other members",
      "body": "This page adds the social layer you asked for: member registration, editable social profile, public posts and direct messages.",
      "pill1": "Auth — Email + password sign-in",
      "pill2": "Feed — Posts, news and updates",
      "pill3": "Inbox — Private member messages",
      "setupTitle": "Firebase setup",
      "setupNote": "Confirm your Firebase keys, authorised domain and Firestore rules if sign-in does not complete correctly.",
      "authSignedOut": "Not signed in.",
      "authEyebrow": "Authentication",
      "authTitle": "Access the hub",
      "signInTitle": "Sign in",
      "signInEmailLabel": "Email",
      "signInPasswordLabel": "Password",
      "signInEmailPlaceholder": "Enter your email",
      "signInPasswordPlaceholder": "Enter your password",
      "signInBtn": "Sign in",
      "signUpTitle": "Create account",
      "signUpNameLabel": "Display name",
      "signUpEmailLabel": "Email",
      "signUpPasswordLabel": "Password",
      "signUpNamePlaceholder": "Your display name",
      "signUpEmailPlaceholder": "Enter your email",
      "signUpPasswordPlaceholder": "Create a password",
      "signUpBtn": "Create account",
      "profileEyebrow": "Profile",
      "profileTitle": "Your public member card",
      "profileNameLabel": "Display name",
      "profileOrgLabel": "Organisation / role",
      "profileBioLabel": "Bio",
      "profileSocialLabel": "Social link",
      "profileNamePlaceholder": "Your public name",
      "profileOrgPlaceholder": "Organisation or role",
      "profileBioPlaceholder": "Short introduction",
      "profileSocialPlaceholder": "https://...",
      "profileSaveBtn": "Save profile",
      "publishEyebrow": "Publish",
      "publishTitle": "Share a post or project update",
      "postTypeLabel": "Post type",
      "postType1": "Project update",
      "postType2": "Discussion",
      "postType3": "Notice",
      "postTagLabel": "Tag",
      "postMessageLabel": "Message",
      "postTagPlaceholder": "Short tag",
      "postMessagePlaceholder": "Write your update",
      "publishBtn": "Publish post",
      "feedEyebrow": "Feed",
      "feedTitle": "Latest community activity",
      "feedRefreshBtn": "Refresh",
      "feedEmpty": "No posts yet.",
      "membersEyebrow": "Members",
      "membersTitle": "People in the hub",
      "membersEmpty": "No members yet.",
      "inboxEyebrow": "Inbox",
      "inboxTitle": "Direct messages",
      "inboxRecipientLabel": "Send to",
      "inboxRecipientPlaceholder": "Select a member",
      "inboxMessageLabel": "Message",
      "inboxMessagePlaceholder": "Write your message",
      "inboxSendBtn": "Send message",
      "inboxEmpty": "No messages yet.",
      "backHome": "Back to homepage"
    }
  },
  "sl": {
    "common": {
      "openMenu": "Odpri meni"
    },
    "brand": {
      "subtitle": "Opolnomočenje mladih za trajnostno kmetijstvo in podjetništvo"
    },
    "nav": {
      "home": "Domov",
      "project": "Projekt",
      "partners": "Partnerji",
      "news": "Novice",
      "community": "Skupnost",
      "contact": "Kontakt"
    },
    "cta": {
      "joinHub": "Vstop v hub"
    },
    "footer": {
      "tagline": "Projektna spletna stran, ki predstavlja sodelovanje, aktivnosti, vidnost in rezultate projekta EYSAE v okviru Erasmus+.",
      "navTitle": "Navigacija",
      "noteTitle": "Institucionalna opomba",
      "noteBody": "Sofinancirani projekti sodelovanja in povezana komunikacijska gradiva morajo odražati zahteve glede vidnosti in priznanja v skladu z okvirom Erasmus+.",
      "copyright": "© 2026 EYSAE",
      "disclaimer": "Za vsebino te spletne strani je odgovorno projektno partnerstvo; namenjena je informiranju in diseminaciji."
    },
    "home": {
      "metaTitle": "EYSAE — Opolnomočenje mladih za trajnostno kmetijstvo in podjetništvo",
      "kicker": "Projekt sodelovanja Erasmus+",
      "heroTitle": "Opolnomočenje mladih za trajnostno kmetijstvo in podjetništvo",
      "heroDesc": "EYSAE podpira mlade s praktičnim učenjem, podjetniškim razmišljanjem, znanjem o trajnostnem kmetijstvu in mednarodnim sodelovanjem.",
      "heroPrimaryCta": "Razišči projekt",
      "heroSecondaryCta": "Odpri skupnostni hub",
      "stat1Number": "6+",
      "stat1Label": "partnerskih organizacij",
      "stat2Number": "4",
      "stat2Label": "jeziki spletne strani",
      "stat3Number": "EU",
      "stat3Label": "mladi, trajnost, mobilnost",
      "note1Label": "Fokus",
      "note1Value": "zelene kompetence in mladinsko podjetništvo",
      "note2Label": "Pristop",
      "note2Value": "mednarodno učenje in lokalni učinek"
    },
    "framework": {
      "eyebrow": "Projektni okvir",
      "title": "Izvaja se v okviru sodelovalnega okvira Erasmus+",
      "body": "Ta spletna stran predstavlja aktivnosti, partnerstvo, rezultate in vidnostne akcije projekta EYSAE v skladu z evropskimi prioritetami na področju mladih, trajnosti in podjetništva."
    },
    "hub": {
      "eyebrow": "Skupnostni hub",
      "title": "Projektu dodaj resnično socialno plast",
      "body": "Člani lahko ustvarijo račun, objavljajo novice, delijo družbena omrežja in si pošiljajo neposredna sporočila na posebni skupnostni strani, povezani s Firebase.",
      "card1Title": "Registracija članov",
      "card1Body": "Dostop z e-pošto in geslom z urejanjem profila, organizacije, vloge, kratke biografije in ene družbene povezave.",
      "card2Title": "Objave in posodobitve",
      "card2Body": "Uporabniki lahko objavljajo razprave, projektne novice ali obvestila v skupnem live feedu.",
      "card3Title": "Neposredna sporočila",
      "card3Body": "Prijavljeni člani lahko zasebno stopijo v stik z drugimi prek lahkega inbox sistema v Firestore.",
      "primaryCta": "Odpri skupnostno stran",
      "secondaryCta": "Odpri projektno stran"
    },
    "about": {
      "eyebrow": "O projektu",
      "title": "Predstavitev projekta",
      "body": "EYSAE je zasnovan za krepitev kapacitet mladih na področju trajnostnega kmetijstva in podjetništva s kombinacijo učenja, sodelovanja, praktičnega angažmaja in mednarodne izmenjave.",
      "reasonTitle": "Zakaj je projekt pomemben",
      "reasonBody": "Mladi potrebujejo praktične poti za razvoj zelenih veščin, podjetniške samozavesti in močnejših povezav s trajnostnimi lokalnimi gospodarstvi.",
      "deliverTitle": "Kaj EYSAE prinaša",
      "deliverBody": "Projekt ustvarja učne priložnosti, aktivnosti sodelovanja, vidnostne akcije in prenosljive rezultate za mladinske delavce, mlade udeležence in partnerske organizacije."
    },
    "objectives": {
      "eyebrow": "Cilji",
      "title": "Cilji projekta",
      "obj1Title": "Krepitev zelenih kompetenc",
      "obj1Body": "Podpreti mlade pri razumevanju trajnostnega kmetijstva, okoljske odgovornosti in lokalne odpornosti.",
      "obj2Title": "Spodbujanje podjetništva",
      "obj2Body": "Spodbujati iniciativnost, inovativnost in podjetniško razmišljanje, povezano s podeželskim in trajnostnim razvojem.",
      "obj3Title": "Gradnja mednarodnega sodelovanja",
      "obj3Body": "Ustvariti močnejše sodelovanje med partnerji, skupnostmi in deležniki na področju mladih v sodelujočih državah.",
      "obj4Title": "Povečanje vidnosti in prenosljivosti",
      "obj4Body": "Deliti metode, aktivnosti in rezultate projekta na način, ki podpira širšo uporabo in dolgoročno trajnost."
    },
    "partners": {
      "eyebrow": "Partnerstvo",
      "title": "Projektni partnerji",
      "body": "EYSAE se izvaja prek partnerstva organizacij, zavezanih razvoju mladih, trajnosti, podjetništvu in evropskemu sodelovanju.",
      "p1Country": "Slovenija",
      "p1Body": "Koordinacija projekta, vodenje in podpora diseminaciji.",
      "p2Country": "Grčija",
      "p2Body": "Vključevanje mladih, izobraževalne aktivnosti in lokalna izvedba.",
      "p3Country": "Maroko",
      "p3Body": "Podpora usposabljanju, čezmejno sodelovanje in doseganje udeležencev.",
      "p4Country": "Tunizija",
      "p4Body": "Vključevanje skupnosti, metode trajnosti in sodelovanje mladih.",
      "p5Country": "Jordanija",
      "p5Body": "Komunikacijska podpora, vidnostne akcije in diseminacijski rezultati.",
      "p6Country": "Sirija",
      "p6Body": "Lokalna koordinacija, sodelovanje z deležniki in podpora pilotom."
    },
    "news": {
      "eyebrow": "Novice",
      "title": "Zadnje projektne posodobitve",
      "body": "Spremljaj zadnje vidnostne akcije, partnerske korake in izvedbene poudarke projekta EYSAE.",
      "n1Meta": "Marec 2026 Zagon projekta",
      "n1Title": "Izvajanje projekta EYSAE se uradno začenja",
      "n1Body": "Partnerji so uskladili začetne koordinacijske korake, smer vidnosti in prednostne naloge prve faze projekta.",
      "n2Meta": "Marec 2026 Priprava mobilnosti",
      "n2Title": "Priprave na mednarodne projektne aktivnosti že potekajo",
      "n2Body": "Partnerstvo razvija organizacijske korake, komunikacijska gradiva in pripravo udeležencev za prihajajoče aktivnosti sodelovanja.",
      "n3Meta": "Marec 2026 Vidnost",
      "n3Title": "Na spletni strani je uveden okvir za vidnost in outreach",
      "n3Body": "Projektna spletna stran zdaj ponuja močnejšo javno strukturo za predstavitev partnerstva, aktivnosti in prihodnjih novic.",
      "readMore": "Preberi več",
      "communityCta": "Odpri skupnostni feed"
    },
    "contact": {
      "eyebrow": "Kontakt",
      "title": "Uradni kontakt projekta",
      "body": "Za komunikacijo glede partnerstva, projektne vidnosti, izvedbe ali diseminacije se obrnite na koordinatorsko organizacijo.",
      "coordinatorLabel": "Koordinator",
      "emailLabel": "E-pošta",
      "locationLabel": "Lokacija",
      "locationValue": "Slovenija",
      "sideTitle": "Vidnost projekta in sodelovanje",
      "sideBody": "Spletna stran bo še naprej posodobljena z novicami, mejniki sodelovanja, aktivnostmi in javnimi rezultati projekta.",
      "cta": "Pošlji e-pošto"
    },
    "project": {
      "metaTitle": "EYSAE Projektna stran",
      "kicker": "Namenska projektna stran",
      "title": "Jasnejša projektna zgodba, struktura in izvedbena pot",
      "body": "Ta stran daje EYSAE lasten projektni prostor z jasnejšo zgodbo, lažjo navigacijo in več prostora za prihodnje novice, dokumente in časovnice.",
      "primaryCta": "Pojdi v skupnost",
      "secondaryCta": "Nazaj na novice",
      "pill1": "01 Jasnejši pregled projekta",
      "pill2": "02 Ločeno od scroll strani",
      "pill3": "03 Pripravljeno za mejnike in prenose",
      "overviewEyebrow": "Pregled",
      "overviewTitle": "Kaj mora ta projektna stran narediti",
      "overviewBody": "Hitro mora razložiti projekt, poenostaviti iskanje ključnih informacij in obiskovalca usmeriti na naslednji korak: partnerje, novice ali skupnostni hub.",
      "clarityTitle": "Jasnost za javnost",
      "clarityBody": "Obiskovalci takoj razumejo namen, ciljno skupino in vrednost projekta.",
      "architectureTitle": "Boljša informacijska arhitektura",
      "architectureBody": "Projekt ima zdaj namensko ciljno stran z več prostora za bogatejšo vsebino in jasnejšo navigacijo.",
      "futureTitle": "Struktura pripravljena za prihodnost",
      "futureBody": "Kasneje lahko dodaš prenosljive rezultate, strani dogodkov, galerije in podstrani partnerjev brez navlake na domači strani.",
      "blocksEyebrow": "Osrednji bloki",
      "blocksTitle": "Glavna projektna vsebina",
      "blocksBody": "Štirje osrednji vsebinski bloki ostajajo, vendar zdaj živijo v čistejši hierarhiji strani.",
      "block1Title": "Ozadje",
      "block1Body": "Pojasni, zakaj je projekt pomemben, kateri izziv naslavlja in zakaj je partnerstvo relevantno.",
      "block2Title": "Cilji",
      "block2Body": "Jasno opiši pričakovane kompetence, podjetniško miselnost in rezultate sodelovanja.",
      "block3Title": "Aktivnosti",
      "block3Body": "Pokaži, kaj ljudje v projektu dejansko počnejo, ne samo abstraktne ideje za njim.",
      "block4Title": "Rezultati",
      "block4Body": "Pokaži, kaj ostane po ciklu aktivnosti: gradiva, močnejše sodelovanje in vidni javni rezultati.",
      "timelineEyebrow": "Tok izvajanja",
      "timelineTitle": "Predlagani bloki časovnice",
      "timelineBody": "Uporabi te označevalce za pretvorbo strani v pravo projektno časovnico, ko bodo mejniki končno potrjeni.",
      "phase1Label": "Faza 1",
      "phase1Title": "Zagon in uskladitev partnerjev",
      "phase1Body": "Kick-off, uskladitev vlog, postavitev vidnosti in operativno načrtovanje.",
      "phase2Label": "Faza 2",
      "phase2Title": "Delavnice in lokalne aktivnosti",
      "phase2Body": "Praktične učne aktivnosti, lokalna mobilizacija in tematsko vključevanje.",
      "phase3Label": "Faza 3",
      "phase3Title": "Mobilnosti in izmenjave",
      "phase3Body": "Mednarodno sodelovanje, čezmejno učenje in izmenjava metod.",
      "phase4Label": "Faza 4",
      "phase4Title": "Diseminacija in skupnostno spremljanje",
      "phase4Body": "Objava rezultatov, deljenje novic in ohranjanje angažiranosti prek skupnostnega huba.",
      "ctaEyebrow": "Naslednji korak",
      "ctaTitle": "Poveži projektno stran s članskim hubom",
      "ctaBody": "Tako ljudje projekta ne bodo samo brali. Lahko se pridružijo, objavljajo, stopijo v stik in spremljajo novosti.",
      "ctaPrimary": "Odpri skupnost",
      "ctaSecondary": "Kontaktiraj koordinatorja"
    },
    "community": {
      "metaTitle": "EYSAE Skupnostni hub",
      "brandTitle": "Skupnostni hub",
      "logoutBtn": "Odjava",
      "kicker": "Prostor za člane",
      "title": "Registriraj se, objavljaj novice in piši drugim članom",
      "body": "Ta stran doda socialno plast, ki si jo želel: registracijo članov, urejanje profila, javne objave in neposredna sporočila.",
      "pill1": "Prijava — e-pošta + geslo",
      "pill2": "Feed — objave, novice in posodobitve",
      "pill3": "Inbox — zasebna sporočila članom",
      "setupTitle": "Firebase nastavitev",
      "setupNote": "Če prijava ne deluje pravilno, preveri Firebase ključe, pooblaščeno domeno in pravila Firestore.",
      "authSignedOut": "Nisi prijavljen.",
      "authEyebrow": "Prijava",
      "authTitle": "Dostop do huba",
      "signInTitle": "Prijava",
      "signInEmailLabel": "E-pošta",
      "signInPasswordLabel": "Geslo",
      "signInEmailPlaceholder": "Vnesi svoj e-poštni naslov",
      "signInPasswordPlaceholder": "Vnesi svoje geslo",
      "signInBtn": "Prijava",
      "signUpTitle": "Ustvari račun",
      "signUpNameLabel": "Prikazno ime",
      "signUpEmailLabel": "E-pošta",
      "signUpPasswordLabel": "Geslo",
      "signUpNamePlaceholder": "Tvoje prikazno ime",
      "signUpEmailPlaceholder": "Vnesi svoj e-poštni naslov",
      "signUpPasswordPlaceholder": "Ustvari geslo",
      "signUpBtn": "Ustvari račun",
      "profileEyebrow": "Profil",
      "profileTitle": "Tvoja javna članska kartica",
      "profileNameLabel": "Prikazno ime",
      "profileOrgLabel": "Organizacija / vloga",
      "profileBioLabel": "Bio",
      "profileSocialLabel": "Družbena povezava",
      "profileNamePlaceholder": "Tvoje javno ime",
      "profileOrgPlaceholder": "Organizacija ali vloga",
      "profileBioPlaceholder": "Kratka predstavitev",
      "profileSocialPlaceholder": "https://...",
      "profileSaveBtn": "Shrani profil",
      "publishEyebrow": "Objavi",
      "publishTitle": "Deli objavo ali projektno posodobitev",
      "postTypeLabel": "Vrsta objave",
      "postType1": "Projektna posodobitev",
      "postType2": "Razprava",
      "postType3": "Obvestilo",
      "postTagLabel": "Oznaka",
      "postMessageLabel": "Sporočilo",
      "postTagPlaceholder": "Kratka oznaka",
      "postMessagePlaceholder": "Napiši svojo objavo",
      "publishBtn": "Objavi",
      "feedEyebrow": "Feed",
      "feedTitle": "Najnovejša aktivnost skupnosti",
      "feedRefreshBtn": "Osveži",
      "feedEmpty": "Objav še ni.",
      "membersEyebrow": "Člani",
      "membersTitle": "Ljudje v hubu",
      "membersEmpty": "Članov še ni.",
      "inboxEyebrow": "Inbox",
      "inboxTitle": "Neposredna sporočila",
      "inboxRecipientLabel": "Pošlji komu",
      "inboxRecipientPlaceholder": "Izberi člana",
      "inboxMessageLabel": "Sporočilo",
      "inboxMessagePlaceholder": "Napiši sporočilo",
      "inboxSendBtn": "Pošlji sporočilo",
      "inboxEmpty": "Sporočil še ni.",
      "backHome": "Nazaj na domačo stran"
    }
  },
  "gr": {
    "common": {
      "openMenu": "Άνοιγμα μενού"
    },
    "brand": {
      "subtitle": "Ενδυνάμωση των νέων για βιώσιμη γεωργία και επιχειρηματικότητα"
    },
    "nav": {
      "home": "Αρχική",
      "project": "Έργο",
      "partners": "Εταίροι",
      "news": "Νέα",
      "community": "Κοινότητα",
      "contact": "Επικοινωνία"
    },
    "cta": {
      "joinHub": "Είσοδος στο Hub"
    },
    "footer": {
      "tagline": "Ιστοσελίδα έργου που παρουσιάζει συνεργασία, δραστηριότητες, προβολή και αποτελέσματα του EYSAE στο πλαίσιο του Erasmus+.",
      "navTitle": "Πλοήγηση",
      "noteTitle": "Θεσμική σημείωση",
      "noteBody": "Τα συγχρηματοδοτούμενα έργα συνεργασίας και τα σχετικά επικοινωνιακά υλικά πρέπει να τηρούν τις απαιτήσεις προβολής και αναγνώρισης του πλαισίου Erasmus+.",
      "copyright": "© 2026 EYSAE",
      "disclaimer": "Το περιεχόμενο αυτής της ιστοσελίδας αποτελεί ευθύνη της εταιρικής σύμπραξης του έργου και προορίζεται για ενημέρωση και διάδοση."
    },
    "home": {
      "metaTitle": "EYSAE — Ενδυνάμωση των νέων για βιώσιμη γεωργία και επιχειρηματικότητα",
      "kicker": "Έργο συνεργασίας Erasmus+",
      "heroTitle": "Ενδυνάμωση των νέων για βιώσιμη γεωργία και επιχειρηματικότητα",
      "heroDesc": "Το EYSAE υποστηρίζει τους νέους μέσω πρακτικής μάθησης, επιχειρηματικής σκέψης, γνώσης βιώσιμης γεωργίας και διεθνούς συνεργασίας.",
      "heroPrimaryCta": "Εξερεύνηση έργου",
      "heroSecondaryCta": "Άνοιγμα Community Hub",
      "stat1Number": "6+",
      "stat1Label": "οργανισμοί εταίροι",
      "stat2Number": "4",
      "stat2Label": "γλώσσες ιστοσελίδας",
      "stat3Number": "EU",
      "stat3Label": "νεολαία, βιωσιμότητα, κινητικότητα",
      "note1Label": "Εστίαση",
      "note1Value": "πράσινες δεξιότητες και νεανική επιχειρηματικότητα",
      "note2Label": "Προσέγγιση",
      "note2Value": "διεθνής μάθηση και τοπικός αντίκτυπος"
    },
    "framework": {
      "eyebrow": "Πλαίσιο έργου",
      "title": "Υλοποίηση στο πλαίσιο συνεργασίας Erasmus+",
      "body": "Αυτή η ιστοσελίδα παρουσιάζει τις δραστηριότητες, την εταιρική σύμπραξη, τα αποτελέσματα και τις δράσεις προβολής του έργου EYSAE σύμφωνα με τις ευρωπαϊκές προτεραιότητες για τη νεολαία, τη βιωσιμότητα και την επιχειρηματικότητα."
    },
    "hub": {
      "eyebrow": "Community Hub",
      "title": "Δώστε στο έργο πραγματικό κοινωνικό επίπεδο",
      "body": "Τα μέλη μπορούν να δημιουργούν λογαριασμούς, να δημοσιεύουν ενημερώσεις, να μοιράζονται κοινωνικούς συνδέσμους και να ανταλλάσσουν άμεσα μηνύματα σε ειδική σελίδα κοινότητας συνδεδεμένη με το Firebase.",
      "card1Title": "Εγγραφή μελών",
      "card1Body": "Πρόσβαση με email και κωδικό, με επεξεργάσιμο προφίλ, οργανισμό, ρόλο, σύντομο βιογραφικό και έναν κοινωνικό σύνδεσμο.",
      "card2Title": "Αναρτήσεις και ενημερώσεις",
      "card2Body": "Οι χρήστες μπορούν να δημοσιεύουν συζητήσεις, ενημερώσεις έργου ή ανακοινώσεις σε κοινό live feed.",
      "card3Title": "Άμεσα μηνύματα",
      "card3Body": "Τα συνδεδεμένα μέλη μπορούν να επικοινωνούν ιδιωτικά μέσω ενός ελαφρού inbox βασισμένου στο Firestore.",
      "primaryCta": "Άνοιγμα σελίδας κοινότητας",
      "secondaryCta": "Άνοιγμα σελίδας έργου"
    },
    "about": {
      "eyebrow": "Σχετικά",
      "title": "Σχετικά με το έργο",
      "body": "Το EYSAE έχει σχεδιαστεί για να ενισχύσει τις ικανότητες των νέων στη βιώσιμη γεωργία και την επιχειρηματικότητα μέσα από μάθηση, συνεργασία, πρακτική συμμετοχή και διεθνή ανταλλαγή.",
      "reasonTitle": "Γιατί έχει σημασία το έργο",
      "reasonBody": "Οι νέοι χρειάζονται πρακτικές διαδρομές για την ανάπτυξη πράσινων δεξιοτήτων, επιχειρηματικής αυτοπεποίθησης και ισχυρότερων δεσμών με βιώσιμες τοπικές οικονομίες.",
      "deliverTitle": "Τι προσφέρει το EYSAE",
      "deliverBody": "Το έργο δημιουργεί μαθησιακές ευκαιρίες, δραστηριότητες συνεργασίας, δράσεις προβολής και μεταφέρσιμα αποτελέσματα για youth workers, νέους συμμετέχοντες και εταίρους."
    },
    "objectives": {
      "eyebrow": "Στόχοι",
      "title": "Στόχοι έργου",
      "obj1Title": "Ενίσχυση πράσινων δεξιοτήτων",
      "obj1Body": "Υποστήριξη των νέων στην κατανόηση της βιώσιμης γεωργίας, της περιβαλλοντικής ευθύνης και της τοπικής ανθεκτικότητας.",
      "obj2Title": "Προώθηση επιχειρηματικότητας",
      "obj2Body": "Ενθάρρυνση πρωτοβουλίας, καινοτομίας και επιχειρηματικής σκέψης που συνδέεται με τη βιώσιμη και αγροτική ανάπτυξη.",
      "obj3Title": "Ανάπτυξη διεθνούς συνεργασίας",
      "obj3Body": "Δημιουργία ισχυρότερης συνεργασίας μεταξύ εταίρων, κοινοτήτων και ενδιαφερομένων για τη νεολαία στις συμμετέχουσες χώρες.",
      "obj4Title": "Αύξηση προβολής και μεταφερσιμότητας",
      "obj4Body": "Διάδοση μεθόδων, δραστηριοτήτων και αποτελεσμάτων του έργου με τρόπο που υποστηρίζει ευρύτερη χρήση και μακροπρόθεσμη βιωσιμότητα."
    },
    "partners": {
      "eyebrow": "Εταιρική σύμπραξη",
      "title": "Εταίροι έργου",
      "body": "Το EYSAE υλοποιείται μέσω σύμπραξης οργανισμών που δεσμεύονται για ανάπτυξη νέων, βιωσιμότητα, επιχειρηματικότητα και ευρωπαϊκή συνεργασία.",
      "p1Country": "Σλοβενία",
      "p1Body": "Συντονισμός έργου, διαχείριση και υποστήριξη διάδοσης.",
      "p2Country": "Ελλάδα",
      "p2Body": "Εμπλοκή νέων, εκπαιδευτικές δραστηριότητες και τοπική υλοποίηση.",
      "p3Country": "Μαρόκο",
      "p3Body": "Υποστήριξη κατάρτισης, διασυνοριακή συνεργασία και προσέγγιση συμμετεχόντων.",
      "p4Country": "Τυνησία",
      "p4Body": "Κοινοτική συμμετοχή, μέθοδοι βιωσιμότητας και συμμετοχή νέων.",
      "p5Country": "Ιορδανία",
      "p5Body": "Επικοινωνιακή υποστήριξη, δράσεις προβολής και αποτελέσματα διάδοσης.",
      "p6Country": "Συρία",
      "p6Body": "Τοπικός συντονισμός, συνεργασία με ενδιαφερόμενους και υποστήριξη πιλοτικών δράσεων."
    },
    "news": {
      "eyebrow": "Νέα",
      "title": "Τελευταίες ενημερώσεις έργου",
      "body": "Παρακολουθήστε τις τελευταίες δράσεις προβολής, τα βήματα της σύμπραξης και τα βασικά σημεία υλοποίησης του έργου EYSAE.",
      "n1Meta": "Μάρτιος 2026 Έναρξη έργου",
      "n1Title": "Η υλοποίηση του έργου EYSAE ξεκινά επίσημα",
      "n1Body": "Οι εταίροι ευθυγράμμισαν τα αρχικά βήματα συντονισμού, την κατεύθυνση προβολής και τις προτεραιότητες της πρώτης φάσης.",
      "n2Meta": "Μάρτιος 2026 Προετοιμασία κινητικότητας",
      "n2Title": "Οι προετοιμασίες για τις διεθνείς δραστηριότητες βρίσκονται σε εξέλιξη",
      "n2Body": "Η σύμπραξη αναπτύσσει οργανωτικά βήματα, επικοινωνιακά υλικά και προετοιμασία συμμετεχόντων για τις επερχόμενες δράσεις.",
      "n3Meta": "Μάρτιος 2026 Προβολή",
      "n3Title": "Παρουσιάστηκε στην ιστοσελίδα πλαίσιο προβολής και outreach",
      "n3Body": "Η ιστοσελίδα του έργου προσφέρει πλέον ισχυρότερη δημόσια δομή για παρουσίαση εταίρων, δραστηριοτήτων και μελλοντικών ενημερώσεων.",
      "readMore": "Διαβάστε περισσότερα",
      "communityCta": "Άνοιγμα community feed"
    },
    "contact": {
      "eyebrow": "Επικοινωνία",
      "title": "Επίσημη επικοινωνία έργου",
      "body": "Για επικοινωνία σχετικά με τη σύμπραξη, την προβολή του έργου, ζητήματα υλοποίησης ή διάδοσης, επικοινωνήστε με τον συντονιστή οργανισμό.",
      "coordinatorLabel": "Συντονιστής",
      "emailLabel": "Email",
      "locationLabel": "Τοποθεσία",
      "locationValue": "Σλοβενία",
      "sideTitle": "Προβολή έργου και συνεργασία",
      "sideBody": "Η ιστοσελίδα θα συνεχίσει να ενημερώνεται με νέα έργου, ορόσημα συνεργασίας, δραστηριότητες και δημόσια αποτελέσματα.",
      "cta": "Στείλτε email"
    },
    "project": {
      "metaTitle": "Σελίδα έργου EYSAE",
      "kicker": "Αφιερωμένη σελίδα έργου",
      "title": "Πιο καθαρή ιστορία έργου, δομή και πορεία υλοποίησης",
      "body": "Αυτή η σελίδα δίνει στο EYSAE δικό του χώρο έργου με πιο σαφή αφήγηση, ευκολότερη πλοήγηση και περισσότερο χώρο για μελλοντικές ενημερώσεις, έγγραφα και χρονοδιαγράμματα.",
      "primaryCta": "Μετάβαση στην κοινότητα",
      "secondaryCta": "Πίσω στα νέα",
      "pill1": "01 Καθαρή επισκόπηση έργου",
      "pill2": "02 Διαχωρισμός από το scroll της αρχικής",
      "pill3": "03 Έτοιμο για μελλοντικά ορόσημα και λήψεις",
      "overviewEyebrow": "Επισκόπηση",
      "overviewTitle": "Τι πρέπει να κάνει αυτή η σελίδα έργου",
      "overviewBody": "Πρέπει να εξηγεί γρήγορα το έργο, να κάνει τις βασικές πληροφορίες εύκολες στην εύρεση και να οδηγεί τον επισκέπτη στο επόμενο βήμα: εταίρους, ενημερώσεις ή το community hub.",
      "clarityTitle": "Δημόσια σαφήνεια",
      "clarityBody": "Οι επισκέπτες καταλαβαίνουν αμέσως τον σκοπό, την ομάδα-στόχο και την αξία του έργου.",
      "architectureTitle": "Καλύτερη πληροφοριακή αρχιτεκτονική",
      "architectureBody": "Το έργο διαθέτει πλέον ειδικό προορισμό με περισσότερο χώρο για πλουσιότερο περιεχόμενο και καθαρότερη πλοήγηση.",
      "futureTitle": "Δομή έτοιμη για το μέλλον",
      "futureBody": "Αργότερα μπορείτε να προσθέσετε παραδοτέα για λήψη, σελίδες εκδηλώσεων, γκαλερί και υποσελίδες εταίρων χωρίς να βαραίνει η αρχική σελίδα.",
      "blocksEyebrow": "Βασικά blocks",
      "blocksTitle": "Κύριο περιεχόμενο έργου",
      "blocksBody": "Τα τέσσερα βασικά περιεχομενικά blocks παραμένουν, αλλά τώρα βρίσκονται σε καθαρότερη ιεραρχία σελίδας.",
      "block1Title": "Υπόβαθρο",
      "block1Body": "Εξηγήστε γιατί έχει σημασία το έργο, ποια πρόκληση αντιμετωπίζει και γιατί είναι σχετική η σύμπραξη.",
      "block2Title": "Στόχοι",
      "block2Body": "Δηλώστε καθαρά τα αναμενόμενα μαθησιακά, επιχειρηματικά και συνεργατικά αποτελέσματα.",
      "block3Title": "Δραστηριότητες",
      "block3Body": "Δείξτε τι κάνουν πραγματικά οι άνθρωποι στο έργο, όχι μόνο την αφηρημένη ιδέα πίσω από αυτό.",
      "block4Title": "Αποτελέσματα",
      "block4Body": "Δείξτε τι μένει μετά τον κύκλο δραστηριοτήτων: υλικά, ισχυρότερη συνεργασία και ορατά δημόσια αποτελέσματα.",
      "timelineEyebrow": "Ροή υλοποίησης",
      "timelineTitle": "Προτεινόμενα blocks χρονοδιαγράμματος",
      "timelineBody": "Χρησιμοποιήστε αυτά τα placeholders για να μετατρέψετε τη σελίδα σε πραγματικό χρονοδιάγραμμα έργου όταν οριστικοποιηθούν τα ορόσημα.",
      "phase1Label": "Φάση 1",
      "phase1Title": "Έναρξη και ευθυγράμμιση εταίρων",
      "phase1Body": "Kick-off, ευθυγράμμιση ρόλων, setup προβολής και επιχειρησιακός σχεδιασμός.",
      "phase2Label": "Φάση 2",
      "phase2Title": "Εργαστήρια και τοπικές δράσεις",
      "phase2Body": "Πρακτικές μαθησιακές δραστηριότητες, τοπική κινητοποίηση και θεματική εμπλοκή.",
      "phase3Label": "Φάση 3",
      "phase3Title": "Κινητικότητες και ανταλλαγές",
      "phase3Body": "Διεθνής συνεργασία, διασυνοριακή μάθηση και ανταλλαγή μεθόδων.",
      "phase4Label": "Φάση 4",
      "phase4Title": "Διάδοση και συνέχεια κοινότητας",
      "phase4Body": "Δημοσίευση αποτελεσμάτων, κοινοποίηση ενημερώσεων και διατήρηση ενεργής συμμετοχής μέσω του community hub.",
      "ctaEyebrow": "Επόμενο βήμα",
      "ctaTitle": "Συνδέστε τη σελίδα έργου με το hub μελών",
      "ctaBody": "Έτσι οι άνθρωποι δεν διαβάζουν μόνο για το έργο. Μπορούν να συμμετέχουν, να δημοσιεύουν, να επικοινωνούν και να ακολουθούν ενημερώσεις.",
      "ctaPrimary": "Άνοιγμα κοινότητας",
      "ctaSecondary": "Επικοινωνία με συντονιστή"
    },
    "community": {
      "metaTitle": "EYSAE Community Hub",
      "brandTitle": "Community hub",
      "logoutBtn": "Αποσύνδεση",
      "kicker": "Χώρος μελών",
      "title": "Εγγραφείτε, δημοσιεύστε ενημερώσεις και στείλτε μηνύματα σε άλλα μέλη",
      "body": "Αυτή η σελίδα προσθέτει το κοινωνικό επίπεδο που ζητήσατε: εγγραφή μελών, επεξεργάσιμο κοινωνικό προφίλ, δημόσιες αναρτήσεις και άμεσα μηνύματα.",
      "pill1": "Auth — σύνδεση με email + κωδικό",
      "pill2": "Feed — αναρτήσεις, νέα και ενημερώσεις",
      "pill3": "Inbox — ιδιωτικά μηνύματα μελών",
      "setupTitle": "Ρύθμιση Firebase",
      "setupNote": "Επιβεβαιώστε τα κλειδιά Firebase, τον εξουσιοδοτημένο τομέα και τους κανόνες Firestore αν η σύνδεση δεν ολοκληρώνεται σωστά.",
      "authSignedOut": "Δεν είστε συνδεδεμένοι.",
      "authEyebrow": "Ταυτοποίηση",
      "authTitle": "Πρόσβαση στο hub",
      "signInTitle": "Σύνδεση",
      "signInEmailLabel": "Email",
      "signInPasswordLabel": "Κωδικός",
      "signInEmailPlaceholder": "Εισαγάγετε το email σας",
      "signInPasswordPlaceholder": "Εισαγάγετε τον κωδικό σας",
      "signInBtn": "Σύνδεση",
      "signUpTitle": "Δημιουργία λογαριασμού",
      "signUpNameLabel": "Όνομα εμφάνισης",
      "signUpEmailLabel": "Email",
      "signUpPasswordLabel": "Κωδικός",
      "signUpNamePlaceholder": "Το όνομα εμφάνισής σας",
      "signUpEmailPlaceholder": "Εισαγάγετε το email σας",
      "signUpPasswordPlaceholder": "Δημιουργήστε κωδικό",
      "signUpBtn": "Δημιουργία λογαριασμού",
      "profileEyebrow": "Προφίλ",
      "profileTitle": "Η δημόσια κάρτα μέλους σας",
      "profileNameLabel": "Όνομα εμφάνισης",
      "profileOrgLabel": "Οργανισμός / ρόλος",
      "profileBioLabel": "Βιογραφικό",
      "profileSocialLabel": "Κοινωνικός σύνδεσμος",
      "profileNamePlaceholder": "Το δημόσιο όνομά σας",
      "profileOrgPlaceholder": "Οργανισμός ή ρόλος",
      "profileBioPlaceholder": "Σύντομη εισαγωγή",
      "profileSocialPlaceholder": "https://...",
      "profileSaveBtn": "Αποθήκευση προφίλ",
      "publishEyebrow": "Δημοσίευση",
      "publishTitle": "Μοιραστείτε ανάρτηση ή ενημέρωση έργου",
      "postTypeLabel": "Τύπος ανάρτησης",
      "postType1": "Ενημέρωση έργου",
      "postType2": "Συζήτηση",
      "postType3": "Ανακοίνωση",
      "postTagLabel": "Ετικέτα",
      "postMessageLabel": "Μήνυμα",
      "postTagPlaceholder": "Σύντομη ετικέτα",
      "postMessagePlaceholder": "Γράψτε την ενημέρωσή σας",
      "publishBtn": "Δημοσίευση ανάρτησης",
      "feedEyebrow": "Feed",
      "feedTitle": "Τελευταία δραστηριότητα κοινότητας",
      "feedRefreshBtn": "Ανανέωση",
      "feedEmpty": "Δεν υπάρχουν ακόμη αναρτήσεις.",
      "membersEyebrow": "Μέλη",
      "membersTitle": "Άτομα στο hub",
      "membersEmpty": "Δεν υπάρχουν ακόμη μέλη.",
      "inboxEyebrow": "Inbox",
      "inboxTitle": "Άμεσα μηνύματα",
      "inboxRecipientLabel": "Αποστολή προς",
      "inboxRecipientPlaceholder": "Επιλέξτε μέλος",
      "inboxMessageLabel": "Μήνυμα",
      "inboxMessagePlaceholder": "Γράψτε το μήνυμά σας",
      "inboxSendBtn": "Αποστολή μηνύματος",
      "inboxEmpty": "Δεν υπάρχουν ακόμη μηνύματα.",
      "backHome": "Επιστροφή στην αρχική"
    }
  },
  "ar": {
    "common": {
      "openMenu": "فتح القائمة"
    },
    "brand": {
      "subtitle": "تمكين الشباب من الزراعة المستدامة وريادة الأعمال"
    },
    "nav": {
      "home": "الرئيسية",
      "project": "المشروع",
      "partners": "الشركاء",
      "news": "الأخبار",
      "community": "المجتمع",
      "contact": "التواصل"
    },
    "cta": {
      "joinHub": "الدخول إلى المنصة"
    },
    "footer": {
      "tagline": "موقع مشروع يعرض التعاون والأنشطة والظهور والنتائج الخاصة بمشروع EYSAE ضمن إطار Erasmus+.",
      "navTitle": "التنقل",
      "noteTitle": "ملاحظة مؤسسية",
      "noteBody": "يجب أن تعكس مشاريع التعاون الممولة والمواد الاتصالية المرتبطة بها متطلبات الظهور والاعتراف وفق إطار Erasmus+.",
      "copyright": "© 2026 EYSAE",
      "disclaimer": "محتوى هذا الموقع هو مسؤولية شراكة المشروع ويهدف إلى الإعلام والنشر."
    },
    "home": {
      "metaTitle": "EYSAE — تمكين الشباب من الزراعة المستدامة وريادة الأعمال",
      "kicker": "مشروع تعاون Erasmus+",
      "heroTitle": "تمكين الشباب من الزراعة المستدامة وريادة الأعمال",
      "heroDesc": "يدعم EYSAE الشباب من خلال التعلم العملي، والتفكير الريادي، ومعرفة الزراعة المستدامة، والتعاون الدولي.",
      "heroPrimaryCta": "استكشاف المشروع",
      "heroSecondaryCta": "فتح منصة المجتمع",
      "stat1Number": "6+",
      "stat1Label": "منظمات شريكة",
      "stat2Number": "4",
      "stat2Label": "لغات الموقع",
      "stat3Number": "EU",
      "stat3Label": "الشباب، الاستدامة، التنقل",
      "note1Label": "التركيز",
      "note1Value": "المهارات الخضراء وريادة الأعمال الشبابية",
      "note2Label": "النهج",
      "note2Value": "تعلم دولي وأثر محلي"
    },
    "framework": {
      "eyebrow": "إطار المشروع",
      "title": "يتم التنفيذ ضمن إطار التعاون Erasmus+",
      "body": "يعرض هذا الموقع الأنشطة والشراكة والنتائج وإجراءات الظهور الخاصة بمشروع EYSAE بما يتماشى مع الأولويات الأوروبية في مجالات الشباب والاستدامة وريادة الأعمال."
    },
    "hub": {
      "eyebrow": "منصة المجتمع",
      "title": "أضف للمشروع طبقة اجتماعية حقيقية",
      "body": "يمكن للأعضاء إنشاء حسابات ونشر التحديثات ومشاركة الروابط الاجتماعية وتبادل الرسائل المباشرة داخل صفحة مجتمع مخصصة متصلة بـ Firebase.",
      "card1Title": "تسجيل الأعضاء",
      "card1Body": "دخول عبر البريد الإلكتروني وكلمة المرور مع ملف شخصي قابل للتعديل يشمل المنظمة والدور ونبذة قصيرة ورابطاً اجتماعياً واحداً.",
      "card2Title": "المنشورات والتحديثات",
      "card2Body": "يمكن للمستخدمين نشر مناقشات أو تحديثات المشروع أو الإعلانات داخل موجز مباشر مشترك.",
      "card3Title": "الرسائل المباشرة",
      "card3Body": "يمكن للأعضاء المسجلين التواصل بشكل خاص عبر صندوق رسائل خفيف مبني على Firestore.",
      "primaryCta": "فتح صفحة المجتمع",
      "secondaryCta": "فتح صفحة المشروع"
    },
    "about": {
      "eyebrow": "حول",
      "title": "حول المشروع",
      "body": "تم تصميم EYSAE لتعزيز قدرات الشباب في الزراعة المستدامة وريادة الأعمال من خلال التعلم والتعاون والمشاركة العملية والتبادل الدولي.",
      "reasonTitle": "لماذا هذا المشروع مهم",
      "reasonBody": "يحتاج الشباب إلى مسارات عملية لبناء المهارات الخضراء والثقة الريادية وروابط أقوى مع الاقتصادات المحلية المستدامة.",
      "deliverTitle": "ما الذي يقدمه EYSAE",
      "deliverBody": "يوفر المشروع فرص تعلم وأنشطة تعاون وأعمال ظهور ونتائج قابلة للنقل للعاملين مع الشباب والمشاركين الشباب والمنظمات الشريكة."
    },
    "objectives": {
      "eyebrow": "الأهداف",
      "title": "أهداف المشروع",
      "obj1Title": "تعزيز الكفاءات الخضراء",
      "obj1Body": "دعم الشباب في فهم الزراعة المستدامة والمسؤولية البيئية والمرونة المحلية.",
      "obj2Title": "تعزيز ريادة الأعمال",
      "obj2Body": "تشجيع المبادرة والابتكار والتفكير الريادي المرتبط بفرص التنمية الريفية والمستدامة.",
      "obj3Title": "بناء التعاون الدولي",
      "obj3Body": "إنشاء تعاون أقوى بين الشركاء والمجتمعات وأصحاب المصلحة الشبابيين في الدول المشاركة.",
      "obj4Title": "زيادة الظهور وقابلية النقل",
      "obj4Body": "مشاركة الأساليب والأنشطة ونتائج المشروع بطريقة تدعم الاستخدام الأوسع والاستدامة طويلة المدى."
    },
    "partners": {
      "eyebrow": "الشراكة",
      "title": "شركاء المشروع",
      "body": "يتم تنفيذ EYSAE من خلال شراكة منظمات ملتزمة بتنمية الشباب والاستدامة وريادة الأعمال والتعاون الأوروبي.",
      "p1Country": "سلوفينيا",
      "p1Body": "تنسيق المشروع والإدارة ودعم النشر.",
      "p2Country": "اليونان",
      "p2Body": "إشراك الشباب والأنشطة التعليمية والتنفيذ المحلي.",
      "p3Country": "المغرب",
      "p3Body": "دعم التدريب والتعاون العابر للحدود والوصول إلى المشاركين.",
      "p4Country": "تونس",
      "p4Body": "إشراك المجتمع وأساليب الاستدامة ومشاركة الشباب.",
      "p5Country": "الأردن",
      "p5Body": "دعم التواصل وإجراءات الظهور ومخرجات النشر.",
      "p6Country": "سوريا",
      "p6Body": "تنسيق محلي وتعاون مع أصحاب المصلحة ودعم للأنشطة التجريبية."
    },
    "news": {
      "eyebrow": "الأخبار",
      "title": "أحدث تحديثات المشروع",
      "body": "تابع أحدث إجراءات الظهور وخطوات الشراكة وأبرز محطات تنفيذ مشروع EYSAE.",
      "n1Meta": "مارس 2026 إطلاق المشروع",
      "n1Title": "بدء تنفيذ مشروع EYSAE رسمياً",
      "n1Body": "قام الشركاء بمواءمة خطوات التنسيق الأولية واتجاه الظهور وأولويات المرحلة الأولى من المشروع.",
      "n2Meta": "مارس 2026 التحضير للتنقل",
      "n2Title": "التحضيرات للأنشطة الدولية للمشروع جارية",
      "n2Body": "تعمل الشراكة على تطوير الخطوات التنظيمية والمواد الاتصالية والتحضير الموجّه للمشاركين للأنشطة القادمة.",
      "n3Meta": "مارس 2026 الظهور",
      "n3Title": "إطلاق إطار الظهور والوصول عبر الموقع",
      "n3Body": "يوفر موقع المشروع الآن بنية عامة أقوى لعرض معلومات الشراكة والأنشطة والتحديثات القادمة.",
      "readMore": "اقرأ المزيد",
      "communityCta": "فتح موجز المجتمع"
    },
    "contact": {
      "eyebrow": "التواصل",
      "title": "جهة الاتصال الرسمية للمشروع",
      "body": "للتواصل بشأن الشراكة أو الظهور أو التنفيذ أو الاستفسارات المتعلقة بالنشر، يرجى التواصل مع الجهة المنسقة.",
      "coordinatorLabel": "المنسق",
      "emailLabel": "البريد الإلكتروني",
      "locationLabel": "الموقع",
      "locationValue": "سلوفينيا",
      "sideTitle": "ظهور المشروع والتعاون",
      "sideBody": "سيستمر تحديث الموقع بأخبار المشروع ومحطات التعاون والأنشطة والنتائج العامة مع تقدم التنفيذ.",
      "cta": "إرسال بريد إلكتروني"
    },
    "project": {
      "metaTitle": "صفحة مشروع EYSAE",
      "kicker": "صفحة مشروع مخصصة",
      "title": "قصة أوضح للمشروع وهيكل ومسار تنفيذ",
      "body": "تمنح هذه الصفحة مشروع EYSAE مساحة مستقلة بقصة أوضح وتنقل أسهل ومساحة أكبر للتحديثات والوثائق والجداول الزمنية مستقبلاً.",
      "primaryCta": "الذهاب إلى المجتمع",
      "secondaryCta": "العودة إلى الأخبار",
      "pill1": "01 نظرة أوضح للمشروع",
      "pill2": "02 منفصلة عن التمرير في الصفحة الرئيسية",
      "pill3": "03 جاهزة للمحطات والتنزيلات المستقبلية",
      "overviewEyebrow": "نظرة عامة",
      "overviewTitle": "ما الذي يجب أن تفعله صفحة المشروع هذه",
      "overviewBody": "يجب أن تشرح المشروع بسرعة، وتجعل المعلومات الأساسية سهلة الوصول، وتدفع الزائر إلى الخطوة التالية: الشركاء أو التحديثات أو منصة المجتمع.",
      "clarityTitle": "وضوح للجمهور",
      "clarityBody": "يفهم الزوار فوراً هدف المشروع والفئة المستهدفة وقيمته.",
      "architectureTitle": "هيكل معلومات أفضل",
      "architectureBody": "أصبح للمشروع الآن صفحة وجهة مستقلة بمساحة أكبر لمحتوى أغنى وتنقل أوضح.",
      "futureTitle": "هيكل جاهز للمستقبل",
      "futureBody": "يمكنك لاحقاً إضافة مخرجات قابلة للتنزيل وصفحات أحداث ومعارض وصفحات فرعية للشركاء دون إرباك الصفحة الرئيسية.",
      "blocksEyebrow": "الكتل الأساسية",
      "blocksTitle": "محتوى المشروع الرئيسي",
      "blocksBody": "تبقى الكتل الأربع الأساسية كما هي، لكنها أصبحت الآن ضمن هيكل صفحة أنظف.",
      "block1Title": "الخلفية",
      "block1Body": "اشرح لماذا يهم المشروع، وما التحدي الذي يعالجه، ولماذا تعد الشراكة ذات صلة.",
      "block2Title": "الأهداف",
      "block2Body": "اعرض بوضوح النتائج المتوقعة المتعلقة ببناء الكفاءات والعقلية الريادية والتعاون.",
      "block3Title": "الأنشطة",
      "block3Body": "أظهر ما يفعله الناس فعلياً في المشروع، وليس فقط الفكرة المجردة وراءه.",
      "block4Title": "النتائج",
      "block4Body": "أظهر ما يبقى بعد دورة الأنشطة: المواد والتعاون الأقوى والنتائج العامة المرئية.",
      "timelineEyebrow": "مسار التنفيذ",
      "timelineTitle": "كتل الجدول الزمني المقترحة",
      "timelineBody": "استخدم هذه العناصر النائبة لتحويل الصفحة إلى جدول زمني حقيقي للمشروع عندما يتم اعتماد المحطات النهائية.",
      "phase1Label": "المرحلة 1",
      "phase1Title": "الإطلاق ومواءمة الشركاء",
      "phase1Body": "اجتماع افتتاحي، مواءمة الأدوار، إعداد الظهور والتخطيط التشغيلي.",
      "phase2Label": "المرحلة 2",
      "phase2Title": "ورش العمل والأنشطة المحلية",
      "phase2Body": "أنشطة تعلم عملية، تعبئة محلية ومشاركة موضوعية.",
      "phase3Label": "المرحلة 3",
      "phase3Title": "التنقل ولحظات التبادل",
      "phase3Body": "تعاون دولي وتعلم عابر للحدود وتبادل للأساليب.",
      "phase4Label": "المرحلة 4",
      "phase4Title": "النشر ومتابعة المجتمع",
      "phase4Body": "نشر النتائج ومشاركة التحديثات والحفاظ على التفاعل عبر منصة المجتمع.",
      "ctaEyebrow": "الخطوة التالية",
      "ctaTitle": "اربط صفحة المشروع بمنصة الأعضاء",
      "ctaBody": "بهذه الطريقة لا يكتفي الناس بقراءة المشروع، بل يمكنهم الانضمام والنشر والتواصل ومتابعة التحديثات.",
      "ctaPrimary": "فتح المجتمع",
      "ctaSecondary": "التواصل مع المنسق"
    },
    "community": {
      "metaTitle": "منصة مجتمع EYSAE",
      "brandTitle": "منصة المجتمع",
      "logoutBtn": "تسجيل الخروج",
      "kicker": "مساحة الأعضاء",
      "title": "سجّل، وانشر التحديثات، وأرسل رسائل إلى الأعضاء الآخرين",
      "body": "تضيف هذه الصفحة الطبقة الاجتماعية التي طلبتها: تسجيل الأعضاء، ملف شخصي قابل للتعديل، منشورات عامة ورسائل مباشرة.",
      "pill1": "التوثيق — تسجيل عبر البريد وكلمة المرور",
      "pill2": "الموجز — منشورات وأخبار وتحديثات",
      "pill3": "البريد — رسائل خاصة بين الأعضاء",
      "setupTitle": "إعداد Firebase",
      "setupNote": "تحقق من مفاتيح Firebase والنطاق المصرح به وقواعد Firestore إذا لم يكتمل تسجيل الدخول بشكل صحيح.",
      "authSignedOut": "لست مسجلاً للدخول.",
      "authEyebrow": "المصادقة",
      "authTitle": "الوصول إلى المنصة",
      "signInTitle": "تسجيل الدخول",
      "signInEmailLabel": "البريد الإلكتروني",
      "signInPasswordLabel": "كلمة المرور",
      "signInEmailPlaceholder": "أدخل بريدك الإلكتروني",
      "signInPasswordPlaceholder": "أدخل كلمة المرور",
      "signInBtn": "تسجيل الدخول",
      "signUpTitle": "إنشاء حساب",
      "signUpNameLabel": "اسم العرض",
      "signUpEmailLabel": "البريد الإلكتروني",
      "signUpPasswordLabel": "كلمة المرور",
      "signUpNamePlaceholder": "اسم العرض الخاص بك",
      "signUpEmailPlaceholder": "أدخل بريدك الإلكتروني",
      "signUpPasswordPlaceholder": "أنشئ كلمة مرور",
      "signUpBtn": "إنشاء حساب",
      "profileEyebrow": "الملف الشخصي",
      "profileTitle": "بطاقة العضو العامة الخاصة بك",
      "profileNameLabel": "اسم العرض",
      "profileOrgLabel": "المنظمة / الدور",
      "profileBioLabel": "نبذة",
      "profileSocialLabel": "رابط اجتماعي",
      "profileNamePlaceholder": "اسمك العام",
      "profileOrgPlaceholder": "المنظمة أو الدور",
      "profileBioPlaceholder": "مقدمة قصيرة",
      "profileSocialPlaceholder": "https://...",
      "profileSaveBtn": "حفظ الملف الشخصي",
      "publishEyebrow": "النشر",
      "publishTitle": "شارك منشوراً أو تحديثاً للمشروع",
      "postTypeLabel": "نوع المنشور",
      "postType1": "تحديث مشروع",
      "postType2": "نقاش",
      "postType3": "إشعار",
      "postTagLabel": "وسم",
      "postMessageLabel": "الرسالة",
      "postTagPlaceholder": "وسم قصير",
      "postMessagePlaceholder": "اكتب تحديثك",
      "publishBtn": "نشر المنشور",
      "feedEyebrow": "الموجز",
      "feedTitle": "أحدث نشاط المجتمع",
      "feedRefreshBtn": "تحديث",
      "feedEmpty": "لا توجد منشورات بعد.",
      "membersEyebrow": "الأعضاء",
      "membersTitle": "الأشخاص في المنصة",
      "membersEmpty": "لا يوجد أعضاء بعد.",
      "inboxEyebrow": "البريد",
      "inboxTitle": "الرسائل المباشرة",
      "inboxRecipientLabel": "إرسال إلى",
      "inboxRecipientPlaceholder": "اختر عضواً",
      "inboxMessageLabel": "الرسالة",
      "inboxMessagePlaceholder": "اكتب رسالتك",
      "inboxSendBtn": "إرسال الرسالة",
      "inboxEmpty": "لا توجد رسائل بعد.",
      "backHome": "العودة إلى الصفحة الرئيسية"
    }
  }
};

function getNestedValue(object, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
}

function getLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && translations[saved]) return saved;
  return "en";
}

function setLanguage(lang) {
  const selected = translations[lang] ? lang : "en";
  localStorage.setItem(STORAGE_KEY, selected);
  applyLanguage(selected);
}

function applyLanguage(lang) {
  const dictionary = translations[lang] || translations.en;
  const html = document.documentElement;
  const body = document.body;

  html.lang = lang === "gr" ? "el" : lang;
  const isRTL = RTL_LANGS.has(lang);
  html.setAttribute("dir", isRTL ? "rtl" : "ltr");
  body.setAttribute("dir", isRTL ? "rtl" : "ltr");
  body.classList.toggle("is-rtl", isRTL);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = getNestedValue(dictionary, key);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const value = getNestedValue(dictionary, key);
    if (typeof value === "string") {
      element.setAttribute("placeholder", value);
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");
    const value = getNestedValue(dictionary, key);
    if (typeof value === "string") {
      element.setAttribute("aria-label", value);
    }
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
  });

  document.dispatchEvent(new CustomEvent("eysae:languagechange", { detail: { lang, dictionary } }));
}

function setupLanguageSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
}

function setupMobileNav() {
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open", !expanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

function normalisePath(pathname) {
  if (!pathname || pathname === "/") return "index.html";
  const cleaned = pathname.split("/").filter(Boolean).pop() || "index.html";
  return cleaned;
}

function setupActiveNav() {
  const current = normalisePath(window.location.pathname);
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const target = href.split("#")[0] || "index.html";
    const isHomeAnchor = current === "index.html" && href.startsWith("index.html#");
    const isMatch = target === current || (current === "projects.html" && target === "projects.html") || isHomeAnchor;
    link.classList.toggle("is-active", isMatch && !href.includes("#") ? true : (current === "index.html" && href === "index.html"));
  });

  if (current === "index.html") {
    const hash = window.location.hash;
    if (hash) {
      document.querySelectorAll('.nav-link[href^="index.html#"]').forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `index.html${hash}`);
      });
    }
  }
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="index.html#"], a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href) return;
      const id = href.includes("#") ? href.slice(href.indexOf("#")) : href;
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || !href.startsWith("index.html")) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", id);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSwitcher();
  setupMobileNav();
  setupActiveNav();
  setupSmoothScroll();
  applyLanguage(getLanguage());
});
