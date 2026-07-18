# France Cultural Landmarks — course & clue authoring draft

Source of truth for the "Top 42 France Landmarks" game. Each entry: **Nutshell → six labelled
angles (When / Who / People / Events / Concepts) → 4–5 clues → concept keys**. Concepts are
defined once in the shared [Glossary](#glossary) and reused across entries.

- ★ = Must-Know 11 (cosmetic cue only; identical treatment to the rest).
- Clues are each self-sufficient (a random one appears alone) and each takes a different angle.
- The course is a superset of the clues — it carries knowledge the clue mode never tests
  (reserved for a future LLM-graded deep mode).

> **July 2026 update — deck grew 33 → 42.** New entries (authored directly in
> `src/data/landmarks/france-landmarks.ts` + `france-landmarks.fr.ts`, not yet mirrored in the
> per-entry sections below): Calanques de Marseille (zone), Arènes de Nîmes, Les Invalides,
> Palais Garnier, Père-Lachaise Cemetery, Promenade des Anglais, Palais de la Cité (royal
> residence until the 14th century — Sainte-Chapelle + Conciergerie), Normandy American
> Cemetery, Abbaye de Fontenay. The game also gained: zone polygons + always-on distance
> feedback for locate (see the playbook's map-interaction standard), progressive
> roads/rivers layers, a full French mode (settings gear), and the photo-curation protocol
> ([photo-curation.md](photo-curation.md)).

## The list (42)

| # | Landmark | ★ | Region |
|---|----------|---|--------|
| 1 | Eiffel Tower | ★ | Île-de-France |
| 2 | Louvre Museum | ★ | Île-de-France |
| 3 | Palace of Versailles | ★ | Île-de-France |
| 4 | Notre-Dame de Paris | ★ | Île-de-France |
| 5 | Arc de Triomphe | ★ | Île-de-France |
| 6 | Mont-Saint-Michel | ★ | Normandy |
| 7 | Carcassonne | ★ | Occitanie |
| 8 | Château de Chambord | ★ | Centre-Val de Loire |
| 9 | Pont du Gard | ★ | Occitanie |
| 10 | Lascaux Cave | ★ | Nouvelle-Aquitaine |
| 11 | Mont Blanc | ★ | Auvergne-Rhône-Alpes |
| 12 | Sacré-Cœur Basilica | | Île-de-France |
| 13 | Musée d'Orsay | | Île-de-France |
| 14 | Panthéon | | Île-de-France |
| 15 | Chartres Cathedral | | Centre-Val de Loire |
| 16 | Reims Cathedral | | Grand Est |
| 17 | Strasbourg Cathedral | | Grand Est |
| 18 | Château de Chenonceau | | Centre-Val de Loire |
| 19 | Palais des Papes, Avignon | | Provence-Alpes-Côte d'Azur |
| 20 | Millau Viaduct | | Occitanie |
| 21 | Dune du Pilat | | Nouvelle-Aquitaine |
| 22 | Gorges du Verdon | | Provence-Alpes-Côte d'Azur |
| 23 | Étretat | | Normandy |
| 24 | Carnac Standing Stones | | Brittany |
| 25 | Calanques de Piana | | Corsica |
| 26 | Amiens Cathedral | | Hauts-de-France |
| 27 | Arles Amphitheatre | | Provence-Alpes-Côte d'Azur |
| 28 | Hospices de Beaune | | Bourgogne-Franche-Comté |
| 29 | Albi Cathedral | | Occitanie |
| 30 | Rouen Cathedral | | Normandy |
| 31 | Basilica of Notre-Dame de Fourvière | | Auvergne-Rhône-Alpes |
| 32 | Centre Pompidou | | Île-de-France |
| 33 | Les Landes Coast | | Nouvelle-Aquitaine |
| 34 | Calanques de Marseille | | Provence-Alpes-Côte d'Azur |
| 35 | Arènes de Nîmes | | Occitanie |
| 36 | Les Invalides | | Île-de-France |
| 37 | Palais Garnier | | Île-de-France |
| 38 | Père-Lachaise Cemetery | | Île-de-France |
| 39 | Promenade des Anglais | | Provence-Alpes-Côte d'Azur |
| 40 | Palais de la Cité | | Île-de-France |
| 41 | Normandy American Cemetery | | Normandy |
| 42 | Abbaye de Fontenay | | Bourgogne-Franche-Comté |

Tally (42): Île-de-France 12 · Occitanie 5 · Provence-Alpes-Côte d'Azur 5 · Normandy 4 · Centre-Val de Loire 3 · Nouvelle-Aquitaine 3 · Grand Est 2 · Auvergne-Rhône-Alpes 2 · Bourgogne-Franche-Comté 2 · Brittany 1 · Hauts-de-France 1 · Corsica 1 · ★ = 11.

---

## 1 · Eiffel Tower ★
*Île-de-France · Paris*

**Nutshell.** The wrought-iron lattice tower on the Champ de Mars, built for the 1889 World's Fair and initially reviled by artists, it became Paris's defining silhouette and the most-visited paid monument in the world — a masterpiece of 19th-century structural engineering saved by its radio mast.

- **When** — Built 1887–1889 for the Exposition Universelle, marking the French Revolution's centenary; Belle Époque.
- **Who** — A symbol of modernity and French industrial ambition, designed to demonstrate engineering prowess at the world's fair.
- **People** — Gustave Eiffel, the engineer; the tower was nearly dismantled after 20 years but survived through its scientific use (radio, telegraphy).
- **Events** — The 1889 World's Fair; saved from demolition in 1909 by its antenna (used for WWI communications); during WWII the lift cables were cut so occupying forces had to climb.
- **Concepts** — `belle-epoque` · `worlds-fair` · `wrought-iron`

**Clues:**
1. The wrought-iron tower built for the 1889 World's Fair, almost dismantled after twenty years.
2. Gustave Eiffel's 300-metre engineering masterwork on the Champ de Mars in Paris.
3. During WWII its lift cables were cut so occupying forces had to climb the stairs.
4. The most-visited paid monument in the world, saved by its radio mast.
5. Reviled by artists when new, now the defining silhouette of the capital of France.

---

## 2 · Louvre Museum ★
*Île-de-France · Paris*

**Nutshell.** The world's largest museum, housed in a former royal palace on the Right Bank, its glass pyramid entrance a modern icon. From the Mona Lisa and the Venus de Milo to the Winged Victory of Samothrace, it spans 11,000 years of art and civilisation.

- **When** — Royal fortress from 1190; rebuilt as a Renaissance palace in the 16th C; became a public museum during the Revolution in 1793; I. M. Pei's pyramid added in 1989.
- **Who** — A universal museum of world art, repository of the French state's collections.
- **People** — Francis I began the Renaissance collection; Napoleon looted art across Europe into its halls; I. M. Pei designed the controversial glass pyramid.
- **Events** — The Revolution opened it to the public (1793); the Mona Lisa was stolen in 1911 (by a former employee) and recovered in 1913; during WWII artworks were evacuated to the French countryside.
- **Concepts** — `renaissance` · `french-revolution` · `universal-museum` · `worlds-fair`

**Clues:**
1. The world's largest museum, opened to the public during the Revolution in 1793.
2. Its glass pyramid entrance, added in 1989, is now as iconic as the artworks inside.
3. Home to the Mona Lisa, the Venus de Milo and the Winged Victory of Samothrace.
4. Originally a royal fortress built by Philip Augustus in 1190, then a Renaissance palace.
5. Its collections were evacuated by truck to the countryside in 1939 before the German occupation.

---

## 3 · Palace of Versailles ★
*Île-de-France · Versailles*

**Nutshell.** The vast royal château built by Louis XIV 20 km southwest of Paris, the seat of absolute monarchy and European power from 1682 until the Revolution. Its Hall of Mirrors, gardens and the Grand Trianon embody the pomp and control of the Ancien Régime.

- **When** — Built from 1661, became the official royal residence in 1682, abandoned after the Revolution of 1789; later treaty signings and restorations.
- **Who** — The court of Louis XIV, who moved the nobility here to control them; the centre of French government for a century.
- **People** — Louis XIV (the Sun King); architects Louis Le Vau and Jules Hardouin-Mansart; garden designer André Le Nôtre; Marie Antoinette's hamlet at the Petit Trianon.
- **Events** — The signing of the Treaty of Versailles (1919) ending WWI; the proclamation of the German Empire in the Hall of Mirrors (1871); the Women's March on Versailles (October 1789) forced the royal family back to Paris.
- **Concepts** — `ancien-regime` · `baroque` · `absolutism` · `french-revolution`

**Clues:**
1. The château built by Louis XIV to control the nobility and embody absolute monarchy.
2. Its Hall of Mirrors witnessed the proclamation of the German Empire in 1871 and the 1919 peace treaty.
3. André Le Nôtre's vast formal gardens were designed as an extension of the king's power.
4. A royal hunting lodge turned into the seat of French government, 20 km from Paris.
5. The Women's March of October 1789 forced the king to abandon this palace forever.

---

## 4 · Notre-Dame de Paris ★
*Île-de-France · Paris*

**Nutshell.** The great Gothic cathedral on the Île de la Cité, built over nearly two centuries (1163–1345) as the heart of medieval Paris. Its twin towers, flying buttresses and rose windows made it the city's spiritual axis — and the 2019 fire brought it to global attention.

- **When** — Gothic, begun 1163 under Bishop Maurice de Sully, completed c. 1345; the 2019 fire destroyed the spire and roof.
- **Who** — The cathedral of the Archdiocese of Paris; a symbol of French Catholicism and the state.
- **People** — Napoleon crowned himself emperor here in 1804; Victor Hugo wrote *The Hunchback of Notre-Dame* (1831) to spur its restoration; Viollet-le-Duc added the spire in the 19th C.
- **Events** — The coronation of Napoleon (1804); the beatification of Joan of Arc (1909); the 2019 fire that shocked the world; the liberation of Paris (1944) celebrated inside.
- **Concepts** — `gothic` · `flying-buttress` · `french-revolution` · `rose-window`

**Clues:**
1. A Gothic cathedral on the Île de la Cité, begun in 1163 and completed nearly two centuries later.
2. Napoleon crowned himself emperor beneath its vaults in 1804.
3. Victor Hugo's novel of 1831 saved it from demolition and inspired a major restoration.
4. Its spire and roof were destroyed by a fire in April 2019.
5. The twin-towered heart of Paris, surrounded by the Seine.

---

## 5 · Arc de Triomphe ★
*Île-de-France · Paris*

**Nutshell.** The colossal triumphal arch at the western end of the Champs-Élysées, commissioned by Napoleon after Austerlitz to honour the Grande Armée. Its sculpted reliefs and the Tomb of the Unknown Soldier at its base make it Paris's monument to national pride and sacrifice.

- **When** — Napoleonic, begun 1806, completed 1836; the Arc de Triomphe du Carrousel preceded it; the Unknown Soldier was interred in 1920.
- **Who** — The glory of the French army, past and present.
- **People** — Napoleon Bonaparte commissioned it; Jean Chalgrin was the architect; the Unknown Soldier represents the war dead of three conflicts.
- **Events** — The 1919 victory parade after WWI marched beneath it; the 1940 German victory parade also passed under; de Gaulle walked beneath it in 1944; the eternal flame is rekindled each evening.
- **Concepts** — `napoleonic` · `french-revolution` · `unknown-soldier` · `triumphal-arch`

**Clues:**
1. Napoleon ordered this colossal arch to honour his army after the 1805 victory at Austerlitz.
2. The Tomb of the Unknown Soldier and its eternal flame rest at its base.
3. Twelve avenues radiate from it — the "star" of the Place de l'Étoile.
4. Hitler's army marched through it in 1940; de Gaulle marched beneath it in 1944.
5. The sculpted *Departure of the Volunteers* (La Marseillaise) by Rude decorates its right pillar.

---

## 6 · Mont-Saint-Michel ★
*Normandy · Manche*

**Nutshell.** A medieval abbey perched on a rocky tidal island in Normandy, surrounded by the fastest-rising tides in Europe — a place of pilgrimage since the 8th century and one of the most recognisable silhouettes in France.

- **When** — Medieval; abbey founded 708; present Romanesque-and-Gothic building 11th–16th C; fortified during the Hundred Years War.
- **Who** — A Benedictine monastery and pilgrimage site, later a prison, now a UNESCO World Heritage site.
- **People** — St Aubert, Bishop of Avranches, who built the first oratory after the Archangel Michael appeared in a dream; the "Merveille" ("Marvel") — the Gothic cloister and refectory.
- **Events** — A pilgrimage destination throughout the Middle Ages; withstood English sieges during the Hundred Years War; used as a prison during the Revolution and Empire; the 2015 bridge restored tidal flow.
- **Concepts** — `romanesque` · `flamboyant-gothic` · `pilgrimage` · `hundred-years-war` · `tidal-island`

**Clues:**
1. A medieval abbey on a tidal island in Normandy, cut off by the fastest-rising tides in Europe.
2. Built after St Aubert saw the Archangel Michael in a vision in the 8th century.
3. Its "Merveille" cloister and refectory rise like a stone crown from the rock.
4. Withstood English sieges in the Hundred Years War, then became a prison under Napoleon.
5. The most recognisable abbey in France, accessible only at low tide across the sands.

---

## 7 · Carcassonne ★
*Occitanie · Aude*

**Nutshell.** The largest surviving medieval fortified city in Europe, with its double ring of walls, 52 towers and a castle within a castle. Restored in the 19th century by Viollet-le-Duc, it stands as the definitive image of a medieval citadel.

- **When** — Roman origins; fortified in the 12th–13th C; restored 1853–1879 by Viollet-le-Duc.
- **Who** — The Trencavel family ruled it in the 12th C; the French crown took it after the Albigensian Crusade.
- **People** — Eugène Viollet-le-Duc, the architect who restored it (sometimes controversially); the Cathars, whose persecution triggered the Albigensian Crusade.
- **Events** — The Albigensian Crusade (1209–1229) brought it under royal control; it was saved from demolition in the 19th C when the government listed it.
- **Concepts** — `medieval` · `fortified-city` · `albigensian-crusade` · `cathedrals`

**Clues:**
1. A two-walled fortified city with 52 towers, the largest medieval citadel surviving in Europe.
2. Its 19th-century restoration by Viollet-le-Duc saved it from being torn down.
3. The Trencavel family ruled it until the Albigensian Crusade brought the French king.
4. A castle within a castle in the Languedoc, with a double ring of walls.
5. Walked along the lists between its inner and outer ramparts — a perfect medieval fortress.

---

## 8 · Château de Chambord ★
*Centre-Val de Loire · Loir-et-Cher*

**Nutshell.** The largest and most extravagant of the Loire châteaux, built by Francis I as a hunting palace and a monument to Renaissance ambition. Its double-helix staircase — perhaps influenced by Leonardo da Vinci — rises through the central keep like a spiral of power.

- **When** — Renaissance, built 1519–1547; the grandest expression of the French Renaissance style.
- **Who** — Francis I, the Renaissance king who fought Charles V and patronised Leonardo and the arts.
- **People** — Francis I; perhaps Leonardo da Vinci, who lived nearby at Amboise and may have designed the staircase; architect Domenico da Cortona.
- **Events** — Never fully completed; Louis XIV stayed here briefly and Molière premiered *Le Bourgeois Gentilhomme* in its grounds; French state property since 1930.
- **Concepts** — `renaissance` · `chateaux-de-la-loire` · `double-helix-staircase`

**Clues:**
1. The largest of the Loire châteaux, built by Francis I as a hunting palace in the 16th century.
2. Its double-helix staircase is said to be inspired by Leonardo da Vinci.
3. Molière performed *Le Bourgeois Gentilhomme* in its grounds for Louis XIV.
4. A Renaissance fantasy of turrets, chimneys and lanterns rising above the Sologne forest.
5. Built to display the king's power, it was rarely used as a residence.

---

## 9 · Pont du Gard ★
*Occitanie · Gard*

**Nutshell.** The highest surviving Roman aqueduct bridge, carrying water 50 km to the city of Nîmes. Its three tiers of arches span the Gardon valley with sublime engineering — a stone water-channel built without mortar around AD 50.

- **When** — Roman, built c. AD 40–60; part of a 50-km aqueduct supplying Nîmes; in use for about 400 years.
- **Who** — The Roman Empire's capacity to move water across vast distances; the colonia of Nemausus (Nîmes).
- **People** — Built under the Emperor Claudius or Nero; named after the nearby town of Pont-Saint-Esprit, not the Gardon river.
- **Events** — The aqueduct fell into disuse after the 4th C; was used as a toll bridge in medieval times; restored in the 18th C and again in the 21st; now the most-visited Roman monument in France.
- **Concepts** — `roman-province` · `roman-aqueduct` · `gallia-narbonensis`

**Clues:**
1. The highest surviving Roman aqueduct bridge, its three tiers of arches carrying water to Nîmes.
2. Built without mortar around AD 50, its stones held by gravity and iron clamps.
3. Part of a 50-kilometre aqueduct that dropped only 17 metres — a gradient of 0.03%.
4. The most-visited Roman monument in France, spanning the Gardon valley.
5. It carried 40,000 cubic metres of water a day for 400 years — then became a medieval toll bridge.

---

## 10 · Lascaux Cave ★
*Nouvelle-Aquitaine · Dordogne*

**Nutshell.** A cave in the Vézère valley covered with some of the finest known Palaeolithic paintings — bulls, horses and deer rendered in mineral pigments around 17,000 years ago. Discovered in 1940, it revolutionised understanding of prehistoric art; the original is now closed, preserved by exact replicas.

- **When** — Upper Palaeolithic, c. 17,000 years ago; discovered 12 September 1940; closed to the public in 1963.
- **Who** — Cro-Magnon hunter-gatherers of the last Ice Age; the "Hall of the Bulls" is the most famous panel.
- **People** — Four teenagers discovered it when their dog fell into a hole; the replica Lascaux IV opened in 2016.
- **Events** — The discovery (1940); the rapid deterioration from visitors' breath and light led to closure (1963); successive replica facsimiles have kept it accessible.
- **Concepts** — `paleolithic` · `cave-painting` · `ice-age`

**Clues:**
1. A cave in the Vézère valley whose walls are painted with bulls and horses from 17,000 years ago.
2. Four teenagers discovered it in 1940 when their dog fell into a hidden shaft.
3. The original had to be closed in 1963 because visitors' breath was damaging the paintings.
4. The largest animal painted here, the Great Black Bull, is over five metres long.
5. The "Sistine Chapel of Prehistory" — preserved through exact facsimile caves.

---

## 11 · Mont Blanc ★
*Auvergne-Rhône-Alpes · Haute-Savoie*

**Nutshell.** At 4,805 m, the highest peak in the Alps and western Europe, straddling the French-Italian border. The "white mountain" draws climbers, mountaineers and the Mont Blanc tunnel through its base linking France and Italy.

- **When** — A glaciated Alpine peak; first ascent 8 August 1786 by Jacques Balmat and Dr Michel-Gabriel Paccard.
- **Who** — A symbol of Alpine exploration and the birth of modern mountaineering.
- **People** — Balmat and Paccard, the first ascensionists; the Mont Blanc massif's guides and rescue teams.
- **Events** — First ascent (1786); the 11.6-km Mont Blanc road tunnel opened in 1965; major avalanche and climbing incidents.
- **Concepts** — `the-alps` · `glaciation` · `first-ascent`

**Clues:**
1. At 4,805 metres, the highest summit in the Alps and in western Europe.
2. First climbed in 1786 by a crystal hunter and a doctor from Chamonix.
3. A road tunnel over 11 kilometres long runs beneath its base, connecting France and Italy.
4. It dominates the skyline of Chamonix, the birthplace of modern mountaineering.
5. The "white mountain" whose glaciers feed the Arve and eventually the Rhône.

---

## 12 · Sacré-Cœur Basilica
*Île-de-France · Paris*

**Nutshell.** The gleaming white basilica atop Montmartre, built in the Romano-Byzantine style between 1875 and 1914 as a penance for France's defeat in the Franco-Prussian War. Its dome offers the highest panoramic view of Paris.

- **When** — Built 1875–1914 (consecrated 1919), in the Romano-Byzantine style, after the Franco-Prussian War (1870–71).
- **Who** — A national votive church, symbol of the conservative Catholic revival after France's humiliation.
- **People** — Architect Paul Abadie; the National Assembly voted its construction as a "vow" to the Sacred Heart.
- **Events** — The Franco-Prussian War and the Paris Commune; consecrated just after WWI; the Montmartre hill has been a site of worship since the Gallo-Roman era.
- **Concepts** — `romano-byzantine` · `paris-commune` · `franco-prussian-war`

**Clues:**
1. A white basilica atop Montmartre, built as a penitential vow after the Franco-Prussian War.
2. Its dome rises to the second-highest viewpoint in Paris, after the Eiffel Tower.
3. Built in a Romano-Byzantine style that stands out against Gothic Paris.
4. The exterior is kept gleaming white by a self-cleaning mineral called travertine.
5. Its construction spanned the birth of the Third Republic and the healing of France's wounds.

---

## 13 · Musée d'Orsay
*Île-de-France · Paris*

**Nutshell.** The world's greatest collection of Impressionist and Post-Impressionist art, housed in a former Beaux-Arts railway station built for the 1900 World's Fair. Monet, Renoir, Degas, Van Gogh and Cézanne line its grand nave.

- **When** — Gare d'Orsay built 1897–1900 for the World's Fair; converted into a museum opened in 1986.
- **Who** — The museum of 19th-century French art, bridging the Louvre (pre-1848) and the Pompidou Centre (post-1914).
- **People** — Monet, Manet, Renoir, Degas, Cézanne, Van Gogh, Gauguin, Rodin (Balzac) — the great names of French art from 1848–1914.
- **Events** — The station became obsolete for long trains; saved from demolition in the 1970s; converted into a museum in the 1980s under President Mitterrand.
- **Concepts** — `impressionism` · `post-impressionism` · `belle-epoque` · `worlds-fair`

**Clues:**
1. A former Beaux-Arts railway station turned into a museum of 19th-century art.
2. The world's premier collection of Impressionist and Post-Impressionist paintings.
3. Monet's water lilies, Van Gogh's self-portrait and Renoir's *Bal du moulin de la Galette* are all here.
4. Built as a railway station for the 1900 World's Fair, its platforms now hold sculptures.
5. Its great clock face still watches over the Seine from the Left Bank.

---

## 14 · Panthéon
*Île-de-France · Paris*

**Nutshell.** A neo-classical mausoleum on the Montagne Sainte-Geneviève, built as a church to honour Paris's patron saint but turned during the Revolution into a secular temple for France's great minds. Voltaire, Rousseau, Hugo, Curie and Malraux are among those buried within.

- **When** — Neo-classical, built 1757–1790 by Soufflot; repurposed as a mausoleum in 1791 during the Revolution.
- **Who** — "Aux grands hommes, la patrie reconnaissante" (To great men, the grateful fatherland); secular burial place for national luminaries.
- **People** — Voltaire, the first to be interred (1791); Rousseau (1794); Victor Hugo (1885); Marie Curie (1995, first woman on her own merits); the architect Jacques-Germain Soufflot.
- **Events** — Foucault's pendulum demonstration (1851) proving the Earth's rotation; the building has oscillated between church and mausoleum several times.
- **Concepts** — `french-revolution` · `neo-classical` · `laicite`

**Clues:**
1. A neo-classical mausoleum on the Left Bank, built by Soufflot and turned into a secular temple in 1791.
2. Voltaire lies here, the first of France's great minds to be interred.
3. Its dome was inspired by St Paul's in London and the Pantheon in Rome.
4. Foucault hung his pendulum here in 1851, proving the Earth spins.
5. "To great men, the grateful fatherland" — though Marie Curie is among its honoured dead.

---

## 15 · Chartres Cathedral
*Centre-Val de Loire · Eure-et-Loir*

**Nutshell.** The finest surviving French Gothic cathedral, its twin spires visible across the wheat fields of the Beauce. Built at lightning speed (1194–1220) after a fire destroyed its predecessor, it preserves the most complete set of 13th-century stained glass in the world.

- **When** — High Gothic, rebuilt 1194–1220 after a fire; the south spire is 12th C Romanesque, the north spire 16th C Flamboyant Gothic.
- **Who** — The Virgin Mary's tunic, the Sancta Camisa, kept here made it one of medieval Europe's great pilgrimage sites.
- **People** — The builders are anonymous, but the labyrinth in the nave was walked by pilgrims.
- **Events** — Survived both world wars with its glass intact (the windows were removed for safekeeping); the 1194 fire revealed the cathedral needed rebuilding; the Royal Portal and three great lancets are masterpieces.
- **Concepts** — `gothic` · `stained-glass` · `pilgrimage` · `flying-buttress`

**Clues:**
1. A High Gothic cathedral whose 176 stained-glass windows are the finest 13th-century set surviving.
2. Rebuilt at record speed (1194–1220) after a fire; its spire tips are visible from 30 km away.
3. Pilgrims came here to venerate the Sancta Camisa, said to be the Virgin Mary's tunic.
4. Its labyrinth in the nave was walked by medieval pilgrims as a miniature Jerusalem pilgrimage.
5. The Royal Portal on its west front is carved with Christ in Majesty and the signs of the zodiac.

---

## 16 · Reims Cathedral
*Grand Est · Marne*

**Nutshell.** The coronation church of French kings, where 33 monarchs from Clovis to Charles X were crowned. Its west front with the Smiling Angel and its vast rose window are among the highest achievements of French Gothic.

- **When** — Gothic, begun 1211, completed 14th C; heavily damaged by German shelling in WWI, restored in the 20th C.
- **Who** — The royal consecration church; the Archbishop of Reims anointed the kings of France.
- **People** — Clovis, first Christian king of the Franks, baptised here c. 496; Joan of Arc attended Charles VII's coronation (1429).
- **Events** — The coronation of French kings (33 of them); the German bombardment of 1914 that nearly destroyed it; the 1962 reconciliation between de Gaulle and Adenauer.
- **Concepts** — `gothic` · `french-revolution` · `stained-glass` · `world-war-one`

**Clues:**
1. The cathedral where French kings were crowned — 33 coronations from Clovis to Charles X.
2. Joan of Arc stood in its nave when Charles VII was crowned in 1429.
3. Its Smiling Angel on the west front became a symbol of resilience after WWI.
4. German artillery shelled it in 1914; it was rebuilt with American support from the Rockefeller family.
5. The highest Gothic nave in France at 38 metres, with a 12-metre rose window.

---

## 17 · Strasbourg Cathedral
*Grand Est · Bas-Rhin*

**Nutshell.** A masterpiece of Gothic architecture in pink Vosges sandstone, with a single spire that made it the tallest building in Christendom for over two centuries (1647–1874). Its astronomical clock and the Stained Glass of the south transept are wonders.

- **When** — Gothic, built 1015–1439; the north tower (the spire) was completed in 1439; the south tower was never built.
- **Who** — The cathedral of the city at the crossroads of French and German cultures.
- **People** — Architect Erwin von Steinbach designed the west front; the cathedral is a symbol of Alsatian identity.
- **Events** — A Lutheran cathedral after the Reformation, returned to Catholicism when France took Alsace; survived both world wars largely intact.
- **Concepts** — `gothic` · `stained-glass` · `astronomical-clock`

**Clues:**
1. A single spire in pink sandstone that was the tallest building in Christendom for 227 years.
2. Its astronomical clock (1843) shows the planets, saints and a rooster that crows at noon.
3. Built on the foundations of a Roman temple, it was completed in 1439 — the south tower was never raised.
4. The "cathedral of pink sandstone" at the crossroads of France and Germany.
5. Its west front, designed by Erwin von Steinbach, is a wall of tracery and statues.

---

## 18 · Château de Chenonceau
*Centre-Val de Loire · Indre-et-Loire*

**Nutshell.** The "Château des Dames" — built, extended and saved by a succession of powerful women. Its gallery spans the river Cher on graceful arches, making it the most elegant and photographed of the Loire châteaux.

- **When** — Built 1513–1521; the gallery over the Cher was added 1556–1559.
- **Who** — A castle of queens and regents: Catherine Briçonnet, Diane de Poitiers, Catherine de' Medici, Louise of Lorraine, Madame Dupin.
- **People** — Diane de Poitiers, Henri II's mistress, built the bridge gallery; Catherine de' Medici forced her to exchange it for Chaumont after the king's death; Madame Dupin saved it from the Revolution's destruction.
- **Events** — Used as a hospital in WWI; an escape route for the Resistance in WWII; saved from demolition by its aristocratic owners.
- **Concepts** — `renaissance` · `chateaux-de-la-loire` · `french-revolution`

**Clues:**
1. A Loire château whose gallery spans the river Cher on arched stone piers.
2. Built and shaped by powerful women — Diane de Poitiers and Catherine de' Medici.
3. During WWII its gallery served as an escape route from the German-occupied side to the Free Zone.
4. Madame Dupin saved it from destruction during the Revolution by running a salon inside.
5. The most feminine of the Loire châteaux, reflected in the still water of the Cher.

---

## 19 · Palais des Papes, Avignon
*Provence-Alpes-Côte d'Azur · Vaucluse*

**Nutshell.** The largest Gothic palace ever built, the seat of the popes who abandoned Rome for Avignon from 1309 to 1377. A fortress-palace of vast halls and chapels, it dominates the city walls on the Rhône.

- **When** — Gothic, built 1335–1364 mainly under Popes Benedict XII and Clement VI; the Avignon Papacy lasted from 1309 to 1377, followed by the Western Schism.
- **Who** — The papacy in exile; the popes were effectively controlled by the French crown.
- **People** — Pope Clement VI, who bought the city and built the grandest halls; Petrarch, who called Avignon "the Babylon of the West"; the anti-popes of the Great Schism.
- **Events** — The Avignon Papacy (1309–1377); the Western Schism (1378–1417) when there were rival popes in Avignon and Rome; the palace was looted during the Revolution and used as a barracks.
- **Concepts** — `gothic` · `avignon-papacy` · `papal-schism` · `french-revolution`

**Clues:**
1. The largest Gothic palace ever built — the seat of popes who fled Rome in the 14th century.
2. Clement VI built the grandest halls; Petrarch called the city "the Babylon of the West."
3. The papacy remained here for nearly 70 years, followed by the Great Schism.
4. A fortress-palace above the Rhône that was later looted by revolutionaries and used as barracks.
5. Its vast empty halls are now a UNESCO site and stage cultural exhibitions.

---

## 20 · Millau Viaduct
*Occitanie · Aveyron*

**Nutshell.** The world's tallest bridge, a cable-stayed ribbon of steel slicing across the Tarn valley. Opened in 2004, its seven pylons rise to 343 m — taller than the Eiffel Tower — carrying the A75 motorway through the Massif Central.

- **When** — Contemporary, designed 1990s, opened 14 December 2004.
- **Who** — Modern French civil engineering; a solution to the bottleneck of the Massif Central for north-south traffic.
- **People** — Engineer Michel Virlogeux and architect Sir Norman Foster; built by the Eiffage group.
- **Events** — Opened to decongest the A75 route from Paris to the Mediterranean; the tallest bridge mast (at 343 m) exceeds the Eiffel Tower.
- **Concepts** — `modern-engineering` · `cable-stayed-bridge` · `massif-central`

**Clues:**
1. The world's tallest bridge, its tallest mast reaching 343 metres — exceeding the Eiffel Tower.
2. Designed by Michel Virlogeux and Norman Foster, it floats across the Tarn valley.
3. Opened in 2004 to solve a motorway bottleneck across the Massif Central.
4. Seven steel pylons and a white deck suspended by cables over the green valley.
5. A modern engineering marvel connecting Clermont-Ferrand to the Mediterranean.

---

## 21 · Dune du Pilat
*Nouvelle-Aquitaine · Gironde*

**Nutshell.** The tallest sand dune in Europe, rising 110 m above the Atlantic coast at the entrance to the Arcachon basin. It advances inland at several metres a year, slowly burying the forest of Les Landes beneath golden sand.

- **When** — A geological formation driven by wind and tide; a natural feature growing over centuries.
- **Who** — The coast of Les Landes, shaped by Atlantic winds and the great pine forest.
- **People** — The pilots (pinasses) of the Arcachon oyster beds; tourists climb its steep face.
- **Events** — The dune is constantly moving (1–5 m/year inland); the forest beneath it has been buried over time; it is a natural lookout over the Bay of Arcachon.
- **Concepts** — `dune` · `landes-forest` · `atlantic-coast`

**Clues:**
1. The tallest sand dune in Europe, rising 110 metres above the Atlantic coast.
2. It advances inland several metres each year, slowly burying the forest beneath it.
3. From its crest you see the Arcachon basin, its oyster beds and the Atlantic rollers.
4. Climbing its steep face rewards you with a panoramic view of the Landes coast.
5. A mountain of golden sand at the gateway to the Bay of Arcachon.

---

## 22 · Gorges du Verdon
*Provence-Alpes-Côte d'Azur · Var / Alpes-de-Haute-Provence*

**Nutshell.** Europe's largest canyon, carved by the turquoise Verdon river through limestone cliffs up to 700 m deep. Its river is famed for kayaking and its roads for vertiginous views; the emerald water has given it the name "Grand Canyon of Europe."

- **When** — Geological, carved over millennia by the Verdon river; the Sainte-Croix dam (1974) created the lake at its mouth.
- **Who** — A natural wonder of Haute-Provence.
- **People** — Édouard-Alfred Martel explored and mapped the gorge in 1905; today it draws climbers, kayakers, hikers.
- **Events** — Martel's 1905 exploration opened it to the world; the dam flooded the lower valley.
- **Concepts** — `canyon` · `limestone` · `haute-provence` · `provencal-climate`

**Clues:**
1. Europe's largest canyon, with turquoise water cutting through limestone 700 metres deep.
2. Édouard-Alfred Martel first explored this gorge in 1905 — it is now a paradise for kayakers.
3. The Sainte-Croix dam created the turquoise lake at its mouth in 1974.
4. The "Grand Canyon of Europe" in the heart of Haute-Provence.
5. A river of emerald water between sheer limestone cliffs in southeastern France.

---

## 23 · Étretat
*Normandy · Seine-Maritime*

**Nutshell.** Spectacular chalk cliffs on the Alabaster Coast of Normandy, shaped by the sea into natural arches and a tall needle — the Aiguille. They have inspired artists from Monet to Arsène Lupin's *The Hollow Needle*.

- **When** — Geological (chalk, ~70–100 million years old); painted by Monet and other Impressionists in the 19th C.
- **Who** — A natural landmark of the Normandy coast; a favourite subject of the Impressionists.
- **People** — Claude Monet painted the cliffs twenty times; Maurice Leblanc set his Arsène Lupin novel here.
- **Events** — The Impressionists made it famous; erosion constantly reshapes the arches.
- **Concepts** — `chalk-cliffs` · `impressionism` · `the-english-channel`

**Clues:**
1. Chalk cliffs with a natural arch and a needle-like pinnacle on the Normandy coast.
2. Monet painted them more than twenty times — they are a monument of Impressionism.
3. The "Aiguille" (needle) is a 70-metre chalk stack rising from the English Channel.
4. Arsène Lupin's secret hollow hideaway is hidden in these cliffs.
5. The Alabaster Coast's most famous landmark, shaped by the sea and wind.

---

## 24 · Carnac Standing Stones
*Brittany · Morbihan*

**Nutshell.** The world's greatest concentration of megalithic monuments: some 3,000 standing stones arranged in long alignments, dolmens and tumuli across the Morbihan coast, erected by Neolithic peoples between 4500 and 2000 BC.

- **When** — Neolithic, c. 4500–2000 BC; the alignments are the largest known megalithic complex.
- **Who** — Pre-Celtic, Neolithic farming communities; the builders predate the Celtic Bretons by millennia.
- **People** — No named figures; local tradition credits the stones to a Roman legion turned to stone or fairies.
- **Events** — The alignments are ceremonial, possibly astronomical; they were re-erected from the 19th C onward and protected as a monument in the 20th; the site is threatened by encroaching development.
- **Concepts** — `neolithic` · `megalith` · `standing-stone` · `dolmen`

**Clues:**
1. Some 3,000 standing stones in long alignments across the Morbihan coast — the world's largest megalithic complex.
2. Neolithic farmers raised them between 4500 and 2000 BC, centuries before the Celts arrived.
3. The Menec alignment stretches for a kilometre in eleven converging rows.
4. Local legend says they are a Roman legion turned to stone.
5. The oldest surviving man-made landscape in Brittany, older than the Pyramids.

---

## 25 · Calanques de Piana
*Corsica · Corse-du-Sud*

**Nutshell.** A breathtaking coastal landscape of blood-red granite cliffs and eroded rock formations plunging into the turquoise Mediterranean on the Gulf of Porto. The "calanques" (coves) of Piana are the most dramatic of Corsica's granite wonders, a UNESCO World Heritage site.

- **When** — Geological; the granite formed ~250 million years ago; sculpted by erosion over millennia.
- **Who** — A Corsican natural wonder; the Scandola Nature Reserve protects the wider Gulf of Porto.
- **People** — The site is part of the Corsica Regional Nature Park.
- **Events** — Listed as a UNESCO World Heritage site in 1983 (Gulf of Porto).
- **Concepts** — `granite` · `gulf-of-porto` · `calanques` · `corsican-identity`

**Clues:**
1. Blood-red granite cliffs and sculpted rock formations plunging into the Mediterranean near Porto.
2. Part of the Gulf of Porto UNESCO site, they are the most photographed natural wonder in Corsica.
3. The eroded red rocks take fantastic shapes — the Head of the Dog, the Heart — carved by the wind.
4. A coastal landscape of deep coves and granite needles on the wild western coast of Corsica.
5. The turquoise sea and red rock of the Calanques create Corsica's most dramatic seascape.

---

## 26 · Amiens Cathedral
*Hauts-de-France · Somme*

**Nutshell.** The largest Gothic cathedral in France by interior volume, with a nave rising to 42.3 metres. Built at extraordinary speed (1220–1269), its west front's sculpted "Beau Dieu" and the weeping cherub are masterpieces of Gothic sculpture.

- **When** — High Gothic, built 1220–1269 (just 49 years — exceptionally fast for a Gothic cathedral).
- **Who** - The cathedral of the historic capital of Picardy.
- **People** — Bishop Évrard de Fouilloy initiated it; the builder Robert de Luzarches left his name in the labyrinth.
- **Events** — Built over a miraculously short period; damaged in both world wars, restored; the three-storey elevation and immense windows define the High Gothic.
- **Concepts** — `gothic` · `high-gothic` · `flying-buttress`

**Clues:**
1. The largest Gothic cathedral in France by interior volume, its nave rising 42 metres.
2. Built in just 49 years (1220–1269) — an extraordinary pace for a Gothic cathedral.
3. Its west front is carved with the Beau Dieu and the weeping cherub.
4. The labyrinth in its floor was laid by the master mason Robert de Luzarches.
5. The defining High Gothic church in the Picardy plains near the WWI battlefields.

---

## 27 · Arles Amphitheatre
*Provence-Alpes-Côte d'Azur · Bouches-du-Rhône*

**Nutshell.** A two-tiered Roman arena built around AD 90, seating 20,000 spectators for chariot races and gladiator combats — one of the best-preserved Roman amphitheatres in the world. It still hosts bullfights and summer events today.

- **When** — Roman, built c. AD 90; reused as a fortress in the Middle Ages; restored from the 19th C.
- **Who** — The Roman colonia of Arelate (Arles) on the Rhône.
- **People** — The arena is anonymous but Arles was a favourite city of Julius Caesar.
- **Events** — Gladiator combat and chariot races; medieval houses were built into its arches; it is now used for bullfighting (courses camarguaises) and concerts.
- **Concepts** — `roman-amphitheatre` · `roman-province` · `gallia-narbonensis`

**Clues:**
1. A two-tiered Roman arena seating 20,000, built around AD 90 — one of the best-preserved in the world.
2. In the Middle Ages, houses and a fortress were built into its arches.
3. It still hosts bullfights and concerts today, 1,900 years after its construction.
4. The Roman city of Arelate on the Rhône was one of the empire's great provincial centres.
5. Larger than the arena of Nîmes, it is the defining monument of Roman Provence.

---

## 28 · Hospices de Beaune
*Bourgogne-Franche-Comté · Côte-d'Or*

**Nutshell.** The most famous medieval hospital in France, founded in 1443 by Nicolas Rolin, chancellor of Burgundy, as a charity for the poor. Its Flemish-inspired Gothic architecture, polychrome roof tiles and the "Last Judgment" altarpiece by Rogier van der Weyden make it the jewel of Burgundy.

- **When** — Gothic, founded 1443; functioned as a charity hospital until 1971; now a museum.
- **Who** — The poor of Beaune; the Rolin and de Salins families endowed it with vineyards.
- **People** — Nicolas Rolin, the founding chancellor; Guigone de Salins, his wife; Rogier van der Weyden, who painted the altarpiece.
- **Events** — The annual Hospices de Beaune wine auction (since 1859) funds the hospital; it treated the poor for five centuries.
- **Concepts** — `medieval` · `burgundy-wine` · `flamboyant-gothic` · `polyptych`

**Clues:**
1. A 15th-century charity hospital founded by Nicolas Rolin, chancellor of Burgundy.
2. Its polychrome glazed roof tiles and Flemish-inspired architecture are unique in Burgundy.
3. Rogier van der Weyden's great *Last Judgment* altarpiece hangs in its chapel.
4. Its vineyard endowment funds the world-famous annual wine auction.
5. It treated the poor of Beaune for over five centuries before becoming a museum.

---

## 29 · Albi Cathedral
*Occitanie · Tarn*

**Nutshell.** The largest brick-built cathedral in the world, a fortress-church with a massive bell-tower rising above the Tarn. Its interior explodes with a complete cycle of Italian Renaissance frescoes — the largest such ensemble in France.

- **When** — Gothic, built 1282–1480 in brick (the local material); the frescoed interior dates from 1500–1515.
- **Who** — The Cathar stronghold; built after the Albigensian Crusade as a symbol of Catholic power.
- **People** — The Dominican bishop Bernard de Castanet began the construction; the frescoes were painted by Italian artists.
- **Events** — The Albigensian Crusade crushed the Cathars; the cathedral was built as a statement of triumph; it was painted inside by Bolognese artists in the early 16th C.
- **Concepts** — `gothic` · `albigensian-crusade` · `cathar` · `fresco`

**Clues:**
1. The largest brick-built cathedral in the world, looking more like a fortress than a church.
2. Built in the aftermath of the Albigensian Crusade, it was a victory monument in brick.
3. Its interior vault is entirely covered with Italian Renaissance frescoes — the largest set in France.
4. The bell-tower dominates the Tarn valley, visible across the red brick rooftops of Albi.
5. A fortress-cathedral in the land of the Cathars, now a UNESCO site.

---

## 30 · Rouen Cathedral
*Normandy · Seine-Maritime*

**Nutshell.** A Gothic cathedral whose towering lantern spire (151 m) makes it the tallest in France. Monet painted it over 30 times at different hours, capturing its changing light — and its massive west front holds the tombs of Rollo and Richard the Lionheart.

- **When** — Gothic, built from 1030; the current spire dates from 1876 (cast iron); Monet's series 1892–1894.
- **Who** — The cathedral of the historic capital of Normandy.
- **People** — Monet made it famous through his series of paintings; Rollo, the first Viking duke of Normandy, and Richard the Lionheart are buried here.
- **Events** — Joan of Arc was condemned to death here in 1431; the spire was the tallest in the world (1876–1880); bombed in WWII (1944).
- **Concepts** — `gothic` · `impressionism` · `norman-conquest` · `stained-glass`

**Clues:**
1. The tallest cathedral in France, topped by a 16th-century cast-iron spire.
2. Monet painted its west front more than 30 times to capture changing light.
3. Rollo the Viking and Richard the Lionheart are buried within its walls.
4. Joan of Arc was tried and condemned to death here in 1431.
5. Its lantern spire rises 151 metres above the capital of Normandy.

---

## 31 · Basilica of Notre-Dame de Fourvière
*Auvergne-Rhône-Alpes · Rhône*

**Nutshell.** The white basilica dominating Lyon from the Fourvière hill, built 1872–1896 as a votive offering after the Franco-Prussian War — a companion to Sacré-Cœur in Paris. Its terrace offers the finest panorama of the city, and the nearby Roman theatres make the hill a layer-cake of history.

- **When** — Built 1872–1896 in a blend of Romanesque, Byzantine and Gothic styles; the hill has been a religious site since Roman times.
- **Who** — The Virgin Mary, protectress of Lyon; the city's Catholics.
- **People** — Architect Pierre Bossan; the hill was the site of the Roman capital of Gaul, Lugdunum.
- **Events** — The vow after Franco-Prussian War; the Silk Weavers' Revolt (1831) on the slopes below.
- **Concepts** — `romano-byzantine` · `franco-prussian-war` · `lugdunum` · `lyon`

**Clues:**
1. A white basilica on the hill of Fourvière, built as a votive offering after the Franco-Prussian War.
2. Its terrace gives the best panoramic view of Lyon, at the confluence of the Saône and Rhône.
3. The hill was once the Roman capital of Gaul — Lugdunum, with its theatres still standing nearby.
4. Blending Romanesque, Byzantine and Gothic, it is Sacré-Cœur's southern counterpart.
5. Lyon's "praying hill," with a golden Virgin watching over the city's rooftops.

---

## 32 · Centre Pompidou
*Île-de-France · Paris*

**Nutshell.** The iconoclastic Parisian art centre designed by Rogers and Piano, with its brightly coloured structural skeleton exposed on the outside — all pipes, ducts and escalators in glass tubes. It houses the National Museum of Modern Art, Europe's largest collection of 20th- and 21st-century art.

- **When** — Contemporary, opened 1977; designed by Renzo Piano and Richard Rogers; Stravinsky Fountain outside added 1983.
- **Who** — A cultural institution combining a museum, library, music research centre (IRCAM) and cinema.
- **People** — Architects Rogers and Piano; the fountain sculptures are by Jean Tinguely and Niki de Saint Phalle.
- **Events** — Controversial when built (called "the cultural supermarket"); now one of Paris's most-visited attractions; a major library and youth culture hub in the Beaubourg district.
- **Concepts** — `high-tech-architecture` · `modern-art` · `contemporary-art`

**Clues:**
1. A building whose coloured pipes, ducts and escalator tubes are exposed on the outside.
2. Europe's largest collection of modern and contemporary art is housed inside its vast column-free spaces.
3. Opened in 1977, its inside-out design by Rogers and Piano scandalised Paris at first.
4. The Stravinsky Fountain outside features whimsical mechanical sculptures by Tinguely and Saint Phalle.
5. A "cultural supermarket" in the Beaubourg district — one of Paris's most-visited sights.

---

## 33 · Les Landes Coast
*Nouvelle-Aquitaine · Landes / Gironde*

**Nutshell.** A 230-kilometre stretch of wild Atlantic coastline hemmed by Europe's largest maritime pine forest — the forest of Les Landes. Long sandy beaches, powerful surf and the region's unique culture of pastoral shepherds on stilts make it a distinctive natural and human landscape.

- **When** — A natural formation of dunes, pine forest and wetlands; the forest was systematically planted in the 19th C to drain the marshes and stabilise the sand.
- **Who** — The Landais people; the "shepherds on stilts" who once watched their flocks across the vast flatlands.
- **People** — Napoleon III authorised the planting of the pine forest; today it is a surfing destination and holiday coast.
- **Events** - The 19th-C draining of the marshy Landes (2/3 of the region was marshland); the growth of pine monoculture for resin; the 20th-C development of surf tourism at Hossegor and Biarritz.
- **Concepts** — `landes-forest` · `atlantic-coast` · `pine-plantation` · `dune`

**Clues:**
1. A 230-kilometre coast of pine forest, sand and Atlantic surf — Europe's longest beachfront forest.
2. Shepherds once walked on stilts across this vast flatland to watch their flocks.
3. Napoleon III's government planted the pine forest in the 19th century to drain the marsh.
4. Hossegor and Biarritz make this coast Europe's premier surfing destination.
5. A landscape of lakes, dunes and the largest maritime pine forest in Europe, between Bordeaux and Bayonne.

---

## Glossary

Shared, linked concept layer. Definitions kept concise; reused across entries.

### Periods & dynasties
- **paleolithic** — Palaeolithic (Old Stone Age): the earliest human period, before farming, spanning most of prehistory. Lascaux's paintings are ~17,000 years old.
- **neolithic** — Neolithic (New Stone Age): the period from c. 6000 BC in France when farming, megalith-building and sedentary communities emerged.
- **roman-province** — Roman province: a territory outside Italy governed by Rome; Gaul was divided into Gallia Narbonensis, Lugdunensis, Aquitania and Belgica.
- **medieval** — Medieval / Middle Ages (5th–15th C): the period between the fall of Rome and the Renaissance, marked by feudalism, monasticism and cathedral-building.
- **renaissance** — Renaissance (15th–16th C): the cultural movement reviving classical art and learning; in France it is best expressed in the Loire châteaux and the work of Leonardo.
- **ancien-regime** — Ancien Régime: the French monarchy and social order before the Revolution (15th–18th C), based on absolute monarchy and the three estates.
- **french-revolution** — French Revolution (1789–1799): the upheaval that overthrew the Bourbon monarchy, abolished feudalism, established the First Republic, and reshaped France.
- **napoleonic** — Napoleonic era (1799–1815): the Consulate and First Empire under Napoleon Bonaparte, marked by conquest, legal reform (the Code) and monumental architecture.
- **belle-epoque** — Belle Époque (1871–1914): the "beautiful era" of peace, prosperity, art nouveau, world's fairs and cultural confidence in France before WWI.
- **franco-prussian-war** — Franco-Prussian War (1870–71): the conflict in which Prussia defeated France, leading to the fall of Napoleon III, the Paris Commune and the loss of Alsace-Lorraine.
- **world-war-one** — First World War (1914–1918): the Great War, whose Western Front trenches ran through northern and eastern France; Reims Cathedral was shelled.
- **worlds-fair** — World's Fair / Exposition Universelle: the 19th–20th C international exhibitions held in Paris (1855, 1889, 1900 and others), showcasing industry, art and engineering.

### Architecture & styles
- **gothic** — Gothic (mid-12th–16th C): the pointed-arch, stone-vaulted, light-filled style born at Saint-Denis near Paris; the defining style of French cathedrals.
- **high-gothic** — High Gothic (c. 1190–1250): the mature phase of French Gothic, with soaring naves, flying buttresses and vast rose windows. → Chartres, Amiens, Reims.
- **flamboyant-gothic** — Flamboyant Gothic (14th–16th C): the final French Gothic phase, named for its flame-like stone tracery. → Rouen, Sainte-Chapelle upper chapel.
- **romanesque** — Romanesque (11th–12th C): the round-arched, thick-walled style that preceded Gothic in France, with barrel vaults and sculpted capitals. → Mont-Saint-Michel.
- **romano-byzantine** — Romano-Byzantine: a 19th-century revival style combining Roman round arches with Byzantine domes and mosaics. → Sacré-Cœur, Fourvière.
- **baroque** — French Baroque / Classicism (17th C): the grand, symmetrical, ornate style of Louis XIV's reign. → Versailles.
- **neo-classical** — Neo-classical (mid-18th–19th C): a revival of classical Greek and Roman forms, with columns, pediments and domes. → Panthéon.
- **high-tech-architecture** — High-tech architecture: a late-20th-century style that exposes a building's structure, services and circulation on the outside. → Centre Pompidou.
- **wrought-iron** — Wrought iron: a malleable iron form used decoratively in 19th-century architecture and engineering. → Eiffel Tower.
- **flying-buttress** — Flying buttress: an arched masonry support that transfers the weight of a vaulted roof to external piers, allowing tall windows. → Gothic cathedrals.
- **rose-window** — Rose window: a large circular stained-glass window with radiating tracery, characteristic of Gothic cathedrals.
- **stained-glass** — Stained glass: coloured glass windows telling stories in light; the 13th-century glass at Chartres is the finest complete set surviving.
- **triumphal-arch** — Triumphal arch: a monumental arched structure built to commemorate a military victory. → Arc de Triomphe.
- **cable-stayed-bridge** — Cable-stayed bridge: a bridge whose deck is directly suspended from towers by cables in a fan pattern. → Millau Viaduct.
- **astronomical-clock** — Astronomical clock: a clock with moving figures and dials showing planetary positions, the zodiac and other astronomical data. → Strasbourg Cathedral.
- **fresco** — Fresco: a painting technique in which pigments are applied to wet plaster; the Albi cathedral ceiling is the largest fresco cycle in France.

### Events, wars & movements
- **hundred-years-war** — Hundred Years War (1337–1453): the dynastic conflict between the French and English thrones over succession to the French crown, ending in French victory.
- **albigensian-crusade** — Albigensian Crusade (1209–1229): the papal-led military campaign against the Cathar heresy in Languedoc, bringing the region under French royal control.
- **avignon-papacy** — Avignon Papacy (1309–1377): the period when the popes resided in Avignon rather than Rome, effectively under French influence.
- **papal-schism** — Western Schism (1378–1417): the split within the Catholic Church when rival popes sat in Rome and Avignon simultaneously.
- **paris-commune** — Paris Commune (1871): the radical socialist government that briefly ruled Paris after the Franco-Prussian War, violently suppressed.
- **impressionism** — Impressionism (1870s–1880s): the French art movement that broke with academic painting, capturing light and everyday scenes with visible brushwork. → Monet, Renoir, Degas.
- **post-impressionism** — Post-Impressionism (1880s–1900): the movement extending Impressionism toward structure, emotion and symbolism. → Van Gogh, Cézanne, Gauguin.
- **modern-art** — Modern art (late 19th–mid 20th C): art movements that rejected traditional representation, including Fauvism, Cubism, Surrealism and Abstract Expressionism.
- **contemporary-art** — Contemporary art (mid 20th C to present): art of the living era, often conceptual, installation-based or multimedia.

### Geography, nature & natural features
- **the-alps** — The Alps: Europe's highest mountain range, forming France's south-eastern border with Italy and Switzerland; Mont Blanc is the highest peak.
- **massif-central** — Massif Central: the large volcanic highland in south-central France, rising to 1,886 m.
- **glaciation** — Glaciation: the Ice-Age carving of valleys and peaks by moving ice, shaping the Alps and the Auvergne.
- **gulf-of-porto** — Gulf of Porto: a UNESCO-listed gulf on Corsica's west coast, encompassing the Calanques de Piana, the Scandola Reserve and the Girolata inlet.
- **calanques** — Calanques: steep-sided inlets or coves formed in limestone or granite along the Mediterranean coast.
- **canyon** — Canyon: a deep gorge carved by a river through rock; the Verdon canyon is Europe's largest.
- **dune** — Dune: a mound or ridge of wind-blown sand; the Dune du Pilat is Europe's tallest.
- **chalk-cliffs** — Chalk cliffs: soft white limestone cliffs formed from compressed marine microfossils. → Étretat.
- **landes-forest** — Forest of Les Landes: the largest maritime pine forest in Europe, planted in the 19th C on the Atlantic coast of south-west France.
- **atlantic-coast** — Atlantic coast (Côte d'Argent): the straight, sandy, surf-battered western coast of France from the Loire to the Basque Country.
- **haute-provence** — Haute-Provence: the mountainous, sparsely populated interior of Provence, known for lavender, limestone gorges and the Verdon.
- **provencal-climate** — Mediterranean climate: hot dry summers, mild winters and abundant sunshine characteristic of southern France.
- **tidal-island** — Tidal island: an island connected to the mainland at low tide but isolated at high tide. → Mont-Saint-Michel.
- **limestone** — Limestone: a sedimentary rock formed from marine shells and skeletons; it underlies much of southern France and shapes its karst landscapes.
- **granite** — Granite: a hard, coarse-grained igneous rock; the Calanques de Piana are famous for their red granite eroded into fantastic shapes.

### Art, religion & concepts
- **cave-painting** — Cave painting: prehistoric art on cave walls using mineral pigments; Lascaux is the finest known example.
- **megalith** — Megalith: a large stone used to build prehistoric monuments such as alignments, dolmens and menhirs.
- **standing-stone** — Standing stone / menhir: an upright megalith, often part of a larger alignment or circle. → Carnac.
- **dolmen** — Dolmen: a megalithic chamber tomb of two or more upright stones capped by a horizontal slab.
- **ice-age** — Ice Age: the period (Pleistocene) when much of northern Europe was covered by glaciers, lasting until about 11,700 years ago.
- **roman-aqueduct** — Roman aqueduct: a stone channel system carrying water over long distances using gravity; the Pont du Gard is the highest surviving example.
- **roman-amphitheatre** — Roman amphitheatre: a large oval arena used for gladiator contests and public spectacles. → Arles.
- **pilgrimage** — Pilgrimage: a journey to a sacred place; medieval France's great routes led to Mont-Saint-Michel, Chartres, Rocamadour and Santiago de Compostela.
- **absolutism** — Absolute monarchy: a system where the monarch holds supreme authority without legal limits; Louis XIV's France was the model.
- **laicite** — Laïcité: the French principle of secularism, separating religion from the state.
- **polyptych** — Polyptych: a multi-panel altarpiece, often hinged; Rogier van der Weyden's Beaune Altarpiece is a masterpiece of the form.
- **universal-museum** — Universal museum: a museum collecting the whole span of world culture under one roof. → Louvre.
- **chateaux-de-la-loire** — Châteaux of the Loire: the Renaissance and classical castles built by French kings and nobles in the Loire Valley (15th–16th C). → Chambord, Chenonceau.
- **burgundy-wine** — Burgundy wine: the wines of the Côte d'Or, some of the most prestigious in the world, historically tied to the Hospices de Beaune vineyard endowment.
- **lugdunum** — Lugdunum: the Roman name for Lyon, capital of the Roman province of Gallia Lugdunensis.
- **cathar** — Cathars: a Christian dualist movement declared heretical in the 12th–13th C, centred in Languedoc and crushed by the Albigensian Crusade.
- **corsican-identity** — Corsican identity: the distinct language, culture and history of Corsica, reflecting its mountainous terrain and contested sovereignty.
- **norman-conquest** — Norman Conquest: the 1066 conquest of England from Normandy; Rollo the Viking was the first Duke of Normandy.
- **unknown-soldier** — Unknown Soldier: a representative unidentified soldier buried to honour all war dead; the French Unknown lies under the Arc de Triomphe.
- **the-english-channel** — English Channel (La Manche): the sea separating France from England, ~33 km wide at the Strait of Dover.
- **first-ascent** — First ascent: the first successful climb to a mountain's summit; Mont Blanc's first ascent in 1786 marks the birth of modern mountaineering.
- **pine-plantation** — Pine plantation: an artificially planted forest, usually of maritime pine, for timber and resin. → Landes.
