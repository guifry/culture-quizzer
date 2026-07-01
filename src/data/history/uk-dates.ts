import type { HistoryDate } from '../types'

export const ukDates: HistoryDate[] = [
  {
    id: 'roman-conquest-britain',
    date: '43',
    event: 'Roman conquest of Britain begins',
    location: 'Kent / south-east England',
    locationAccept: ['kent', 'england', 'britain'],
    eventAccept: ['roman conquest of britain begins', 'roman conquest of britain', 'roman invasion of britain', 'claudius invasion'],
    summary:
      "In AD 43 the emperor Claudius launched the Roman conquest of Britain, landing legions in the south-east, probably in Kent. Roman forces gradually subdued much of the island, establishing the province of Britannia with towns, roads, forts and villas. Resistance, including the revolt of Boudica, was crushed, though the far north was never fully conquered. Nearly four centuries of Roman rule left a lasting imprint on Britain's towns, language and infrastructure, and drew the island into the wider classical world.",
  },
  {
    id: 'roman-rule-ends',
    date: '410',
    event: 'Roman rule in Britain ends',
    location: 'Roman Britain; no single site',
    locationAccept: ['britain', 'roman britain', 'england'],
    eventAccept: ['roman rule in britain ends', 'end of roman britain', 'romans leave britain', 'end of roman rule'],
    summary:
      "By around 410 Roman rule in Britain came to an end as the beleaguered empire withdrew its legions to defend its heartlands, and the emperor Honorius reportedly told the Britons to look to their own defence. Left without imperial protection, Roman Britain fragmented amid raids by Saxons, Picts and Irish. Towns declined and central authority dissolved, ushering in the poorly documented centuries sometimes called the 'Dark Ages'. The departure opened the way for Anglo-Saxon settlement and the making of England.",
  },
  {
    id: 'augustine-kent',
    date: '597',
    event: 'Augustine arrives in Kent',
    location: 'Thanet / Canterbury, Kent',
    locationAccept: ['thanet', 'canterbury', 'kent'],
    eventAccept: ['augustine arrives in kent', 'augustine of canterbury', 'gregorian mission', 'st augustine arrives'],
    summary:
      'In 597 the monk Augustine, sent by Pope Gregory the Great, landed in Kent and began converting the Anglo-Saxons to Christianity. Welcomed by King Æthelberht, whose Frankish wife was already Christian, Augustine established his church at Canterbury and became its first archbishop. The mission reintroduced Roman Christianity to southern England and made Canterbury the spiritual centre of the English Church. It began a process of conversion that reshaped Anglo-Saxon religion, learning and culture over the following century.',
  },
  {
    id: 'alfred-wessex',
    date: '871',
    event: 'Alfred the Great becomes king of Wessex',
    location: 'Wessex, southern England',
    locationAccept: ['wessex', 'england'],
    eventAccept: ['alfred the great becomes king of wessex', 'alfred the great', 'king alfred', 'alfred becomes king'],
    summary:
      "In 871 Alfred became king of Wessex at a moment of crisis, as the Viking 'Great Heathen Army' threatened to overwhelm the English kingdoms. After early setbacks and a famous refuge in the Somerset marshes, Alfred defeated the Danes and secured his realm, later styling himself king of the Anglo-Saxons. He promoted learning, law, fortified towns and the English language. Remembered as 'the Great', the only English monarch so titled, he laid foundations for a unified England.",
  },
  {
    id: 'norman-conquest-uk',
    date: '1066',
    event: 'Norman Conquest',
    location: 'Hastings / Battle, England',
    locationAccept: ['hastings', 'battle', 'england'],
    eventAccept: ['norman conquest', 'battle of hastings', '1066', 'conquest of england', 'norman invasion'],
    summary:
      "In 1066 William, Duke of Normandy, invaded England and defeated King Harold Godwinson at the Battle of Hastings, becoming William the Conqueror. The Norman Conquest replaced the Anglo-Saxon ruling class with a Norman aristocracy, transforming England's language, law, architecture and ties to continental Europe. Norman French blended with Old English to enrich the language, and feudal structures were entrenched. It stands as one of the great turning points of English history, its effects felt for centuries.",
  },
  {
    id: 'domesday-book',
    date: '1086',
    event: 'Domesday Book',
    location: 'England-wide survey; royal administration',
    locationAccept: ['england'],
    eventAccept: ['domesday book', 'domesday survey', 'doomsday book', 'domesday'],
    summary:
      'In 1086 William the Conqueror ordered the Domesday Book, an extraordinarily detailed survey of landholdings, resources and population across most of England. Commissioners recorded who held what, and its value, so the crown could assess taxes and assert its authority. Unprecedented in medieval Europe for its scope, the survey earned its name from the finality of its judgements, likened to Doomsday. It remains a priceless historical record and a testament to the reach of the new Norman state.',
  },
  {
    id: 'magna-carta',
    date: '1215',
    event: 'Magna Carta',
    location: 'Runnymede, Surrey',
    locationAccept: ['runnymede', 'surrey'],
    eventAccept: ['magna carta', 'great charter', 'magna carta sealed'],
    summary:
      'In 1215 rebellious barons forced King John to seal Magna Carta at Runnymede, a charter limiting royal power and protecting certain rights. Though initially a practical settlement that John soon repudiated, its principles, that the king was subject to the law and that free men could not be imprisoned without lawful judgement, proved enduring. Repeatedly reissued, Magna Carta became a foundational symbol of constitutional government and the rule of law in England and far beyond.',
  },
  {
    id: 'model-parliament',
    date: '1295',
    event: 'Model Parliament',
    location: 'Westminster, London',
    locationAccept: ['westminster', 'london'],
    eventAccept: ['model parliament', 'edward i parliament'],
    summary:
      'In 1295 King Edward I summoned what later became known as the Model Parliament, so called because it included representatives of the clergy, nobility, knights of the shires and burgesses of the towns. Called mainly to raise money for war, it broadened participation in national affairs and set a pattern for future assemblies. Its inclusive composition helped establish the idea that taxation required consent, an important step in the long evolution of the English Parliament.',
  },
  {
    id: 'bannockburn',
    date: '1314',
    event: 'Battle of Bannockburn',
    location: 'Bannockburn, near Stirling, Scotland',
    locationAccept: ['bannockburn', 'stirling', 'scotland'],
    eventAccept: ['battle of bannockburn', 'bannockburn', 'robert the bruce victory'],
    summary:
      "At Bannockburn near Stirling in 1314, Robert the Bruce's Scottish army decisively defeated a much larger English force under Edward II. The victory secured Scottish independence in practice and cemented Bruce's position as king. One of the most celebrated battles in Scottish history, it became a lasting symbol of national identity and resistance. Though formal English recognition came only later, Bannockburn marked the high point of the Wars of Scottish Independence.",
  },
  {
    id: 'act-of-supremacy',
    date: '1534',
    event: 'Act of Supremacy',
    location: 'Westminster, London',
    locationAccept: ['westminster', 'london'],
    eventAccept: ['act of supremacy', 'english reformation', 'henry viii breaks with rome', 'break with rome'],
    summary:
      "In 1534 the Act of Supremacy declared King Henry VIII Supreme Head of the Church of England, severing ties with the Pope in Rome. The break followed Rome's refusal to annul Henry's marriage to Catherine of Aragon. It launched the English Reformation, transferring religious authority to the crown and leading to the dissolution of the monasteries and the seizure of church wealth. The Act reshaped English religion, politics and society, and defined the monarchy's bond with the Church for centuries.",
  },
  {
    id: 'union-of-crowns',
    date: '1603',
    event: 'Union of the Crowns',
    location: 'London / Edinburgh dynastic union',
    locationAccept: ['london', 'edinburgh'],
    eventAccept: ['union of the crowns', 'james vi and i', 'james i accession', 'union of crowns'],
    summary:
      'In 1603, on the death of the childless Elizabeth I, James VI of Scotland also became James I of England, uniting the two crowns under one monarch. Though England and Scotland remained separate kingdoms with their own parliaments and laws, they now shared a single ruler. The Union of the Crowns began a long, sometimes uneasy process of drawing the two nations together, which culminated over a century later in the parliamentary union that created Great Britain.',
  },
  {
    id: 'execution-charles-i',
    date: '1649',
    event: 'Execution of Charles I',
    location: 'Whitehall, London',
    locationAccept: ['whitehall', 'london'],
    eventAccept: ['execution of charles i', 'charles i executed', 'death of charles i', 'beheading of charles i'],
    summary:
      'In January 1649, after defeat in the English Civil War, King Charles I was tried for treason and beheaded outside the Banqueting House in Whitehall. The execution of a reigning monarch by his own subjects was a shocking, unprecedented act. It abolished the monarchy and ushered in a republic, the Commonwealth, under Oliver Cromwell. Though the monarchy was restored in 1660, the trial established that even a king could be held accountable, a landmark in constitutional history.',
  },
  {
    id: 'restoration',
    date: '1660',
    event: 'Restoration of the monarchy',
    location: 'London',
    locationAccept: ['london'],
    eventAccept: ['restoration of the monarchy', 'the restoration', 'restoration', 'charles ii restored'],
    summary:
      "In 1660, after the collapse of Cromwell's republican Commonwealth, the monarchy was restored as Charles II returned from exile to reclaim the throne. Welcomed by a war-weary nation, the Restoration re-established the crown, the House of Lords and the Church of England. It ushered in a livelier cultural era after the austere Puritan years, reopening theatres and encouraging science and the arts. Yet tensions over religion and royal power persisted, resurfacing within a generation in the Glorious Revolution.",
  },
  {
    id: 'glorious-revolution',
    date: '1688–1689',
    event: 'Glorious Revolution / Bill of Rights',
    location: 'London / Westminster',
    locationAccept: ['london', 'westminster'],
    eventAccept: ['glorious revolution', 'bill of rights', 'william and mary', 'the glorious revolution'],
    summary:
      'In 1688 the Catholic King James II was overthrown in the Glorious Revolution, and the Protestant William of Orange and his wife Mary were invited to take the throne. Largely bloodless in England, the change of ruler was accompanied by the 1689 Bill of Rights, which limited royal power, guaranteed parliamentary sovereignty and protected certain liberties. The revolution entrenched constitutional monarchy and the supremacy of Parliament, shaping British government and inspiring later ideas of rights and limited power.',
  },
  {
    id: 'acts-of-union-1707',
    date: '1707',
    event: 'Acts of Union',
    location: 'Westminster and Edinburgh',
    locationAccept: ['westminster', 'edinburgh', 'london'],
    eventAccept: ['acts of union', 'act of union', 'union of parliaments', 'union of england and scotland', 'great britain formed'],
    summary:
      'In 1707 the Acts of Union merged the kingdoms of England and Scotland into a single state, the Kingdom of Great Britain, with one parliament at Westminster. Scotland retained its own legal system, church and educational traditions, but gained access to English markets and empire. Driven partly by economic difficulties and political calculation, the union was controversial in Scotland. It created the British state and framed the relationship between its nations, a subject of debate that continues today.',
  },
  {
    id: 'union-with-ireland',
    date: '1801',
    event: 'Act of Union with Ireland',
    location: 'Westminster, London',
    locationAccept: ['westminster', 'london', 'dublin'],
    eventAccept: ['act of union with ireland', 'union with ireland', 'irish act of union', 'united kingdom formed'],
    summary:
      'In 1801 the Act of Union joined the Kingdom of Ireland to Great Britain, creating the United Kingdom of Great Britain and Ireland and abolishing the Irish parliament in Dublin. Passed in the wake of a failed Irish rebellion, it brought Irish members to Westminster but left Catholic emancipation unfulfilled for decades, fuelling lasting grievance. The union shaped Anglo-Irish relations through the nineteenth century and endured until most of Ireland gained independence in the twentieth.',
  },
  {
    id: 'great-reform-act',
    date: '1832',
    event: 'Great Reform Act',
    location: 'Westminster, London',
    locationAccept: ['westminster', 'london'],
    eventAccept: ['great reform act', 'reform act', 'reform act 1832', '1832 reform act'],
    summary:
      "The Great Reform Act of 1832 overhauled England's antiquated electoral system, abolishing many 'rotten boroughs', redistributing seats to growing industrial towns and extending the vote to more of the middle class. Though it left most men and all women without a vote, it broke the landed elite's grip on the Commons and set the precedent for further reform. Passed amid popular agitation and political crisis, it marked the beginning of Britain's gradual march towards mass democracy.",
  },
  {
    id: 'britain-enters-wwi',
    date: '1914',
    event: 'Britain enters First World War',
    location: 'London; Europe-wide war',
    locationAccept: ['london', 'europe'],
    eventAccept: ['britain enters first world war', 'britain enters wwi', 'britain enters ww1', 'britain enters the first world war', 'first world war', 'great war'],
    summary:
      "In August 1914 Britain entered the First World War after Germany invaded neutral Belgium, whose independence Britain had pledged to defend. The decision committed the country and its empire to a vast continental conflict. Millions of Britons volunteered and later were conscripted, and the war brought unprecedented casualties, total mobilisation and profound social change. Victory came in 1918 at enormous cost, and the war reshaped Britain's economy, politics and place in the world.",
  },
  {
    id: 'irish-free-state',
    date: '1922',
    event: 'Irish Free State created',
    location: 'Dublin / London',
    locationAccept: ['dublin', 'london', 'ireland'],
    eventAccept: ['irish free state created', 'irish free state', 'irish independence', 'partition of ireland'],
    summary:
      'In 1922 the Irish Free State was established as a self-governing dominion, following the War of Independence and the Anglo-Irish Treaty. Most of Ireland gained substantial independence, while six northern counties remained within the United Kingdom, creating the partition that endures today. The settlement provoked a bitter civil war among former allies over its terms. The Free State’s creation ended centuries of direct British rule over most of Ireland and reshaped relations across the British Isles.',
  },
  {
    id: 'battle-of-britain',
    date: '1940',
    event: 'Battle of Britain',
    location: 'Southern England / UK skies',
    locationAccept: ['england', 'britain', 'united kingdom'],
    eventAccept: ['battle of britain', 'the blitz', 'raf against luftwaffe'],
    summary:
      "In the summer and autumn of 1940 the Royal Air Force fought off the German Luftwaffe's attempt to gain air supremacy over Britain, in the Battle of Britain. Pilots in Spitfires and Hurricanes, aided by radar and ground defences, denied Germany the control it needed to invade. Churchill famously praised 'the Few' who defended the nation. The victory was Britain's first major check to Nazi expansion and a defining moment of national resolve in the Second World War.",
  },
  {
    id: 'nhs-founded',
    date: '1948',
    event: 'NHS founded',
    location: 'UK-wide; launched from Manchester symbolically',
    locationAccept: ['manchester', 'united kingdom', 'britain'],
    eventAccept: ['nhs founded', 'national health service founded', 'nhs created', 'founding of the nhs', 'nhs'],
    summary:
      "In 1948 the National Health Service was launched, providing healthcare free at the point of use and funded by taxation, a landmark of the post-war welfare state. Championed by Health Minister Aneurin Bevan, the NHS aimed to give everyone access to medical care regardless of wealth. It transformed the health and security of the British people and became one of the country's most cherished institutions, admired and debated the world over as a model of public healthcare.",
  },
  {
    id: 'devolution',
    date: '1997–1999',
    event: 'Devolution',
    location: 'Scotland, Wales, Northern Ireland',
    locationAccept: ['scotland', 'wales', 'northern ireland', 'edinburgh', 'cardiff'],
    eventAccept: ['devolution', 'scottish devolution', 'welsh devolution', 'devolved parliaments'],
    summary:
      'Between 1997 and 1999 the United Kingdom devolved powers to new institutions in Scotland, Wales and Northern Ireland, following referendums and, in Northern Ireland, the Good Friday Agreement. A Scottish Parliament and Welsh and Northern Irish assemblies took charge of matters such as health, education and local affairs, while Westminster retained others. Devolution reshaped the constitution, giving the nations of the UK greater self-government and reopening long-running questions about identity, union and independence.',
  },
  {
    id: 'brexit',
    date: '2016–2020',
    event: 'Brexit referendum and UK leaves EU',
    location: 'UK-wide; Westminster / Brussels',
    locationAccept: ['united kingdom', 'britain', 'westminster', 'brussels'],
    eventAccept: ['brexit referendum and uk leaves eu', 'brexit', 'brexit referendum', 'uk leaves the eu', 'eu referendum'],
    summary:
      "In a 2016 referendum a narrow majority voted for the United Kingdom to leave the European Union, and after years of fraught negotiation and political turmoil Britain formally departed in 2020. 'Brexit' ended more than four decades of membership, changing the country's trade, immigration and legal ties with Europe. Deeply divisive, it dominated British politics, toppled prime ministers and prompted searching debate about sovereignty, economy and the UK's place in the world.",
  },
  {
    id: 'death-elizabeth-ii',
    date: '2022',
    event: 'Death of Elizabeth II / accession of Charles III',
    location: 'Balmoral, Scotland; London',
    locationAccept: ['balmoral', 'scotland', 'london'],
    eventAccept: ['death of elizabeth ii', 'death of the queen', 'queen elizabeth ii dies', 'accession of charles iii', 'elizabeth ii dies'],
    summary:
      "In September 2022 Queen Elizabeth II died at Balmoral in Scotland, ending the longest reign in British history at seventy years, and her son immediately became King Charles III. A period of national mourning and elaborate ceremony culminated in a state funeral in London watched around the globe. Elizabeth had been a constant, unifying presence through decades of profound change, and her death, and Charles's accession, marked a significant moment in the story of the modern monarchy.",
  },
]
