// Supplemental accepted-answer aliases contributed by the summary-writing agents.
// These are unioned into each entry's own locationAccept / eventAccept lists at build
// time (see buildHistoryTopic) to widen recall without editing the deck datasets.
// The per-deck *-dates.ts files remain the primary source of truth.

export type AliasExtra = { locationAccept?: string[]; eventAccept?: string[] }

export const aliasOverlay: Record<string, AliasExtra> = {
  // --- World ---
  // (World deck aliases already comprehensive; add here if needed.)

  // --- France ---
  alesia: { eventAccept: ['gallic wars', 'vercingetorix'] },
  'baptism-clovis': { eventAccept: ['baptism clovis'] },
  'battle-tours-fr': { eventAccept: ['poitiers'] },
  'hugh-capet': { locationAccept: ['reims'], eventAccept: ['capet', 'capetian dynasty'] },
  bouvines: { locationAccept: ['flanders'] },
  'first-estates-general': { eventAccept: ['etats generaux'] },
  'hundred-years-war-begins': { eventAccept: ['100 years war'] },
  'joan-orleans': { eventAccept: ["jeanne d'arc"] },
  'hundred-years-war-end': { locationAccept: ['gascony'], eventAccept: ['hundred years war ends'] },
  marignano: { eventAccept: ['marignan'] },
  'st-bartholomew': { eventAccept: ['bartholomew massacre', 'massacre of saint bartholomew'] },
  'edict-of-nantes': { eventAccept: ['nantes', 'edict nantes'] },
  'revocation-nantes': { eventAccept: ['revocation of nantes', 'revocation edict of nantes'] },
  'french-revolution-fr': { eventAccept: ['revolution', 'bastille'] },
  'execution-louis-xvi': { eventAccept: ['louis xvi execution', 'execution louis xvi', 'beheading of louis xvi'] },
  'napoleon-emperor': { eventAccept: ['napoleon emperor', "napoleon's coronation"] },
  waterloo: { eventAccept: ["napoleon's defeat"] },
  'franco-prussian-third-republic': { eventAccept: ['sedan'] },
  'fall-of-france-vichy': { eventAccept: ['vichy'] },
  'fifth-republic-fr': { eventAccept: ['french fifth republic', 'cinquieme republique'] },

  // --- United Kingdom ---
  'roman-conquest-britain': { locationAccept: ['richborough', 'colchester'], eventAccept: ['roman conquest', 'roman invasion', 'claudian invasion', 'invasion of britain'] },
  'roman-rule-ends': { eventAccept: ['roman withdrawal', 'roman rule ends', 'fall of roman britain'] },
  'augustine-kent': { eventAccept: ['augustine', "augustine's mission", 'st augustine', 'augustine arrives'] },
  'alfred-wessex': { locationAccept: ['somerset'], eventAccept: ['alfred of wessex', 'accession of alfred', 'alfred'] },
  'norman-conquest-uk': { eventAccept: ['hastings'] },
  'domesday-book': { eventAccept: ['the domesday survey'] },
  'magna-carta': { eventAccept: ['the great charter', 'magna charta'] },
  'model-parliament': { eventAccept: ['the model parliament', '1295 parliament'] },
  bannockburn: { eventAccept: ['bruce and edward ii'] },
  'act-of-supremacy': { eventAccept: ['supremacy act', 'the act of supremacy', 'first act of supremacy'] },
  'union-of-crowns': { eventAccept: ['accession of james i', 'the union of the crowns'] },
  'execution-charles-i': { eventAccept: ['execution of charles', 'charles i execution', 'regicide'] },
  restoration: { eventAccept: ['stuart restoration'] },
  'glorious-revolution': { eventAccept: ['revolution of 1688', '1688 revolution'] },
  'acts-of-union-1707': { eventAccept: ['union of 1707', 'anglo-scottish union', '1707 union', 'union with scotland'] },
  'union-with-ireland': { eventAccept: ['act of union 1801', '1801 union'] },
  'great-reform-act': { eventAccept: ['the great reform act', 'first reform act'] },
  'britain-enters-wwi': { locationAccept: ['britain'], eventAccept: ['start of ww1', 'britain declares war', 'outbreak of ww1', 'ww1'] },
  'irish-free-state': { eventAccept: ['creation of irish free state', 'anglo-irish treaty', 'free state'] },
  'battle-of-britain': { eventAccept: ['the battle of britain', 'raf battle of britain', '1940 air battle'] },
  'nhs-founded': { eventAccept: ['national health service', 'creation of the nhs'] },
  devolution: { eventAccept: ['uk devolution', 'devolution referendums'] },
  brexit: { eventAccept: ['uk leaves eu', 'leave vote', 'brexit vote'] },
  'death-elizabeth-ii': { eventAccept: ["queen's death", 'death of elizabeth', 'charles iii accession'] },

  // --- Poland ---
  'baptism-mieszko': { eventAccept: ['baptism of mieszko', 'mieszko baptism', 'conversion of mieszko', 'mieszko i'] },
  'boleslaw-crowned': { eventAccept: ['first polish king', 'boleslaw i coronation', 'boleslaw'] },
  'union-of-krewo': { locationAccept: ['lithuania'], eventAccept: ['krewo union'] },
  grunwald: { eventAccept: ['grunwald tannenberg'] },
  'union-of-lublin': { eventAccept: ['lublin union', 'commonwealth'] },
  'first-partition': { locationAccept: ['russia', 'prussia', 'austria'], eventAccept: ['partition of poland', '1st partition', 'first polish partition'] },
  'constitution-3-may': { eventAccept: ['3rd may constitution'] },
  'second-partition': { locationAccept: ['russia', 'prussia', 'grodno'], eventAccept: ['2nd partition', 'second polish partition'] },
  'third-partition': { locationAccept: ['russia', 'prussia', 'austria'], eventAccept: ['3rd partition', 'final partition', 'third polish partition'] },
  'november-uprising': { eventAccept: ['november insurrection', '1830 uprising', 'polish november uprising'] },
  'january-uprising': { eventAccept: ['january insurrection', '1863 uprising', 'polish january uprising'] },
  'poland-independence-1918': { eventAccept: ['independence of poland', '1918 independence', 'polish independence day'] },
  'battle-of-warsaw-1920': { eventAccept: ['vistula'] },
  'invasion-of-poland-1939': { eventAccept: ['nazi invasion of poland', '1939 invasion', 'start of ww2', 'september campaign'] },
  katyn: { locationAccept: ['smolensk'], eventAccept: ['katyn forest'] },
  'warsaw-uprising-1944': { eventAccept: ['1944 warsaw uprising', 'powstanie warszawskie'] },
  'end-wwii-communism': { eventAccept: ['end of world war two', 'start of communism', 'potsdam', 'yalta', 'soviet domination'] },
  solidarity: { eventAccept: ['gdansk shipyard strike'] },
  'fall-communism-1989': { eventAccept: ['round table', '1989 revolution', 'collapse of communism'] },
  'poland-eu-2004': { eventAccept: ['polish eu membership', '2004 enlargement', 'eu membership'] },
}
