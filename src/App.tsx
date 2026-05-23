import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { feature } from 'topojson-client'
import { geoAlbersUsa, geoEqualEarth, geoMercator, geoPath } from 'd3-geo'
import { BookOpen, Check, ChevronRight, Globe2, Image, MapPinned, RotateCcw, X } from 'lucide-react'
import countries110m from 'world-atlas/countries-110m.json'
import usStatesAtlas from 'us-atlas/states-10m.json'
import frDepartments from './data/geo/fr-departments.json'
import frRegions from './data/geo/fr-regions.json'
import ukAdmin from './data/geo/uk-counties-unitaries-2022.json'
import './App.css'
import { topics, type MapScope, type QuizItem, type QuizMode, type Topic } from './data/curriculum'
import { resolveImageUrl } from './utils'

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }>
type BoundaryFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, string | number | null>>

type Score = {
  attempts: number
  correct: number
  streak: number
  bestStreak: number
}

type AnswerResult = {
  id: string
  ok: boolean
  prompt: string
  submitted: string
  expected: string
  expectedName: string
  submittedName: string
  insight?: AnswerInsight
  sequence?: SequenceResult
}

type AnswerInsight = {
  location?: string
  fact?: string
  note?: string
}

type PageView = 'practice' | 'course' | 'questions'

type CourseSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

type CourseArticle = {
  title: string
  deckLabel: string
  lede: string
  sections: CourseSection[]
  takeaways: string[]
}

type SequenceResult = {
  planets: Array<{
    expected: string
    submitted: string
    ok: boolean
  }>
  belt: {
    expected: string
    submitted: string
    ok: boolean
  }
  correctCount: number
  total: number
}

type RoundState = {
  index: number
  roundId: number
  order: number[]
  position: number
  deckKey: string
}

type MapView = {
  scale: number
  x: number
  y: number
}

const WIDTH = 960
const HEIGHT = 560
const defaultMapView: MapView = { scale: 1, x: 0, y: 0 }

const defaultModeLabels: Record<QuizMode, string> = {
  'map-click': 'Click location',
  'map-type': 'Name highlighted',
  type: 'Typed recall',
  choice: 'Multiple choice',
  image: 'Image typing',
  sequence: 'Order quiz',
}

function modeLabel(topic: Topic, mode: QuizMode) {
  if (topic.id === 'paintings') {
    if (mode === 'image') return 'Image: type title or artist'
    if (mode === 'choice') return 'Image: choose artist'
  }

  return defaultModeLabels[mode]
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/, '')
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function itemAnswer(item: QuizItem, mode: QuizMode) {
  if (mode === 'type' || mode === 'choice') return item.answer ?? item.name
  return item.name
}

function displayAnswer(item: QuizItem, mode: QuizMode) {
  if (mode === 'image' && item.answer) return `${item.name} / ${item.answer}`
  return itemAnswer(item, mode)
}

function removeLabel(value: string, label: string) {
  return value.replace(new RegExp(`^${label}:\\s*`, 'i'), '')
}

function answerInsight(item: QuizItem): AnswerInsight | undefined {
  const randomFact = item.facts?.length ? item.facts[Math.floor(Math.random() * item.facts.length)] : undefined
  const insight = {
    location: item.location ? removeLabel(item.location, 'Location') : undefined,
    fact: randomFact,
    note: item.detail,
  }

  return insight.location || insight.fact || insight.note ? insight : undefined
}

function matchesAnswer(input: string, item: QuizItem, mode: QuizMode) {
  const clean = normalize(input)
  const answers = [itemAnswer(item, mode), item.name, item.answer, ...(item.aliases ?? [])].filter(Boolean).map((answer) => normalize(String(answer)))
  return answers.includes(clean)
}

function matchesAsteroidBelt(input: string) {
  const clean = normalize(input)
  return clean.includes('mars') && clean.includes('jupiter')
}

function isMetropolitanFrance(item: QuizItem) {
  return typeof item.lat === 'number' && typeof item.lon === 'number' &&
    item.lat >= 41 && item.lat <= 52 &&
    item.lon >= -5 && item.lon <= 10
}

function poolForTopic(topic: Topic, mode: QuizMode) {
  if ((mode === 'map-click' || mode === 'map-type') && topic.mapScope === 'france') {
    return topic.items.filter(isMetropolitanFrance)
  }
  return topic.items
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function createRoundState(pool: QuizItem[], roundId = 0, firstIndex?: number): RoundState {
  if (!pool.length) {
    return {
      index: 0,
      roundId,
      order: [],
      position: 0,
      deckKey: deckKey(pool),
    }
  }

  const indexes = pool.map((_, index) => index)
  const order = shuffle(indexes)
  const validFirstIndex = typeof firstIndex === 'number' && firstIndex >= 0 && firstIndex < pool.length ? firstIndex : undefined
  const ordered = validFirstIndex === undefined ? order : [validFirstIndex, ...order.filter((index) => index !== validFirstIndex)]

  return {
    index: ordered[0],
    roundId,
    order: ordered,
    position: 0,
    deckKey: deckKey(pool),
  }
}

function ensureRoundState(state: RoundState | undefined, pool: QuizItem[]) {
  if (!isRoundStateValid(state, pool)) {
    return createRoundState(pool, state?.roundId ?? 0, state?.index)
  }

  return state as RoundState
}

function isRoundStateValid(state: RoundState | undefined, pool: QuizItem[]) {
  if (!state?.order?.length) return false
  const uniqueOrder = new Set(state?.order ?? [])

  return (
    state.deckKey === deckKey(pool) &&
    state.order.length === pool.length &&
    uniqueOrder.size === state.order.length &&
    state.position >= 0 &&
    state.position < state.order.length &&
    state.order.every((index) => index >= 0 && index < pool.length)
  )
}

function deckKey(pool: QuizItem[]) {
  return pool.map((item) => item.id).join('|')
}

function clampMapView(view: MapView): MapView {
  if (view.scale <= 1) return defaultMapView
  const minX = WIDTH - WIDTH * view.scale
  const minY = HEIGHT - HEIGHT * view.scale

  return {
    scale: view.scale,
    x: Math.min(0, Math.max(minX, view.x)),
    y: Math.min(0, Math.max(minY, view.y)),
  }
}

function scoreKey(topic: Topic, mode: QuizMode) {
  return `${topic.id}:${mode}`
}

function roundKey(topic: Topic, mode?: QuizMode) {
  if (mode && (mode === 'map-click' || mode === 'map-type') && topic.mapScope === 'france') {
    return `${topic.id}:map`
  }
  return topic.id
}

function loadScores(): Record<string, Score> {
  try {
    return JSON.parse(localStorage.getItem('culture-quizzer-scores') ?? '{}')
  } catch {
    return {}
  }
}

function saveScores(scores: Record<string, Score>) {
  localStorage.setItem('culture-quizzer-scores', JSON.stringify(scores))
}

function buildProjection(scope: MapScope) {
  if (scope === 'usa') {
    return geoAlbersUsa().translate([WIDTH / 2, HEIGHT / 2]).scale(980)
  }

  const projection = scope === 'world' ? geoEqualEarth() : geoMercator()
  if (scope === 'world') return projection.translate([WIDTH / 2, HEIGHT / 2]).scale(168)
  if (scope === 'europe') return projection.center([10, 51]).scale(760).translate([WIDTH / 2, HEIGHT / 2])
  if (scope === 'uk') return projection.center([-3.3, 55.2]).scale(2450).translate([WIDTH / 2, HEIGHT / 2])
  return projection.center([2.7, 46.4]).scale(1900).translate([WIDTH / 2, HEIGHT / 2])
}

function countryItemsFromFeatures(features: CountryFeature[]): QuizItem[] {
  return features
    .map((country) => ({
      id: normalize(country.properties.name).replaceAll(' ', '-'),
      name: country.properties.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function asFeatures(collection: unknown): BoundaryFeature[] {
  return (collection as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number | null>>).features
}

function usStateFeatures() {
  const collection = feature(usStatesAtlas as never, (usStatesAtlas as never as { objects: { states: never } }).objects.states)
  return (collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number | null>>).features
}

const boundaryFeatures = {
  'fr-departments': asFeatures(frDepartments),
  'fr-regions': asFeatures(frRegions),
  'uk-admin': asFeatures(ukAdmin),
  'us-states': usStateFeatures(),
}

function boundaryName(featureItem: BoundaryFeature) {
  const properties = featureItem.properties
  return String(properties.nom ?? properties.CTYUA22NM ?? properties.name ?? '')
}

function promptLabel(topic: Topic, mode: QuizMode, item: QuizItem) {
  if (topic.id === 'paintings' && mode === 'image') return 'Painting image'
  if (topic.id === 'paintings' && mode === 'choice') return 'Painting artist'
  if (mode === 'map-click') return `Click ${item.name}`
  if (mode === 'map-type') return 'Highlighted target'
  return item.prompt ?? item.name
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TopicIcon({ topic }: { topic: Topic }) {
  if (topic.group === 'Art') return <Image size={18} />
  if (topic.group === 'Geography') return <MapPinned size={18} />
  if (topic.group === 'Science') return <Globe2 size={18} />
  return <BookOpen size={18} />
}

const courseArticles: Record<string, CourseArticle> = {
  'political-systems': {
    title: 'How Four Political Systems Work',
    deckLabel: 'Constitutional mechanics',
    lede: 'This course is about the rules of the game: who gets power, who can block whom, how leaders are chosen, and where people often confuse institutions with similar names.',
    sections: [
      {
        heading: 'France: a semi-presidential republic',
        paragraphs: [
          'France gives real power to both an elected president and a government led by a prime minister. The president is elected directly and is strongest in foreign policy, defence, appointments, and national direction. The prime minister runs the government day to day and must survive politically in the National Assembly.',
          'When the president and the Assembly majority come from the same camp, the president dominates the system. When they come from opposing camps, France enters cohabitation: the president remains head of state, but domestic policy shifts toward the prime minister and parliamentary majority.',
        ],
        bullets: [
          'The National Assembly is the lower house and can bring down the government through a censure motion.',
          'The Senate is elected indirectly and represents territorial communities.',
          'The Constitutional Council reviews whether laws fit the Constitution.',
          'Article 11 allows some bills to be submitted to referendum; Article 89 is the normal amendment route.',
        ],
      },
      {
        heading: 'The United Kingdom: parliamentary government without one written constitution',
        paragraphs: [
          'The UK is a constitutional monarchy and parliamentary democracy. The monarch is head of state, but political authority rests with ministers who must command the confidence of the House of Commons. The prime minister is not directly elected as prime minister; they are appointed because they can lead a Commons majority or workable government.',
          'The UK constitution is spread across statutes, court decisions, conventions, and political practice. That makes conventions important: ministerial responsibility, the monarch acting on advice, and the Sewel convention all shape behaviour even when they are not ordinary enforceable rules.',
        ],
        bullets: [
          'General elections use First Past the Post in single-member constituencies.',
          'The House of Commons controls confidence, taxation, and money bills.',
          'The House of Lords revises and delays legislation but is weaker than the Commons.',
          'Devolution gives Scotland, Wales, and Northern Ireland powers over areas such as health and education.',
        ],
      },
      {
        heading: 'The European Union: shared law between states',
        paragraphs: [
          'The European Union is not a normal state and not just an international club. It is a legal and political system where member states share powers in defined areas. The useful shortcut is to separate agenda-setting, law-making, execution, and interpretation.',
          'The European Commission usually proposes legislation and enforces EU law. The European Parliament is directly elected by EU citizens. The Council of the EU represents national ministers and passes legislation with Parliament. The European Council is different: it is the summit of heads of state or government and sets broad direction.',
        ],
        bullets: [
          'Do not confuse the European Council with the Council of the EU.',
          'The Schengen Area concerns border controls; the Eurozone concerns the euro.',
          'The Court of Justice of the EU interprets EU law.',
        ],
      },
      {
        heading: 'The United States: separated powers and federalism',
        paragraphs: [
          'The United States is a federal presidential republic. The president is separately elected from Congress, so the executive does not need day-to-day confidence from the legislature. Congress writes laws and controls money. The courts can review laws and executive action.',
          'Federalism matters as much as separation of powers. The federal government and the states each have their own constitutional roles. Every state has two senators regardless of population, while House seats are population-based. Presidents are chosen through the Electoral College, where a candidate needs a majority of electoral votes.',
        ],
        bullets: [
          'Judicial review is associated with Marbury v. Madison.',
          'The First Amendment protects speech, religion, press, assembly, and petition.',
          'Checks and balances are the tools each branch uses; separation of powers is the division of jobs.',
        ],
      },
    ],
    takeaways: ['France mixes president and parliament.', 'The UK government lives or dies by Commons confidence.', 'The EU separates Commission, Parliament, Council, and European Council.', 'The US separates executive, legislature, courts, and federal/state power.'],
  },
  'history-outline': {
    title: 'Scotland, England, and France: the broad outline',
    deckLabel: 'Historical scaffolding',
    lede: 'This course gives the big chapters first. The dates and names in the quiz are anchors for a mental timeline, not isolated trivia.',
    sections: [
      {
        heading: 'Scotland: from Alba to devolution',
        paragraphs: [
          'Early Scotland was shaped by Picts, Gaels, Britons, Angles, and Vikings. The kingdom of Alba gradually became the core of medieval Scotland. The Wars of Independence then created the heroic memory of William Wallace and Robert the Bruce.',
          'The Union of the Crowns in 1603 joined the Scottish and English crowns under James VI and I, but the parliaments stayed separate. The Acts of Union in 1707 created the Parliament of Great Britain. Later, the Scottish Enlightenment made Edinburgh a centre of philosophy, economics, medicine, and science. Modern devolution restored a Scottish Parliament after the 1997 referendum.',
        ],
      },
      {
        heading: 'England: conquest, parliament, and empire',
        paragraphs: [
          'Roman Britain begins with Claudius in 43 CE, followed by Anglo-Saxon kingdoms after Roman withdrawal. The Norman Conquest in 1066 is the major hinge: William of Normandy defeats Harold Godwinson and reshapes landholding, language, and monarchy.',
          'Magna Carta in 1215 becomes a symbolic limit on royal power. The English Civil War pits Royalists against Parliamentarians and ends with the execution of Charles I. The Glorious Revolution of 1688 confirms parliamentary supremacy. Victorian Britain then combines industrialisation, social reform, and imperial expansion.',
        ],
      },
      {
        heading: 'France: dynasties, revolution, republic',
        paragraphs: [
          'The simple royal sequence to remember is Merovingian, Carolingian, Capetian, Valois, Bourbon. The Hundred Years War turns dynastic conflict into national memory, with Joan of Arc fighting for France. The Wars of Religion then divide Catholics and Protestants until the Edict of Nantes.',
          'The French Revolution begins in 1789 and breaks the Bourbon monarchy. Napoleon turns revolutionary France into empire, then Waterloo ends his final return to power. The Third Republic anchors secular republican France; the Fifth Republic, created in 1958 by Charles de Gaulle, is the current strong-presidency system.',
        ],
      },
    ],
    takeaways: ['1603 joins crowns; 1707 joins parliaments.', '1066, 1215, 1642-1651, and 1688 are core English anchors.', 'French history moves from dynasties to Revolution, Napoleon, and republics.'],
  },
  'empires-battles': {
    title: 'Empires and Battles as Timeline Anchors',
    deckLabel: 'Power, territory, and turning points',
    lede: 'The purpose of this course is not to memorise every campaign. It is to know which powers mattered, roughly when they existed, where they were, and why a few battles became turning points.',
    sections: [
      {
        heading: 'Ancient imperial models',
        paragraphs: [
          'The Achaemenid Persian Empire is the first huge Near Eastern empire to keep in mind, stretching from Iran toward Egypt and Anatolia. Alexander the Great destroys it and briefly creates a Macedonian empire from Greece to the edge of India.',
          'Rome is the central Mediterranean empire: republic, then empire, then a western fall in 476 CE while the eastern Byzantine Empire continues from Constantinople until 1453. These states become reference points for law, roads, citizenship, Christianity, and imperial prestige.',
        ],
      },
      {
        heading: 'Medieval and early modern empires',
        paragraphs: [
          'The Abbasid Caliphate is tied to Baghdad and the House of Wisdom. The Mongol Empire is the great land empire of Eurasia. The Ottoman Empire takes Constantinople in 1453 and controls major territory across the Middle East, Balkans, and North Africa.',
          'The Mughal Empire rules much of India. The Spanish and Portuguese empires open the age of oceanic empire in the Americas, Africa, and Asia. Dutch, British, French, Russian, Qing, Inca, and other empires show that expansion happened by sea, steppe, trade, conquest, and bureaucracy.',
        ],
      },
      {
        heading: 'Battles as memory hooks',
        paragraphs: [
          'A few battles stand in for larger historical changes. Marathon and Thermopylae anchor the Greek-Persian wars. Cannae shows Hannibal at his tactical peak against Rome. Tours is remembered in Frankish and Islamic expansion narratives. Agincourt anchors the Hundred Years War.',
          'Yorktown helps end the American Revolutionary War. Trafalgar secures British naval dominance. Austerlitz is Napoleon at his best; Waterloo ends him. Gettysburg turns the US Civil War. Stalingrad and Midway mark World War II turning points, and Normandy opens the road to the liberation of Western Europe.',
        ],
      },
    ],
    takeaways: ['Empires are remembered by era, core territory, and ruling logic.', 'Battles are useful when they mark a turning point or symbol.', 'Know the ancient, medieval, early modern, and modern sequence before details.'],
  },
  'modern-leaders': {
    title: 'France and UK Leaders Since 1960',
    deckLabel: 'Modern political chronology',
    lede: 'This course gives the basic line of political leadership in Britain and France since 1960. The goal is to recognise the order and the political context attached to each name.',
    sections: [
      {
        heading: 'Britain: postwar consensus to Brexit and after',
        paragraphs: [
          'At the start of 1960, Harold Macmillan leads Conservative Britain. Alec Douglas-Home briefly follows, then Labour returns with Harold Wilson. Edward Heath takes Britain into the European Communities in 1973. James Callaghan ends the 1970s Labour period.',
          'Margaret Thatcher dominates 1979-1990 with privatisation, union conflict, and a new Conservative settlement. John Major follows, then Tony Blair brings New Labour landslides in 1997, 2001, and 2005. Gordon Brown handles the financial crisis period. David Cameron leads coalition government and the Brexit referendum. Theresa May negotiates Brexit, Boris Johnson wins the 2019 majority, Liz Truss is shortest-serving PM, Rishi Sunak follows, and Keir Starmer becomes prime minister on 5 July 2024.',
        ],
      },
      {
        heading: 'France: Fifth Republic presidents',
        paragraphs: [
          'Charles de Gaulle creates and leads the Fifth Republic. Georges Pompidou continues Gaullist modernisation. Valery Giscard d Estaing represents liberal centre-right reform. Francois Mitterrand is the great Socialist president, serving from 1981 to 1995.',
          'Jacques Chirac follows from 1995 to 2007. Nicolas Sarkozy serves 2007-2012. Francois Hollande serves 2012-2017. Emmanuel Macron, first elected in 2017, is president as of May 2026.',
        ],
      },
      {
        heading: 'Prime ministers matter differently',
        paragraphs: [
          'In Britain, the prime minister is the central executive figure because the system is parliamentary. In France, the president is usually the headline executive figure, but prime ministers become especially important during cohabitation or major domestic reform periods.',
          'For France, know a few prime minister anchors: Pompidou before becoming president, Chaban-Delmas under Pompidou, Mauroy under Mitterrand, Balladur and Jospin during cohabitations, Fillon under Sarkozy, Valls under Hollande, and Edouard Philippe under Macron.',
        ],
      },
    ],
    takeaways: ['UK leadership is a prime-ministerial sequence.', 'French leadership is primarily a presidential sequence.', 'French prime ministers are crucial context, especially under cohabitation.'],
  },
  'classical-music': {
    title: 'Classical Music Movements in Europe',
    deckLabel: 'Periods, composers, anchor works',
    lede: 'Classical music is easiest to remember as a sequence of styles. Each period has a sound-world, a social setting, and a few composers whose works become anchors.',
    sections: [
      {
        heading: 'From medieval chant to Renaissance polyphony',
        paragraphs: [
          'Medieval music is tied to church, chant, and early notation. Hildegard of Bingen is a rare named medieval composer whose liturgical music survives with a strong personality.',
          'Renaissance music develops smoother polyphony: several independent vocal lines balanced together. Palestrina is the clean mental anchor for sacred Renaissance choral music, especially the Missa Papae Marcelli.',
        ],
      },
      {
        heading: 'Baroque and Classical balance',
        paragraphs: [
          'Baroque music loves contrast, basso continuo, ornament, and expressive drive. Bach stands for contrapuntal mastery, Vivaldi for the concerto and The Four Seasons, Handel for large public works such as Messiah.',
          'The Classical era aims for clarity, balance, and form. Haydn develops the symphony and string quartet. Mozart combines elegance, drama, and melody. Beethoven begins in Classical form but pushes toward Romantic intensity.',
        ],
      },
      {
        heading: 'Romanticism and modernism',
        paragraphs: [
          'Romantic music expands emotion, colour, virtuosity, nationalism, and the scale of orchestra and opera. Schubert, Chopin, Liszt, Wagner, Verdi, Brahms, Tchaikovsky, Mahler, and Puccini are core anchors.',
          'Around 1900, modernism fragments the old language. Debussy and Ravel explore colour and ambiguity. Stravinsky makes rhythm and shock central in The Rite of Spring. Schoenberg develops twelve-tone technique. Bartok, Gershwin, and Copland connect modernism with folk, jazz, and national sound.',
        ],
      },
    ],
    takeaways: ['Medieval and Renaissance are vocal and church-centred.', 'Baroque is contrast and counterpoint; Classical is balance and form.', 'Romanticism expands emotion; modernism breaks old rules.'],
  },
  'art-movements-sculpture': {
    title: 'Painting Movements and Sculpture',
    deckLabel: 'Visual culture timeline',
    lede: 'This course is organised chronologically. The aim is to recognise the movement by its visual logic, then attach a few artists and masterpieces to that style.',
    sections: [
      {
        heading: 'Medieval foundations: Byzantine, Romanesque, Gothic',
        paragraphs: [
          'Byzantine art is tied to the Eastern Roman and Orthodox Christian world: gold grounds, icons, mosaics, and sacred frontality. The goal is not realism but spiritual presence. Ravenna mosaics and Christ Pantocrator icons are useful anchors.',
          'Gothic art grows in medieval Europe with cathedrals, stained glass, pointed arches, and devotional imagery. Chartres is the architectural and stained-glass anchor. Late Gothic and early Italian painting begin to move toward more human space and emotion.',
        ],
      },
      {
        heading: 'Renaissance to Baroque: human form, space, drama',
        paragraphs: [
          'The Renaissance turns toward classical antiquity, anatomy, perspective, and the dignity of the human figure. Leonardo, Michelangelo, and Raphael are the central High Renaissance names. In sculpture, Donatello and Michelangelo make the human body a vehicle for civic and spiritual force.',
          'Baroque art keeps technical mastery but adds movement, theatrical light, and emotional drama. Caravaggio uses sharp light and ordinary bodies; Rubens uses energy and flesh; Rembrandt turns light into psychology. Bernini is the great Baroque sculptor, making marble feel like action.',
        ],
      },
      {
        heading: 'Eighteenth and nineteenth centuries: taste, reason, emotion, reality',
        paragraphs: [
          'Rococo is elegant, playful, decorative, and aristocratic. Neoclassicism reacts with moral seriousness and ancient Roman clarity: David and Ingres are core names. Canova is the sculpture anchor for polished Neoclassical ideal beauty.',
          'Romanticism values emotion, nature, violence, and the sublime; Delacroix, Gericault, and Turner are strong anchors. Realism turns away from myth and courtly polish toward ordinary labour and modern life, with Courbet and Millet.',
        ],
      },
      {
        heading: 'Modern movements: seeing breaks apart',
        paragraphs: [
          'Impressionism studies light, colour, and modern leisure with visible brushwork; Monet, Renoir, and Degas are central. Fauvism pushes colour away from naturalism through Matisse and Derain. Expressionism makes inner emotion more important than outward accuracy.',
          'Cubism, led by Picasso and Braque, breaks objects into multiple viewpoints. Surrealism, with Dali and Magritte, makes dream logic visible. Abstract Expressionism, Pop Art, Art Nouveau, and Minimalism each teach a different modern idea: gesture, mass culture, decorative organic line, and reduction to simple form.',
        ],
      },
      {
        heading: 'Sculpture anchors',
        paragraphs: [
          'For broad culture, know the sculptural line from Phidias and Myron in ancient Greece, through Donatello and Michelangelo in the Renaissance, Bernini in the Baroque, Canova in Neoclassicism, Rodin in modern expressive sculpture, then Brancusi, Henry Moore, and Giacometti in modern abstraction and existential form.',
        ],
      },
    ],
    takeaways: ['Renaissance: perspective and ideal human form.', 'Baroque: drama, movement, light.', 'Impressionism onward: modern vision breaks into colour, viewpoint, dream, gesture, mass culture, and abstraction.'],
  },
  'philosophy-literature': {
    title: 'Philosophy, Poetry, and Books',
    deckLabel: 'Ideas and literary canon',
    lede: 'This course turns a long cultural list into a map: ancient ethics and metaphysics, early modern knowledge and politics, modern freedom and society, then poets and books that became global reference points.',
    sections: [
      {
        heading: 'Ancient and medieval philosophy',
        paragraphs: [
          'Socrates stands for questioning and the examined life. Plato turns that questioning into dialogues about justice, forms, education, and the ideal city. Aristotle is more systematic, writing on ethics, politics, logic, biology, rhetoric, and tragedy.',
          'Stoicism teaches virtue, reason, and discipline toward what cannot be controlled. Confucius anchors a different tradition: moral cultivation, ritual, hierarchy, and filial piety. Thomas Aquinas later synthesises Aristotle with Christian theology in medieval scholasticism.',
        ],
      },
      {
        heading: 'Modern philosophy: knowledge, politics, freedom',
        paragraphs: [
          'Descartes begins from doubt and the thinking self. Hume pushes empiricism and scepticism. Kant tries to answer Hume by explaining the structures that make experience possible. Rousseau makes popular sovereignty and the social contract central to modern politics.',
          'Mill gives liberalism and utilitarianism a classic voice. Marx analyses capitalism, class, and historical change. Nietzsche attacks inherited morality and religion. Existentialism and Simone de Beauvoir put freedom, responsibility, ambiguity, and gender at the centre.',
        ],
      },
      {
        heading: 'Poetry and books as cultural anchors',
        paragraphs: [
          'Homer anchors epic poetry with the Iliad and Odyssey. Dante turns Christian cosmology into the Divine Comedy. Shakespeare is both poet and playwright. Milton gives English epic its great religious-political monument in Paradise Lost.',
          'The novel canon starts with landmarks such as The Tale of Genji and Don Quixote, then expands through Austen, Dickens, Tolstoy, Dostoevsky, Joyce, Orwell, and Garcia Marquez. The point is to know author, title, period, and the broad cultural role of the work.',
        ],
      },
    ],
    takeaways: ['Ancient philosophy asks how to live and what is real.', 'Modern philosophy asks how we know, govern, and choose.', 'Literary anchors connect title, author, period, and cultural role.'],
  },
}

function CoursePanel({ article }: { article: CourseArticle }) {
  return (
    <section className="course-surface">
      <div className="course-header">
        <span className="eyebrow">Course</span>
        <h2>{article.title}</h2>
        <p>{article.lede}</p>
      </div>

      <article className="course-article">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <aside className="course-takeaways">
          <h3>What to know by heart</h3>
          <ul>
            {article.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </aside>
      </article>
    </section>
  )
}

function QuestionReferencePanel({ topic, article }: { topic: Topic; article?: CourseArticle }) {
  return (
    <section className="course-surface">
      <div className="course-header">
        <span className="eyebrow">Question list</span>
        <h2>{topic.title}</h2>
        <p>{article ? `Practice prompts for the ${article.deckLabel.toLowerCase()} deck.` : topic.coverage}</p>
      </div>

      <div className="question-reference-list">
        {topic.items.map((item) => {
          const answer = item.answer && normalize(item.answer) !== normalize(item.name) ? item.answer : undefined
          return (
            <article key={item.id} className="question-reference-row">
              <div>
                <strong>{item.prompt ?? item.name}</strong>
                <span>{answer ?? item.name}</span>
              </div>
              <p>{item.detail ?? item.location ?? item.era ?? topic.coverage}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CultureMap({
  topic,
  mode,
  current,
  items,
  countries,
  review,
  onPick,
}: {
  topic: Topic
  mode: QuizMode
  current: QuizItem
  items: QuizItem[]
  countries: CountryFeature[]
  review?: AnswerResult
  onPick: (item: QuizItem) => void
}) {
  const projection = useMemo(() => buildProjection(topic.mapScope ?? 'world'), [topic.mapScope])
  const path = useMemo(() => geoPath(projection), [projection])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; view: MapView } | null>(null)
  const [mapView, setMapView] = useState<MapView>(defaultMapView)
  const countriesByName = useMemo(() => new Map(countries.map((country) => [normalize(country.properties.name), country])), [countries])
  const itemNameSet = useMemo(() => new Set(items.map((item) => normalize(item.name))), [items])
  const boundaries = useMemo(() => {
    const allBoundaries = topic.boundaryLayer ? boundaryFeatures[topic.boundaryLayer] : []
    if (topic.boundaryLayer !== 'us-states') return allBoundaries
    return allBoundaries.filter((boundary) => itemNameSet.has(normalize(boundaryName(boundary))))
  }, [itemNameSet, topic.boundaryLayer])
  const itemsByName = useMemo(() => new Map(items.map((item) => [normalize(item.name), item])), [items])
  const currentBoundary = useMemo(() => boundaries.find((boundary) => normalize(boundaryName(boundary)) === normalize(current.name)), [boundaries, current.name])

  const currentCountry = topic.mapKind === 'country-polygons' ? countriesByName.get(normalize(current.name)) : undefined
  const canClickBoundaries = Boolean((topic.boundaryLayer?.startsWith('fr-') || topic.boundaryLayer === 'us-states') && mode === 'map-click')
  const showCountryLayer = topic.boundaryLayer !== 'us-states'
  const expectedName = review ? normalize(review.expectedName) : ''
  const submittedName = review ? normalize(review.submittedName) : ''
  const mapTransform = `translate(${mapView.x} ${mapView.y}) scale(${mapView.scale})`

  function zoomAt(clientX: number, clientY: number, direction: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const pointX = ((clientX - rect.left) / rect.width) * WIDTH
    const pointY = ((clientY - rect.top) / rect.height) * HEIGHT

    setMapView((previous) => {
      const nextScale = Math.min(12, Math.max(1, previous.scale * (direction > 0 ? 1.22 : 1 / 1.22)))
      const ratio = nextScale / previous.scale
      return clampMapView({
        scale: nextScale,
        x: pointX - (pointX - previous.x) * ratio,
        y: pointY - (pointY - previous.y) * ratio,
      })
    })
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1)
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (mapView.scale <= 1) return
    dragRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, view: mapView }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    const svg = svgRef.current
    if (!drag || !svg || drag.pointerId !== event.pointerId) return
    const rect = svg.getBoundingClientRect()
    const dx = ((event.clientX - drag.clientX) / rect.width) * WIDTH
    const dy = ((event.clientY - drag.clientY) / rect.height) * HEIGHT
    setMapView(clampMapView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy }))
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  function setZoom(direction: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, direction)
  }

  return (
    <div className="map-shell">
      <div className="map-zoom-controls" aria-label="Map zoom controls">
        <button type="button" onClick={() => setZoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => setZoom(-1)} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={() => setMapView(defaultMapView)} aria-label="Reset zoom">
          {mapView.scale.toFixed(1)}x
        </button>
      </div>
      <svg
        ref={svgRef}
        className={mapView.scale > 1 ? 'map map-zoomed' : 'map'}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${topic.title} map quiz`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect width={WIDTH} height={HEIGHT} rx="0" className="ocean" />
        <g transform={mapTransform}>
          {showCountryLayer ? (
            <g>
              {countries.map((country) => {
                const name = country.properties.name
                const isTarget = normalize(name) === normalize(current.name)
                const isExpected = review && normalize(name) === expectedName
                const isWrongPick = review && !review.ok && normalize(name) === submittedName
                const isInteractive = topic.mapKind === 'country-polygons' && mode === 'map-click'
                const klass = [
                  'country',
                  isInteractive && !review ? 'country-clickable' : '',
                  mode === 'map-type' && isTarget ? 'target-country' : '',
                  isExpected ? 'correct-country' : '',
                  isWrongPick ? 'wrong-country' : '',
                ].join(' ')

                return (
                  <path
                    key={name}
                    className={klass}
                    d={path(country) ?? undefined}
                    onClick={isInteractive && !review ? () => onPick({ id: normalize(name), name }) : undefined}
                  />
                )
              })}
            </g>
          ) : null}

          {boundaries.length ? (
            <g className="boundary-layer">
              {boundaries.map((boundary, index) => {
                const name = boundaryName(boundary)
                const isTarget = normalize(name) === normalize(current.name)
                const isExpected = review && normalize(name) === expectedName
                const isWrongPick = review && !review.ok && normalize(name) === submittedName
                const matchedItem = itemsByName.get(normalize(name)) ?? { id: normalize(name), name }
                const klass = [
                  'boundary-area',
                  canClickBoundaries && !review ? 'boundary-clickable' : '',
                  mode === 'map-type' && isTarget ? 'target-boundary' : '',
                  isExpected ? 'correct-boundary' : '',
                  isWrongPick ? 'wrong-boundary' : '',
                ].join(' ')

                return <path key={`${name}-${index}`} className={klass} d={path(boundary) ?? undefined} onClick={canClickBoundaries && !review ? () => onPick(matchedItem) : undefined} />
              })}
            </g>
          ) : null}

          {topic.mapKind === 'country-polygons' && mode === 'map-type' && currentCountry ? (
            <path className="target-outline" d={path(currentCountry) ?? undefined} />
          ) : null}

          {topic.mapKind === 'points' && mode === 'map-type' && currentBoundary ? <path className="target-outline" d={path(currentBoundary) ?? undefined} /> : null}

          {topic.mapKind === 'points'
            ? items.map((item) => {
                if (typeof item.lat !== 'number' || typeof item.lon !== 'number') return null
                const point = projection([item.lon, item.lat])
                if (!point) return null
                const isTarget = item.id === current.id
                const isExpected = review && normalize(item.name) === expectedName
                const isWrongPick = review && !review.ok && normalize(item.name) === submittedName
                const pointClass = [
                  'map-point',
                  mode === 'map-click' && !review ? 'map-point-clickable' : '',
                  mode === 'map-type' && isTarget ? 'map-point-target' : '',
                  isExpected ? 'map-point-correct' : '',
                  isWrongPick ? 'map-point-wrong' : '',
                ].join(' ')
                return (
                  <g key={item.id} transform={`translate(${point[0]} ${point[1]})`} onClick={mode === 'map-click' && !review ? () => onPick(item) : undefined}>
                    {mode === 'map-click' && !review ? <circle className="map-point-hit" r={9} /> : null}
                    <circle className={pointClass} r={isTarget && mode !== 'map-click' ? 5 : 3} />
                    {isTarget && mode !== 'map-click' ? <circle className="map-point-pulse" r={10} /> : null}
                  </g>
                )
              })
            : null}
        </g>
      </svg>
    </div>
  )
}

function QuizPanel({
  topic,
  mode,
  item,
  pool,
  history,
  review,
  onSubmit,
  onNext,
}: {
  topic: Topic
  mode: QuizMode
  item: QuizItem
  pool: QuizItem[]
  history: AnswerResult[]
  review?: AnswerResult
  onSubmit: (value: string) => void
  onNext: () => void
}) {
  const [input, setInput] = useState('')
  const options = useMemo(() => {
    const answer = itemAnswer(item, mode)
    const distractors = shuffle(pool.filter((candidate) => candidate.id !== item.id).map((candidate) => itemAnswer(candidate, mode))).slice(0, 3)
    return shuffle([answer, ...distractors])
  }, [item, mode, pool])

  const title =
    topic.id === 'paintings' && mode === 'image'
      ? 'Name this painting or artist'
      : topic.id === 'paintings' && mode === 'choice'
        ? 'Choose the artist'
        : mode === 'map-click'
          ? `Click: ${item.name}`
          : mode === 'map-type'
            ? 'Name the highlighted target'
            : mode === 'image'
              ? item.prompt ?? 'Name this work or artist'
              : item.prompt ?? `Answer for ${item.name}`
  const insightRows = review?.insight
    ? [
        ['Location', review.insight.location],
        ['Fact', review.insight.fact],
        ['Note', review.insight.note],
      ].filter((row): row is [string, string] => Boolean(row[1]))
    : []

  return (
    <section className="quiz-panel">
      <div className="prompt-row">
        <div>
          <span className="eyebrow">{modeLabel(topic, mode)}</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onNext} aria-label="Skip">
          <ChevronRight size={18} />
        </button>
      </div>

      {mode === 'image' && item.imageUrl && topic.mapKind ? <img className="quiz-image" src={resolveImageUrl(item.imageUrl)} alt="Quiz prompt" /> : null}

      {mode === 'choice' ? (
        <div className="choice-grid">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => onSubmit(option)} disabled={Boolean(review)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'type' || mode === 'map-type' || mode === 'image' ? (
        <form
          className="answer-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (review) {
              onNext()
              return
            }
            if (input.trim()) onSubmit(input)
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && review) {
                event.preventDefault()
                event.stopPropagation()
                onNext()
                return
              }
              if (event.key === 'Enter' && input.trim()) {
                event.preventDefault()
                onSubmit(input)
              }
            }}
            placeholder="Type the answer"
            autoComplete="off"
            readOnly={Boolean(review)}
            autoFocus
          />
          <button type="submit" disabled={!review && !input.trim()}>
            {review ? 'Next' : 'Check'}
          </button>
        </form>
      ) : null}

      <p className="coverage">{topic.coverage}</p>

      {review ? <p className="review-hint">Press Enter, Space, or the arrow button for the next question.</p> : null}

      {insightRows.length ? (
        <aside className="insight-card" aria-label="Did you know">
          <span className="eyebrow">Did you know?</span>
          {insightRows.map(([label, value]) => (
            <p key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </p>
          ))}
        </aside>
      ) : null}

      {history.length ? (
        <div className="answer-history" aria-label="Answer history">
          {history.map((result) => (
            <article key={result.id} className={result.ok ? 'history-card history-ok' : 'history-card history-bad'}>
              <span>{result.ok ? <Check size={16} /> : <X size={16} />}</span>
              <div>
                <strong>{result.prompt}</strong>
                <p>
                  You answered <b>{stripTrailingPunctuation(result.submitted)}</b>. {result.ok ? 'Correct.' : `Answer: ${stripTrailingPunctuation(result.expected)}.`}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

const planetVisuals = [
  { name: 'Mercury', color: '#8d8780', size: 20 },
  { name: 'Venus', color: '#d9b26f', size: 28 },
  { name: 'Earth', color: '#3579b8', size: 30 },
  { name: 'Mars', color: '#b35a3c', size: 24 },
  { name: 'Jupiter', color: '#d7b184', size: 48 },
  { name: 'Saturn', color: '#d8c28a', size: 44 },
  { name: 'Uranus', color: '#7bc7cf', size: 34 },
  { name: 'Neptune', color: '#496fc4', size: 34 },
]

function SolarSystemQuiz({
  topic,
  history,
  onSubmitSequence,
  onClearResult,
}: {
  topic: Topic
  history: AnswerResult[]
  onSubmitSequence: (sequence: SequenceResult) => void
  onClearResult: () => void
}) {
  const planetItems = topic.items.filter((item) => item.id !== 'asteroid-belt')
  const beltItem = topic.items.find((item) => item.id === 'asteroid-belt')
  const latestResult = history.find((result) => result.sequence)?.sequence
  const [planetAnswers, setPlanetAnswers] = useState(() => planetItems.map(() => ''))
  const [beltAnswer, setBeltAnswer] = useState('')

  function updatePlanetAnswer(index: number, value: string) {
    setPlanetAnswers((previous) => previous.map((answer, answerIndex) => (answerIndex === index ? value : answer)))
  }

  function resetPractice() {
    setPlanetAnswers(planetItems.map(() => ''))
    setBeltAnswer('')
    onClearResult()
  }

  function submitSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const planets = planetItems.map((planet, index) => {
      const submitted = planetAnswers[index]?.trim() ?? ''
      return {
        expected: planet.name,
        submitted,
        ok: matchesAnswer(submitted, planet, 'sequence'),
      }
    })
    const submittedBelt = beltAnswer.trim()
    const belt = {
      expected: beltItem?.answer ?? 'Mars and Jupiter',
      submitted: submittedBelt,
      ok: matchesAsteroidBelt(submittedBelt),
    }
    const correctCount = planets.filter((planet) => planet.ok).length + (belt.ok ? 1 : 0)

    onSubmitSequence({
      planets,
      belt,
      correctCount,
      total: planets.length + 1,
    })
  }

  return (
    <section className="solar-surface">
      <form onSubmit={submitSequence}>
        <div className="solar-diagram" aria-label="Planets from the Sun outward">
          <div className="sun-marker">
            <span />
            <strong>Sun</strong>
          </div>
          <div className="planet-sequence">
            {planetItems.map((planet, index) => {
              const visual = planetVisuals[index] ?? planetVisuals[0]
              const result = latestResult?.planets[index]
              const slotClass = ['planet-slot', result ? (result.ok ? 'slot-ok' : 'slot-bad') : ''].join(' ')

              return (
                <label key={planet.id} className={slotClass}>
                  <span className="planet-orb" style={{ background: visual.color, width: visual.size, height: visual.size }} />
                  <span className="slot-number">{index + 1}</span>
                  <input
                    value={planetAnswers[index] ?? ''}
                    onChange={(event) => updatePlanetAnswer(index, event.target.value)}
                    placeholder={`Planet ${index + 1}`}
                    autoComplete="off"
                  />
                  {result && !result.ok ? <small>{result.expected}</small> : null}
                </label>
              )
            })}
          </div>
        </div>

        <div className="belt-quiz">
          <div>
            <span className="eyebrow">Asteroid belt</span>
            <h2>{beltItem?.prompt ?? 'Between which two planets is the main asteroid belt?'}</h2>
            <p>The belt is deliberately not drawn on the planet line.</p>
          </div>
          <div className={latestResult ? (latestResult.belt.ok ? 'belt-answer belt-ok' : 'belt-answer belt-bad') : 'belt-answer'}>
            <input value={beltAnswer} onChange={(event) => setBeltAnswer(event.target.value)} placeholder="Example: Mars and Jupiter" autoComplete="off" />
            {latestResult ? <span>{latestResult.belt.ok ? 'Correct' : `Answer: ${latestResult.belt.expected}`}</span> : null}
          </div>
        </div>

        <div className="solar-actions">
          <button type="submit">Check sequence</button>
          <button type="button" onClick={resetPractice}>
            Clear
          </button>
        </div>
      </form>

      {latestResult ? (
        <section className={latestResult.correctCount === latestResult.total ? 'solar-result result-ok' : 'solar-result result-bad'}>
          <strong>
            {latestResult.correctCount}/{latestResult.total} correct
          </strong>
          <p>Planet order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.</p>
          <p>Asteroid belt: between Mars and Jupiter.</p>
        </section>
      ) : null}
    </section>
  )
}

function App() {
  const countryFeatures = useMemo(() => {
    const collection = feature(countries110m as never, (countries110m as never as { objects: { countries: never } }).objects.countries)
    return (collection as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>).features
  }, [])

  const fullTopics = useMemo<Topic[]>(() => {
    const countryTopicItems = countryItemsFromFeatures(countryFeatures)
    return topics.map((topic) => (topic.id === 'world-countries' ? { ...topic, items: countryTopicItems } : topic))
  }, [countryFeatures])

  const [topicId, setTopicId] = useState(fullTopics[0].id)
  const activeTopic = fullTopics.find((topic) => topic.id === topicId) ?? fullTopics[0]
  const [mode, setMode] = useState<QuizMode>(activeTopic.modes[0])
  const [scores, setScores] = useState<Record<string, Score>>(() => loadScores())
  const [histories, setHistories] = useState<Record<string, AnswerResult[]>>({})
  const [reviews, setReviews] = useState<Record<string, AnswerResult | undefined>>({})
  const [pageView, setPageView] = useState<PageView>('practice')
  const [roundStates, setRoundStates] = useState<Record<string, RoundState>>(() => {
    const firstTopic = fullTopics[0]
    const firstMode = firstTopic.modes[0]
    return {
      [roundKey(firstTopic, firstMode)]: createRoundState(poolForTopic(firstTopic, firstMode)),
    }
  })

  const pool = useMemo(() => poolForTopic(activeTopic, mode), [activeTopic, mode])
  const activeRoundKey = roundKey(activeTopic, mode)
  const activePracticeKey = scoreKey(activeTopic, mode)
  const activeRound = ensureRoundState(roundStates[activeRoundKey], pool)
  const current = pool[Math.min(activeRound.index, Math.max(pool.length - 1, 0))] ?? pool[0]
  const activeScore = scores[activePracticeKey] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
  const activeHistory = histories[activePracticeKey] ?? []
  const activeReview = reviews[activePracticeKey]
  const accuracy = activeScore.attempts ? Math.round((activeScore.correct / activeScore.attempts) * 100) : 0
  const activeCourse = courseArticles[activeTopic.id]
  const activePageView: PageView = activeCourse ? pageView : 'practice'

  const advanceRound = useCallback(() => {
    setReviews((previous) => ({ ...previous, [activePracticeKey]: undefined }))
    setRoundStates((previous) => {
      const previousRound = ensureRoundState(previous[activeRoundKey], pool)
      const nextPosition = previousRound.position + 1
      const nextRoundId = previousRound.roundId + 1

      if (nextPosition < previousRound.order.length) {
        return {
          ...previous,
          [activeRoundKey]: {
            ...previousRound,
            index: previousRound.order[nextPosition],
            position: nextPosition,
            roundId: nextRoundId,
          },
        }
      }

      return {
        ...previous,
        [activeRoundKey]: createRoundState(pool, nextRoundId),
      }
    })
  }, [activePracticeKey, activeRoundKey, pool])

  function record(submitted: string, ok: boolean, expected: string, insight?: AnswerInsight) {
    if (activeReview) return
    const key = activePracticeKey
    const previous = scores[key] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
    const streak = ok ? previous.streak + 1 : 0
    const updated = {
      ...scores,
      [key]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (ok ? 1 : 0),
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      },
    }
    setScores(updated)
    saveScores(updated)
    const result = {
      id: `${activePracticeKey}:${activeRound.roundId}:${Date.now()}`,
      ok,
      prompt: promptLabel(activeTopic, mode, current),
      submitted,
      expected,
      expectedName: current.name,
      submittedName: submitted,
      insight,
    }
    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [
        result,
        ...(previousHistories[activePracticeKey] ?? []),
      ].slice(0, 20),
    }))
    setReviews((previous) => ({ ...previous, [activePracticeKey]: result }))
  }

  function submit(value: string) {
    record(value, matchesAnswer(value, current, mode), displayAnswer(current, mode), answerInsight(current))
  }

  function pickMapItem(item: QuizItem) {
    record(item.name, matchesAnswer(item.name, current, mode), current.name, answerInsight(current))
  }

  function recordSequence(sequence: SequenceResult) {
    const key = activePracticeKey
    const previous = scores[key] ?? { attempts: 0, correct: 0, streak: 0, bestStreak: 0 }
    const perfect = sequence.correctCount === sequence.total
    const streak = perfect ? previous.streak + 1 : 0
    const updated = {
      ...scores,
      [key]: {
        attempts: previous.attempts + sequence.total,
        correct: previous.correct + sequence.correctCount,
        streak,
        bestStreak: Math.max(previous.bestStreak, streak),
      },
    }
    setScores(updated)
    saveScores(updated)

    const result = {
      id: `${activePracticeKey}:sequence:${Date.now()}`,
      ok: perfect,
      prompt: 'Solar system order',
      submitted: `${sequence.correctCount}/${sequence.total} correct`,
      expected: 'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune; asteroid belt between Mars and Jupiter.',
      expectedName: 'Solar system order',
      submittedName: 'Solar system order',
      sequence,
    }

    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [
        result,
        ...(previousHistories[activePracticeKey] ?? []),
      ].slice(0, 10),
    }))
  }

  function clearSequenceResult() {
    setHistories((previousHistories) => ({
      ...previousHistories,
      [activePracticeKey]: [],
    }))
  }

  function nextRound() {
    advanceRound()
  }

  function activateMode(topic: Topic, nextMode: QuizMode) {
    const nextKey = roundKey(topic, nextMode)
    const nextPool = poolForTopic(topic, nextMode)
    setMode(nextMode)
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
  }

  function activateTopic(topic: Topic) {
    const nextMode = topic.modes[0]
    const nextKey = roundKey(topic, nextMode)
    const nextPool = poolForTopic(topic, nextMode)
    setTopicId(topic.id)
    setMode(nextMode)
    setPageView('practice')
    setRoundStates((previous) => {
      if (isRoundStateValid(previous[nextKey], nextPool)) return previous
      return {
        ...previous,
        [nextKey]: createRoundState(nextPool),
      }
    })
    window.scrollTo(0, 0)
  }

  function resetScores() {
    if (!window.confirm('Reset all scores for every topic? This cannot be undone.')) return
    localStorage.removeItem('culture-quizzer-scores')
    setScores({})
    setHistories({})
    setReviews({})
  }

  useEffect(() => {
    if (!activeReview) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      advanceRound()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeReview, advanceRound])

  const grouped = useMemo(() => {
    return fullTopics.reduce<Record<string, Topic[]>>((acc, topic) => {
      acc[topic.group] ??= []
      acc[topic.group].push(topic)
      return acc
    }, {})
  }, [fullTopics])

  return (
    <main className="app-shell">
      <header className="mobile-header">
        <div className="mobile-brand">
          <Globe2 size={20} />
          <strong>Culture Quizzer</strong>
        </div>
        <select
          className="mobile-topic-select"
          value={activeTopic.id}
          onChange={(e) => {
            const topic = fullTopics.find((t) => t.id === e.target.value)
            if (topic) activateTopic(topic)
          }}
          aria-label="Select topic"
        >
          {Object.entries(grouped).map(([group, groupTopics]) => (
            <optgroup key={group} label={group}>
              {groupTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </header>

      <aside className="sidebar">
        <div className="brand">
          <Globe2 size={24} />
          <div>
            <strong>Culture Quizzer</strong>
            <span>Broad knowledge practice</span>
          </div>
        </div>

        <nav className="topic-list" aria-label="Quiz topics">
          {Object.entries(grouped).map(([group, groupTopics]) => (
            <section key={group}>
              <h3>{group}</h3>
              {groupTopics.map((topic) => (
                <button
                  key={topic.id}
                  className={topic.id === activeTopic.id ? 'topic-button active' : 'topic-button'}
                  type="button"
                  onClick={() => activateTopic(topic)}
                >
                  <TopicIcon topic={topic} />
                  <span>{topic.title}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{activeTopic.title}</h1>
            <p>{activeTopic.description}</p>
          </div>
          <button className="reset-button" type="button" onClick={resetScores}>
            <RotateCcw size={16} />
            Reset scores
          </button>
        </header>

        {activeCourse ? (
          <div className="view-control" role="tablist" aria-label="Section view">
            {(['practice', 'course', 'questions'] as PageView[]).map((view) => (
              <button key={view} className={activePageView === view ? 'view-button active' : 'view-button'} type="button" onClick={() => setPageView(view)}>
                {view === 'practice' ? 'Practice' : view === 'course' ? 'Course' : 'Questions'}
              </button>
            ))}
          </div>
        ) : null}

        {activePageView === 'practice' ? (
          <>
            <div className="mode-control">
              <span>Quiz type</span>
              <div className="mode-row" role="tablist" aria-label="Quiz type">
                {activeTopic.modes.map((availableMode) => (
                  <button
                    key={availableMode}
                    className={availableMode === mode ? 'mode-button active' : 'mode-button'}
                    type="button"
                    onClick={() => activateMode(activeTopic, availableMode)}
                  >
                    {modeLabel(activeTopic, availableMode)}
                  </button>
                ))}
              </div>
            </div>

            <section className="score-strip" aria-label="Current score">
              <Stat label="Deck" value={pool.length} />
              <Stat label="Correct" value={activeScore.correct} />
              <Stat label="Attempts" value={activeScore.attempts} />
              <Stat label="Accuracy" value={`${accuracy}%`} />
              <Stat label="Best streak" value={activeScore.bestStreak} />
            </section>

            {activeTopic.id === 'solar-system' ? (
              <SolarSystemQuiz topic={activeTopic} history={activeHistory} onSubmitSequence={recordSequence} onClearResult={clearSequenceResult} />
            ) : (
              <div className={[activeTopic.mapKind || current.imageUrl ? 'practice-grid' : 'practice-grid quiz-only', activeTopic.mapKind ? 'with-map' : ''].join(' ')}>
                {activeTopic.mapKind ? (
                  <CultureMap key={`${activeTopic.id}:${mode}`} topic={activeTopic} mode={mode} current={current} items={pool} countries={countryFeatures} review={activeReview} onPick={pickMapItem} />
                ) : current.imageUrl ? (
                  <section className="study-surface image-surface">
                    <img src={resolveImageUrl(current.imageUrl)} alt="Quiz prompt" />
                  </section>
                ) : null}

                <QuizPanel
                  key={`${activePracticeKey}:${activeRound.roundId}`}
                  topic={activeTopic}
                  mode={mode}
                  item={current}
                  pool={pool}
                  history={activeHistory}
                  review={activeReview}
                  onSubmit={submit}
                  onNext={nextRound}
                />
              </div>
            )}
          </>
        ) : activePageView === 'course' && activeCourse ? (
          <CoursePanel article={activeCourse} />
        ) : activePageView === 'questions' ? (
          <QuestionReferencePanel topic={activeTopic} article={activeCourse} />
        ) : null}
      </section>
    </main>
  )
}

export default App
