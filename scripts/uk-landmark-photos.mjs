// Per-landmark Wikimedia Commons search terms (all depicting the SAME landmark from varied
// angles/features) plus GIVEAWAY words that would spoil a "name the landmark" quiz. The
// prep script fetches candidates per term, then a gpt-4o vision gate rejects any shot whose
// readable text names the landmark (or a giveaway), or that is off-target.
// Run: node scripts/prep-landmark-images.mjs [id ...]   (no args = all landmarks)
export const LANDMARKS = {
  'palace-of-westminster': {
    name: 'Palace of Westminster & Big Ben',
    terms: ['Palace of Westminster river', 'Big Ben Elizabeth Tower', 'Houses of Parliament London', 'Palace of Westminster night', 'Westminster Bridge Big Ben', 'Victoria Tower Palace of Westminster', 'Houses of Parliament Thames', 'Elizabeth Tower clock'],
    giveaways: ['Big Ben', 'Elizabeth Tower', 'Houses of Parliament', 'Palace of Westminster', 'Westminster', 'Parliament'],
  },
  'tower-of-london': {
    name: 'Tower of London',
    terms: ['Tower of London White Tower', 'Tower of London walls', 'Tower of London ravens', 'Tower of London Traitors Gate', 'Tower of London aerial', 'White Tower keep London', 'Tower of London moat', 'Tower of London battlements'],
    giveaways: ['Tower of London', 'White Tower'],
  },
  'tower-bridge': {
    name: 'Tower Bridge',
    terms: ['Tower Bridge London', 'Tower Bridge open bascule', 'Tower Bridge night', 'Tower Bridge walkway', 'Tower Bridge Thames', 'Tower Bridge towers', 'Tower Bridge from river', 'Tower Bridge sunset'],
    giveaways: ['Tower Bridge'],
  },
  'buckingham-palace': {
    name: 'Buckingham Palace',
    terms: ['Buckingham Palace facade', 'Buckingham Palace gates', 'Buckingham Palace Changing of the Guard', 'Buckingham Palace Victoria Memorial', 'Buckingham Palace balcony', 'Buckingham Palace forecourt', 'Buckingham Palace guards', 'Buckingham Palace The Mall'],
    giveaways: ['Buckingham Palace'],
  },
  'st-pauls-cathedral': {
    name: "St Paul's Cathedral",
    terms: ['St Pauls Cathedral dome', 'St Pauls Cathedral London facade', 'St Pauls Cathedral interior', 'St Pauls Cathedral aerial', 'St Pauls Cathedral Millennium Bridge', 'St Pauls Cathedral night', 'St Pauls Cathedral west front', 'St Pauls Cathedral nave'],
    giveaways: ['St Pauls', 'St Paul', 'Saint Paul'],
  },
  'westminster-abbey': {
    name: 'Westminster Abbey',
    terms: ['Westminster Abbey west front', 'Westminster Abbey nave interior', 'Westminster Abbey towers', 'Westminster Abbey exterior', 'Westminster Abbey north entrance', 'Westminster Abbey ceiling', 'Westminster Abbey cloisters', 'Westminster Abbey London'],
    giveaways: ['Westminster Abbey'],
  },
  'british-museum': {
    name: 'British Museum',
    terms: ['British Museum facade columns', 'British Museum Great Court', 'British Museum reading room', 'British Museum entrance', 'British Museum portico', 'British Museum roof', 'British Museum Bloomsbury', 'British Museum courtyard'],
    giveaways: ['British Museum'],
  },
  'trafalgar-square': {
    name: 'Trafalgar Square',
    terms: ['Trafalgar Square Nelson Column', 'Trafalgar Square lions', 'Trafalgar Square fountains', 'Trafalgar Square London aerial', 'Nelson Column Trafalgar', 'Trafalgar Square from National Gallery', 'Trafalgar Square fourth plinth', 'Trafalgar Square crowd'],
    giveaways: ['Trafalgar Square', "Nelson's Column", 'Nelsons Column', 'Trafalgar'],
  },
  'london-eye': {
    name: 'London Eye',
    terms: ['London Eye wheel', 'London Eye South Bank', 'London Eye night', 'London Eye capsules', 'London Eye Thames', 'London Eye from Westminster', 'London Eye sunset', 'London Eye close up'],
    giveaways: ['London Eye', 'Millennium Wheel', 'Coca-Cola', 'Coca Cola'],
  },
  stonehenge: {
    name: 'Stonehenge',
    terms: ['Stonehenge stone circle', 'Stonehenge aerial', 'Stonehenge trilithon', 'Stonehenge sunrise', 'Stonehenge winter', 'Stonehenge sarsen stones', 'Stonehenge panorama', 'Stonehenge close up'],
    giveaways: ['Stonehenge', 'Amesbury'],
  },
  'hadrians-wall': {
    name: "Hadrian's Wall",
    terms: ['Hadrians Wall Northumberland', 'Hadrians Wall Housesteads', 'Hadrians Wall Sycamore Gap', 'Hadrians Wall landscape', 'Hadrians Wall milecastle', 'Hadrians Wall Steel Rigg', 'Hadrians Wall Roman fort', 'Hadrians Wall path'],
    giveaways: ['Hadrian', 'Hadrians Wall', 'Housesteads', 'Vindolanda', 'Steel Rigg', 'Sycamore Gap'],
  },
  'roman-baths': {
    name: 'Roman Baths, Bath',
    terms: ['Roman Baths Bath Great Bath', 'Roman Baths Bath terrace', 'Roman Baths Bath green water', 'Roman Baths Bath columns', 'Roman Baths Bath statues', 'Roman Baths Bath interior', 'Roman Baths Bath steam', 'Roman Baths Bath pool'],
    giveaways: ['Roman Baths', 'Aquae Sulis', 'Bath'],
  },
  'canterbury-cathedral': {
    name: 'Canterbury Cathedral',
    terms: ['Canterbury Cathedral exterior', 'Canterbury Cathedral nave', 'Canterbury Cathedral Bell Harry Tower', 'Canterbury Cathedral cloisters', 'Canterbury Cathedral west front', 'Canterbury Cathedral aerial', 'Canterbury Cathedral quire', 'Canterbury Cathedral stained glass'],
    giveaways: ['Canterbury'],
  },
  'york-minster': {
    name: 'York Minster',
    terms: ['York Minster exterior', 'York Minster nave', 'York Minster Great East Window', 'York Minster towers', 'York Minster chapter house', 'York Minster aerial', 'York Minster rose window', 'York Minster from city walls'],
    giveaways: ['York Minster', 'York'],
  },
  'durham-cathedral': {
    name: 'Durham Cathedral',
    terms: ['Durham Cathedral exterior', 'Durham Cathedral nave', 'Durham Cathedral river Wear', 'Durham Cathedral towers', 'Durham Cathedral cloister', 'Durham Cathedral aerial', 'Durham Cathedral interior columns', 'Durham Cathedral from railway'],
    giveaways: ['Durham'],
  },
  'windsor-castle': {
    name: 'Windsor Castle',
    terms: ['Windsor Castle Round Tower', 'Windsor Castle exterior', 'Windsor Castle Long Walk', 'Windsor Castle St Georges Chapel', 'Windsor Castle aerial', 'Windsor Castle state apartments', 'Windsor Castle gate', 'Windsor Castle from river'],
    giveaways: ['Windsor'],
  },
  'edinburgh-castle': {
    name: 'Edinburgh Castle',
    terms: ['Edinburgh Castle rock', 'Edinburgh Castle from Princes Street', 'Edinburgh Castle esplanade', 'Edinburgh Castle Half Moon Battery', 'Edinburgh Castle aerial', 'Edinburgh Castle night', 'Edinburgh Castle Mons Meg', 'Edinburgh Castle gatehouse'],
    giveaways: ['Edinburgh'],
  },
  'caernarfon-castle': {
    name: 'Caernarfon Castle',
    terms: ['Caernarfon Castle exterior', 'Caernarfon Castle towers', 'Caernarfon Castle from river', 'Caernarfon Castle walls', 'Caernarfon Castle aerial', 'Caernarfon Castle Eagle Tower', 'Caernarfon Castle courtyard', 'Caernarfon Castle Menai'],
    giveaways: ['Caernarfon', 'Carnarvon'],
  },
  'stirling-castle': {
    name: 'Stirling Castle',
    terms: ['Stirling Castle rock', 'Stirling Castle exterior', 'Stirling Castle Great Hall', 'Stirling Castle from Wallace Monument', 'Stirling Castle palace', 'Stirling Castle aerial', 'Stirling Castle gatehouse', 'Stirling Castle ramparts'],
    giveaways: ['Stirling'],
  },
  'hampton-court': {
    name: 'Hampton Court Palace',
    terms: ['Hampton Court Palace facade', 'Hampton Court Palace Tudor chimneys', 'Hampton Court Palace gardens', 'Hampton Court Palace Great Gatehouse', 'Hampton Court Palace maze', 'Hampton Court Palace astronomical clock', 'Hampton Court Palace aerial', 'Hampton Court Palace east front'],
    giveaways: ['Hampton Court'],
  },
  'radcliffe-camera': {
    name: 'Radcliffe Camera, Oxford',
    terms: ['Radcliffe Camera Oxford', 'Radcliffe Camera dome', 'Radcliffe Camera aerial', 'Radcliffe Camera All Souls', 'Radcliffe Camera night', 'Radcliffe Square Oxford', 'Radcliffe Camera facade', 'Radcliffe Camera rotunda'],
    giveaways: ['Radcliffe Camera', 'Oxford', 'Bodleian'],
  },
  'kings-college-chapel': {
    name: "King's College Chapel, Cambridge",
    terms: ['Kings College Chapel Cambridge exterior', 'Kings College Chapel fan vault', 'Kings College Chapel from the Backs', 'Kings College Chapel interior', 'Kings College Chapel choir', 'Kings College Chapel pinnacles', 'Kings College Chapel river Cam', 'Kings College Chapel facade'],
    giveaways: ['Kings College', "King's College", 'Cambridge'],
  },
  'shakespeares-birthplace': {
    name: "Shakespeare's Birthplace, Stratford-upon-Avon",
    terms: ['Shakespeares Birthplace Stratford', 'Shakespeares Birthplace half timbered', 'Shakespeares Birthplace garden', 'Shakespeares Birthplace street', 'Shakespeares Birthplace interior', 'Shakespeares Birthplace exterior', 'Shakespeares Birthplace Henley Street', 'Shakespeares Birthplace timber frame'],
    giveaways: ['Shakespeare', 'Stratford', 'Henley Street'],
  },
  'royal-crescent': {
    name: 'Royal Crescent, Bath',
    terms: ['Royal Crescent Bath', 'Royal Crescent aerial', 'Royal Crescent facade columns', 'Royal Crescent lawn', 'Royal Crescent panorama', 'Royal Crescent Bath Georgian', 'Royal Crescent from park', 'Royal Crescent curve'],
    giveaways: ['Royal Crescent', 'Bath'],
  },
  'clifton-suspension-bridge': {
    name: 'Clifton Suspension Bridge, Bristol',
    terms: ['Clifton Suspension Bridge Bristol', 'Clifton Suspension Bridge Avon Gorge', 'Clifton Suspension Bridge night', 'Clifton Suspension Bridge from below', 'Clifton Suspension Bridge towers', 'Clifton Suspension Bridge panorama', 'Clifton Suspension Bridge deck', 'Clifton Suspension Bridge sunset'],
    giveaways: ['Clifton', 'Bristol', 'Brunel'],
  },
  'angel-of-the-north': {
    name: 'Angel of the North',
    terms: ['Angel of the North Gateshead', 'Angel of the North front', 'Angel of the North wings', 'Angel of the North silhouette', 'Angel of the North base', 'Angel of the North landscape', 'Angel of the North sunset', 'Angel of the North side'],
    giveaways: ['Angel of the North', 'Gateshead', 'Gormley'],
  },
  'giants-causeway': {
    name: "Giant's Causeway",
    terms: ['Giants Causeway columns', 'Giants Causeway aerial', 'Giants Causeway coast', 'Giants Causeway hexagons', 'Giants Causeway waves', 'Giants Causeway path', 'Giants Causeway basalt', 'Giants Causeway panorama'],
    giveaways: ['Giants Causeway', "Giant's Causeway", 'Causeway'],
  },
  'white-cliffs-of-dover': {
    name: 'White Cliffs of Dover',
    terms: ['White Cliffs of Dover', 'White Cliffs of Dover aerial', 'White Cliffs of Dover lighthouse', 'White Cliffs of Dover from sea', 'White Cliffs of Dover coast', 'White Cliffs of Dover path', 'White Cliffs of Dover ferry', 'White Cliffs of Dover panorama'],
    giveaways: ['White Cliffs', 'Dover'],
  },
  snowdon: {
    name: 'Snowdon / Yr Wyddfa',
    terms: ['Snowdon summit', 'Snowdon Yr Wyddfa', 'Snowdon mountain railway', 'Snowdon from Llyn Llydaw', 'Snowdon ridge', 'Snowdon panorama', 'Snowdon Crib Goch', 'Snowdon peak snow'],
    giveaways: ['Snowdon', 'Yr Wyddfa', 'Snowdonia', 'Eryri'],
  },
  'loch-ness': {
    name: 'Loch Ness',
    terms: ['Loch Ness Urquhart Castle', 'Loch Ness water', 'Loch Ness aerial', 'Loch Ness shore', 'Loch Ness panorama', 'Loch Ness from above', 'Loch Ness Great Glen', 'Loch Ness landscape'],
    giveaways: ['Loch Ness', 'Nessie', 'Urquhart'],
  },
  'lake-district': {
    name: 'Lake District',
    terms: ['Lake District Windermere', 'Lake District fells', 'Lake District Derwentwater', 'Lake District Wastwater', 'Lake District valley', 'Lake District panorama', 'Lake District Buttermere', 'Lake District mountains'],
    giveaways: ['Lake District', 'Windermere', 'Scafell', 'Derwentwater', 'Wastwater', 'Buttermere', 'Cumbria'],
  },
  'titanic-belfast': {
    name: 'Titanic Belfast',
    terms: ['Titanic Belfast building', 'Titanic Belfast facade', 'Titanic Belfast night', 'Titanic Belfast aerial', 'Titanic Belfast slipway', 'Titanic Belfast angular', 'Titanic Belfast entrance', 'Titanic Belfast waterfront'],
    giveaways: ['Titanic', 'Belfast', 'Harland', 'Wolff'],
  },
}
