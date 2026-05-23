import countries from 'world-countries'

export type MapScope = 'world' | 'europe' | 'uk' | 'france' | 'usa'

export type QuizMode = 'map-click' | 'map-type' | 'type' | 'choice' | 'image' | 'sequence'

export type TopicGroup =
  | 'Geography'
  | 'History'
  | 'Politics'
  | 'Music'
  | 'Art'
  | 'Literature'
  | 'Philosophy'
  | 'Science'

export type QuizItem = {
  id: string
  name: string
  answer?: string
  prompt?: string
  detail?: string
  location?: string
  facts?: string[]
  lat?: number
  lon?: number
  aliases?: string[]
  imageUrl?: string
  options?: string[]
  era?: string
}

export type Topic = {
  id: string
  title: string
  group: TopicGroup
  description: string
  modes: QuizMode[]
  mapScope?: MapScope
  mapKind?: 'country-polygons' | 'points'
  boundaryLayer?: 'fr-departments' | 'fr-regions' | 'uk-admin' | 'us-states'
  items: QuizItem[]
  coverage: string
}

const majorCountryNotes: Record<string, string> = {
  France: 'Second city to know: Marseille.',
  'United Kingdom': 'Second city by many urban-area measures: Birmingham.',
  'United States': 'Second city by municipality: Los Angeles.',
  Canada: 'Largest city: Toronto. Second city: Montreal.',
  Brazil: 'Largest city: Sao Paulo. Second city: Rio de Janeiro.',
  Argentina: 'Second city: Cordoba.',
  Mexico: 'Second city: Guadalajara.',
  Germany: 'Second city: Hamburg.',
  Italy: 'Second city: Milan.',
  Spain: 'Second city: Barcelona.',
  Netherlands: 'Seat of government: The Hague. Second city: Rotterdam.',
  Switzerland: 'Largest city: Zurich. Second city: Geneva.',
  Russia: 'Second city: Saint Petersburg.',
  China: 'Largest city by municipality: Shanghai.',
  India: 'Largest city: Mumbai. Second city varies by urban-area definition.',
  Japan: 'Second city: Yokohama by municipality; Osaka by metro weight.',
  Australia: 'Largest city: Sydney. Second city: Melbourne.',
  Egypt: 'Second city: Alexandria.',
  Nigeria: 'Largest city: Lagos. Second city: Kano.',
  'South Africa': 'Executive capital answer: Pretoria. Legislative capital: Cape Town. Judicial capital: Bloemfontein.',
}

export const worldCountryKnowledge: QuizItem[] = countries
  .filter((country) => country.capital?.length && country.latlng?.length)
  .map((country) => ({
    id: country.cca3.toLowerCase(),
    name: country.name.common,
    answer: country.capital[0],
    prompt: `Capital of ${country.name.common}`,
    detail: majorCountryNotes[country.name.common] ?? `Official name: ${country.name.official}.`,
    lat: country.latlng[0],
    lon: country.latlng[1],
    aliases: [country.name.official, ...(country.altSpellings ?? [])],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const scotlandHistoricCounties: QuizItem[] = [
  ['Aberdeenshire', 57.2, -2.6], ['Angus', 56.7, -2.9], ['Argyll', 56.1, -5.3], ['Ayrshire', 55.5, -4.6], ['Banffshire', 57.6, -2.8],
  ['Berwickshire', 55.8, -2.4], ['Bute', 55.8, -5.1], ['Caithness', 58.5, -3.4], ['Clackmannanshire', 56.1, -3.8], ['Dumfriesshire', 55.1, -3.5],
  ['Dunbartonshire', 56.0, -4.4], ['East Lothian', 55.9, -2.7, 'Haddingtonshire'], ['Fife', 56.2, -3.1], ['Inverness-shire', 57.1, -4.8], ['Kincardineshire', 56.9, -2.4],
  ['Kinross-shire', 56.2, -3.4], ['Kirkcudbrightshire', 54.9, -4.1], ['Lanarkshire', 55.7, -3.8], ['Midlothian', 55.9, -3.1], ['Moray', 57.5, -3.3, 'Elginshire'],
  ['Nairnshire', 57.6, -3.9], ['Orkney', 59.0, -3.0], ['Peeblesshire', 55.6, -3.2], ['Perthshire', 56.6, -4.0], ['Renfrewshire', 55.8, -4.6],
  ['Ross and Cromarty', 57.7, -4.8], ['Roxburghshire', 55.5, -2.6], ['Selkirkshire', 55.6, -2.9], ['Shetland', 60.3, -1.3], ['Stirlingshire', 56.2, -4.1],
  ['Sutherland', 58.1, -4.5], ['West Lothian', 55.9, -3.6, 'Linlithgowshire'], ['Wigtownshire', 54.8, -4.8],
].map(([name, lat, lon, alias]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon), aliases: alias ? [String(alias)] : undefined }))

const greatBritainHistoricCounties: QuizItem[] = [
  ['Bedfordshire', 52.1, -0.45], ['Berkshire', 51.45, -1.0], ['Buckinghamshire', 51.8, -0.8], ['Cambridgeshire', 52.3, 0.1],
  ['Cheshire', 53.2, -2.6], ['Cornwall', 50.4, -4.8], ['Cumberland', 54.6, -3.2], ['Derbyshire', 53.1, -1.6], ['Devon', 50.7, -3.9],
  ['Dorset', 50.8, -2.3], ['Durham', 54.7, -1.8], ['Essex', 51.8, 0.6], ['Gloucestershire', 51.8, -2.2], ['Hampshire', 51.0, -1.2],
  ['Herefordshire', 52.1, -2.8], ['Hertfordshire', 51.8, -0.2], ['Huntingdonshire', 52.35, -0.2], ['Kent', 51.2, 0.7], ['Lancashire', 53.8, -2.6],
  ['Leicestershire', 52.7, -1.2], ['Lincolnshire', 53.1, -0.2], ['Middlesex', 51.5, -0.4], ['Norfolk', 52.7, 0.9], ['Northamptonshire', 52.3, -0.8],
  ['Northumberland', 55.2, -2.0], ['Nottinghamshire', 53.1, -1.0], ['Oxfordshire', 51.8, -1.3], ['Rutland', 52.65, -0.6], ['Shropshire', 52.6, -2.7],
  ['Somerset', 51.1, -2.8], ['Staffordshire', 52.8, -2.0], ['Suffolk', 52.2, 1.0], ['Surrey', 51.3, -0.4], ['Sussex', 50.9, -0.4],
  ['Warwickshire', 52.3, -1.6], ['Westmorland', 54.5, -2.7], ['Wiltshire', 51.3, -1.9], ['Worcestershire', 52.2, -2.2], ['Yorkshire', 54.0, -1.4],
  ['Anglesey', 53.25, -4.35], ['Breconshire', 51.95, -3.4], ['Caernarfonshire', 53.05, -4.15], ['Cardiganshire', 52.25, -4.0], ['Carmarthenshire', 51.85, -4.2],
  ['Denbighshire', 53.05, -3.35], ['Flintshire', 53.2, -3.1], ['Glamorgan', 51.55, -3.55], ['Merionethshire', 52.8, -3.8], ['Monmouthshire', 51.75, -2.9],
  ['Montgomeryshire', 52.55, -3.4], ['Pembrokeshire', 51.75, -4.9], ['Radnorshire', 52.25, -3.3],
  ...scotlandHistoricCounties.map((county) => [county.name, county.lat, county.lon] as [string, number | undefined, number | undefined]),
].map(([name, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon) }))

const ukCities: QuizItem[] = [
  ['London', 51.5072, -0.1276, 'Top UK city: about 8.8 million in Greater London by recent census/estimate usage.'],
  ['Birmingham', 52.4862, -1.8904, 'Top five UK city by local-authority population: about 1.15 million.'],
  ['Glasgow', 55.8642, -4.2518, 'Largest city in Scotland by local-authority population: about 0.63 million.'],
  ['Leeds', 53.8008, -1.5491, 'Top five by local-authority population: about 0.81 million.'],
  ['Manchester', 53.4808, -2.2426, 'Top five by local-authority population: about 0.55 million.'],
  ['Liverpool', 53.4084, -2.9916], ['Edinburgh', 55.9533, -3.1883], ['Bristol', 51.4545, -2.5879], ['Sheffield', 53.3811, -1.4701],
  ['Cardiff', 51.4816, -3.1791], ['Newcastle upon Tyne', 54.9783, -1.6178], ['Nottingham', 52.9548, -1.1581], ['Leicester', 52.6369, -1.1398],
  ['Coventry', 52.4068, -1.5197], ['Bradford', 53.795, -1.7594], ['Belfast', 54.5973, -5.9301], ['Aberdeen', 57.1497, -2.0943],
  ['Dundee', 56.462, -2.9707], ['Swansea', 51.6214, -3.9436], ['Portsmouth', 50.8198, -1.088],
].map(([name, lat, lon, detail]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon), detail: detail ? String(detail) : undefined }))

const scottishSettlements: QuizItem[] = [
  ['Glasgow', 55.8642, -4.2518], ['Edinburgh', 55.9533, -3.1883], ['Aberdeen', 57.1497, -2.0943], ['Dundee', 56.462, -2.9707], ['Paisley', 55.8473, -4.4401],
  ['East Kilbride', 55.7644, -4.1769], ['Livingston', 55.9029, -3.5226], ['Hamilton', 55.7776, -4.0537], ['Cumbernauld', 55.9457, -3.9925],
  ['Dunfermline', 56.0717, -3.4522], ['Kirkcaldy', 56.111, -3.158], ['Ayr', 55.4586, -4.6292], ['Perth', 56.394, -3.43],
  ['Inverness', 57.4778, -4.2247], ['Kilmarnock', 55.6117, -4.4958], ['Greenock', 55.9565, -4.7719], ['Stirling', 56.1165, -3.9369],
  ['Falkirk', 56.0019, -3.7839], ['Motherwell', 55.7891, -3.9919], ['Irvine', 55.6116, -4.6696],
].map(([name, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon) }))

const englishSettlements: QuizItem[] = [
  ['London', 51.5072, -0.1276], ['Birmingham', 52.4862, -1.8904], ['Manchester', 53.4808, -2.2426], ['Leeds', 53.8008, -1.5491], ['Liverpool', 53.4084, -2.9916],
  ['Newcastle upon Tyne', 54.9783, -1.6178], ['Sheffield', 53.3811, -1.4701], ['Bristol', 51.4545, -2.5879], ['Nottingham', 52.9548, -1.1581],
  ['Leicester', 52.6369, -1.1398], ['Coventry', 52.4068, -1.5197], ['Bradford', 53.795, -1.7594], ['Southampton', 50.9097, -1.4044],
  ['Portsmouth', 50.8198, -1.088], ['Plymouth', 50.3755, -4.1427], ['Brighton and Hove', 50.8225, -0.1372], ['Norwich', 52.6309, 1.2974],
  ['York', 53.959, -1.0815], ['Cambridge', 52.2053, 0.1218], ['Oxford', 51.752, -1.2577],
].map(([name, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon) }))

const frenchRegions: QuizItem[] = [
  ['Auvergne-Rhone-Alpes', 'Lyon', 45.7, 4.8], ['Bourgogne-Franche-Comte', 'Dijon', 47.3, 5.0], ['Brittany', 'Rennes', 48.1, -1.7],
  ['Centre-Val de Loire', 'Tours', 47.4, 0.7], ['Corsica', 'Ajaccio', 42.0, 8.7], ['Grand Est', 'Strasbourg', 48.6, 7.8],
  ['Hauts-de-France', 'Lille', 50.6, 3.1], ['Ile-de-France', 'Paris', 48.9, 2.4], ['Normandy', 'Le Havre', 49.5, 0.1],
  ['Nouvelle-Aquitaine', 'Bordeaux', 44.8, -0.6], ['Occitanie', 'Toulouse', 43.6, 1.4], ['Pays de la Loire', 'Nantes', 47.2, -1.6],
  ['Provence-Alpes-Cote d Azur', 'Marseille', 43.3, 5.4], ['Guadeloupe', 'Les Abymes', 16.3, -61.5], ['Martinique', 'Fort-de-France', 14.6, -61.0],
  ['French Guiana', 'Cayenne', 4.9, -52.3], ['Reunion', 'Saint-Denis', -20.9, 55.5], ['Mayotte', 'Mamoudzou', -12.8, 45.2],
].map(([name, answer, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), answer: String(answer), prompt: `Largest city in ${name}`, lat: Number(lat), lon: Number(lon) }))

const frenchDepartments: QuizItem[] = [
  ['Ain', 'Bourg-en-Bresse', 46.1, 5.2], ['Aisne', 'Saint-Quentin', 49.5, 3.5], ['Allier', 'Montlucon', 46.3, 3.2], ['Alpes-de-Haute-Provence', 'Manosque', 44.1, 6.2],
  ['Hautes-Alpes', 'Gap', 44.6, 6.1], ['Alpes-Maritimes', 'Nice', 43.9, 7.2], ['Ardeche', 'Annonay', 44.7, 4.4], ['Ardennes', 'Charleville-Mezieres', 49.7, 4.7],
  ['Ariege', 'Pamiers', 42.9, 1.5], ['Aube', 'Troyes', 48.3, 4.1], ['Aude', 'Narbonne', 43.1, 2.4], ['Aveyron', 'Rodez', 44.3, 2.6],
  ['Bouches-du-Rhone', 'Marseille', 43.5, 5.1], ['Calvados', 'Caen', 49.0, -0.3], ['Cantal', 'Aurillac', 45.0, 2.7], ['Charente', 'Angouleme', 45.7, 0.2],
  ['Charente-Maritime', 'La Rochelle', 46.1603, -1.1511], ['Cher', 'Bourges', 47.0, 2.5], ['Correze', 'Brive-la-Gaillarde', 45.3, 1.8], ['Corse-du-Sud', 'Ajaccio', 41.9, 8.9],
  ['Haute-Corse', 'Bastia', 42.4, 9.2], ['Cote-d Or', 'Dijon', 47.4, 4.8], ['Cotes-d Armor', 'Saint-Brieuc', 48.4, -2.9], ['Creuse', 'Gueret', 46.1, 2.0],
  ['Dordogne', 'Perigueux', 45.1, 0.7], ['Doubs', 'Besancon', 47.2, 6.3], ['Drome', 'Valence', 44.7, 5.1], ['Eure', 'Evreux', 49.1, 1.0],
  ['Eure-et-Loir', 'Chartres', 48.4, 1.4], ['Finistere', 'Brest', 48.3, -4.1], ['Gard', 'Nimes', 43.9, 4.2], ['Haute-Garonne', 'Toulouse', 43.3, 1.2],
  ['Gers', 'Auch', 43.7, 0.5], ['Gironde', 'Bordeaux', 44.8, -0.6], ['Herault', 'Montpellier', 43.6, 3.4], ['Ille-et-Vilaine', 'Rennes', 48.2, -1.6],
  ['Indre', 'Chateauroux', 46.8, 1.6], ['Indre-et-Loire', 'Tours', 47.3, 0.7], ['Isere', 'Grenoble', 45.3, 5.6], ['Jura', 'Dole', 46.7, 5.7],
  ['Landes', 'Mont-de-Marsan', 43.9, -0.8], ['Loir-et-Cher', 'Blois', 47.6, 1.4], ['Loire', 'Saint-Etienne', 45.7, 4.2], ['Haute-Loire', 'Le Puy-en-Velay', 45.1, 3.8],
  ['Loire-Atlantique', 'Nantes', 47.4, -1.7], ['Loiret', 'Orleans', 47.9, 2.3], ['Lot', 'Cahors', 44.6, 1.6], ['Lot-et-Garonne', 'Agen', 44.4, 0.5],
  ['Lozere', 'Mende', 44.5, 3.5], ['Maine-et-Loire', 'Angers', 47.4, -0.6], ['Manche', 'Cherbourg-en-Cotentin', 49.1, -1.3], ['Marne', 'Reims', 49.0, 4.2],
  ['Haute-Marne', 'Saint-Dizier', 48.1, 5.2], ['Mayenne', 'Laval', 48.2, -0.6], ['Meurthe-et-Moselle', 'Nancy', 48.8, 6.2], ['Meuse', 'Verdun', 49.0, 5.4],
  ['Morbihan', 'Lorient', 47.8, -2.8], ['Moselle', 'Metz', 49.0, 6.7], ['Nievre', 'Nevers', 47.1, 3.5], ['Nord', 'Lille', 50.4, 3.2],
  ['Oise', 'Beauvais', 49.4, 2.4], ['Orne', 'Alencon', 48.6, 0.1], ['Pas-de-Calais', 'Calais', 50.5, 2.3], ['Puy-de-Dome', 'Clermont-Ferrand', 45.7, 3.2],
  ['Pyrenees-Atlantiques', 'Pau', 43.2, -0.8], ['Hautes-Pyrenees', 'Tarbes', 43.1, 0.1], ['Pyrenees-Orientales', 'Perpignan', 42.6, 2.6], ['Bas-Rhin', 'Strasbourg', 48.6, 7.6],
  ['Haut-Rhin', 'Mulhouse', 47.9, 7.3], ['Rhone', 'Lyon', 45.8, 4.6], ['Haute-Saone', 'Vesoul', 47.6, 6.1], ['Saone-et-Loire', 'Chalon-sur-Saone', 46.6, 4.5],
  ['Sarthe', 'Le Mans', 48.0, 0.2], ['Savoie', 'Chambery', 45.5, 6.4], ['Haute-Savoie', 'Annecy', 46.0, 6.5], ['Paris', 'Paris', 48.9, 2.3],
  ['Seine-Maritime', 'Le Havre', 49.6, 1.0], ['Seine-et-Marne', 'Meaux', 48.6, 2.9], ['Yvelines', 'Versailles', 48.8, 1.9], ['Deux-Sevres', 'Niort', 46.5, -0.3],
  ['Somme', 'Amiens', 49.9, 2.3], ['Tarn', 'Albi', 43.8, 2.2], ['Tarn-et-Garonne', 'Montauban', 44.1, 1.3], ['Var', 'Toulon', 43.5, 6.3],
  ['Vaucluse', 'Avignon', 44.0, 5.2], ['Vendee', 'La Roche-sur-Yon', 46.7, -1.3], ['Vienne', 'Poitiers', 46.5, 0.5], ['Haute-Vienne', 'Limoges', 45.9, 1.2],
  ['Vosges', 'Epinal', 48.2, 6.4], ['Yonne', 'Auxerre', 47.8, 3.6], ['Territoire de Belfort', 'Belfort', 47.6, 6.9], ['Essonne', 'Evry-Courcouronnes', 48.5, 2.2],
  ['Hauts-de-Seine', 'Boulogne-Billancourt', 48.8, 2.2], ['Seine-Saint-Denis', 'Saint-Denis', 48.9, 2.5], ['Val-de-Marne', 'Vitry-sur-Seine', 48.8, 2.5], ['Val-d Oise', 'Argenteuil', 49.1, 2.1],
  ['Guadeloupe', 'Les Abymes', 16.2, -61.6], ['Martinique', 'Fort-de-France', 14.6, -61.0], ['Guyane', 'Cayenne', 4.0, -53.0], ['La Reunion', 'Saint-Denis', -21.1, 55.5], ['Mayotte', 'Mamoudzou', -12.8, 45.2],
].map(([name, answer, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), answer: String(answer), prompt: `Biggest city in ${name}`, lat: Number(lat), lon: Number(lon) }))

const frenchCities: QuizItem[] = [
  ['Paris', 48.8566, 2.3522, 'Top French commune: about 2.1 million.'], ['Marseille', 43.2965, 5.3698, 'Top five: about 0.89 million.'],
  ['Lyon', 45.764, 4.8357, 'Top five: about 0.52 million.'], ['Toulouse', 43.6047, 1.4442, 'Top five: about 0.52 million.'],
  ['Nice', 43.7102, 7.262, 'Top five: about 0.35 million.'], ['Nantes', 47.2184, -1.5536], ['Montpellier', 43.611, 3.8767],
  ['Strasbourg', 48.5734, 7.7521], ['Bordeaux', 44.8378, -0.5792], ['Lille', 50.6292, 3.0573], ['Rennes', 48.1173, -1.6778],
  ['Reims', 49.2583, 4.0317], ['Saint-Etienne', 45.4397, 4.3872], ['Le Havre', 49.4944, 0.1079], ['Toulon', 43.1242, 5.928],
  ['Grenoble', 45.1885, 5.7245], ['Dijon', 47.322, 5.0415], ['Angers', 47.4784, -0.5632], ['Nimes', 43.8367, 4.3601], ['Villeurbanne', 45.7719, 4.8902],
].map(([name, lat, lon, detail]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon), detail: detail ? String(detail) : undefined }))

const usStates: QuizItem[] = [
  ['Alabama', 'Montgomery', 32.8, -86.8], ['Alaska', 'Juneau', 64.2, -149.5], ['Arizona', 'Phoenix', 34.1, -111.9], ['Arkansas', 'Little Rock', 35.2, -92.4],
  ['California', 'Sacramento', 36.8, -119.4], ['Colorado', 'Denver', 39.0, -105.5], ['Connecticut', 'Hartford', 41.6, -72.7], ['Delaware', 'Dover', 39.0, -75.5],
  ['Florida', 'Tallahassee', 27.8, -81.7], ['Georgia', 'Atlanta', 32.2, -83.4], ['Hawaii', 'Honolulu', 19.9, -155.6], ['Idaho', 'Boise', 44.1, -114.7],
  ['Illinois', 'Springfield', 40.0, -89.2], ['Indiana', 'Indianapolis', 40.3, -86.1], ['Iowa', 'Des Moines', 42.0, -93.1], ['Kansas', 'Topeka', 38.5, -98.4],
  ['Kentucky', 'Frankfort', 37.8, -85.8], ['Louisiana', 'Baton Rouge', 31.2, -91.9], ['Maine', 'Augusta', 45.3, -69.4], ['Maryland', 'Annapolis', 39.0, -76.8],
  ['Massachusetts', 'Boston', 42.4, -71.4], ['Michigan', 'Lansing', 44.3, -85.6], ['Minnesota', 'Saint Paul', 46.7, -94.7], ['Mississippi', 'Jackson', 32.7, -89.7],
  ['Missouri', 'Jefferson City', 38.5, -92.5], ['Montana', 'Helena', 47.0, -110.4], ['Nebraska', 'Lincoln', 41.5, -99.9], ['Nevada', 'Carson City', 39.5, -116.9],
  ['New Hampshire', 'Concord', 43.2, -71.6], ['New Jersey', 'Trenton', 40.1, -74.7], ['New Mexico', 'Santa Fe', 34.5, -106.0], ['New York', 'Albany', 43.0, -75.0],
  ['North Carolina', 'Raleigh', 35.5, -79.0], ['North Dakota', 'Bismarck', 47.5, -100.5], ['Ohio', 'Columbus', 40.4, -82.8], ['Oklahoma', 'Oklahoma City', 35.6, -97.5],
  ['Oregon', 'Salem', 44.0, -120.6], ['Pennsylvania', 'Harrisburg', 41.2, -77.2], ['Rhode Island', 'Providence', 41.7, -71.5], ['South Carolina', 'Columbia', 33.8, -80.9],
  ['South Dakota', 'Pierre', 44.4, -100.2], ['Tennessee', 'Nashville', 35.9, -86.5], ['Texas', 'Austin', 31.0, -99.9], ['Utah', 'Salt Lake City', 39.3, -111.7],
  ['Vermont', 'Montpelier', 44.1, -72.7], ['Virginia', 'Richmond', 37.5, -78.7], ['Washington', 'Olympia', 47.4, -120.7], ['West Virginia', 'Charleston', 38.6, -80.5],
  ['Wisconsin', 'Madison', 44.5, -89.5], ['Wyoming', 'Cheyenne', 43.0, -107.6],
].map(([name, answer, lat, lon]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), answer: String(answer), prompt: `Capital of ${name}`, lat: Number(lat), lon: Number(lon) }))

const riversAndRanges: QuizItem[] = [
  ['Nile', 30.0, 31.2, 'Longest-river contender; northeast Africa.'], ['Amazon', -3.1, -60.0, 'Largest discharge; South America.'], ['Yangtze', 31.2, 121.5, 'Longest river in Asia.'],
  ['Mississippi-Missouri', 29.9, -90.1, 'Great river system of North America.'], ['Yenisei', 61.7, 89.0], ['Yellow River', 36.1, 103.8], ['Ob-Irtysh', 61.0, 69.0],
  ['Congo', -4.3, 15.3], ['Amur', 50.6, 137.0], ['Lena', 62.0, 129.7], ['Mekong', 15.9, 104.8], ['Mackenzie', 67.5, -133.7],
  ['Niger', 13.5, 2.1], ['Danube', 45.2, 29.7], ['Volga', 48.7, 44.5], ['Ganges', 25.3, 83.0], ['Indus', 24.9, 67.0],
  ['Thames', 51.5, -0.1, 'Main UK river through London.'], ['Seine', 48.9, 2.3, 'Main French river through Paris.'], ['Loire', 47.4, 0.7, 'Longest river entirely in France.'],
].map(([name, lat, lon, detail]) => ({ id: String(name).toLowerCase().replaceAll(' ', '-'), name: String(name), lat: Number(lat), lon: Number(lon), detail: detail ? String(detail) : undefined }))

const mountainRanges: QuizItem[] = [
  {
    id: 'himalayas',
    name: 'Himalayas',
    lat: 28,
    lon: 86,
    location: 'Location: South Asia, mainly Nepal, India, Bhutan, China/Tibet, and Pakistan.',
    facts: ['It contains Mount Everest, the highest summit on Earth.', 'It is still rising because the Indian Plate keeps pushing into Eurasia.', 'Its glaciers feed major Asian rivers including the Ganges, Indus, and Brahmaputra.'],
  },
  {
    id: 'andes',
    name: 'Andes',
    lat: -16,
    lon: -70,
    location: 'Location: Western South America, from Venezuela and Colombia down to Chile and Argentina.',
    facts: ['It is the longest continental mountain range in the world.', 'Aconcagua is the highest mountain outside Asia.', 'The range runs along a very active Pacific volcanic margin.'],
  },
  {
    id: 'rocky-mountains',
    name: 'Rocky Mountains',
    lat: 44,
    lon: -110,
    location: 'Location: Western North America, from British Columbia and Alberta through the western United States to New Mexico.',
    facts: ['The Continental Divide follows much of the range.', 'Yellowstone, Rocky Mountain, and Banff national parks all sit in the Rockies.', 'Many of its peaks were raised during the Laramide mountain-building period.'],
  },
  {
    id: 'alps',
    name: 'Alps',
    lat: 46.5,
    lon: 10.5,
    location: 'Location: Central Europe, across France, Switzerland, Italy, Austria, Germany, Slovenia, Liechtenstein, and Monaco.',
    facts: ['Mont Blanc is the highest summit in the Alps.', 'Alpine passes shaped European trade and military routes for centuries.', 'The range forms a major climatic barrier between northern Europe and the Mediterranean.'],
  },
  {
    id: 'atlas-mountains',
    name: 'Atlas Mountains',
    lat: 31.1,
    lon: -7.9,
    location: 'Location: Northwest Africa, across Morocco, Algeria, and Tunisia.',
    facts: ['The range separates the Mediterranean and Atlantic coasts from the Sahara.', 'Toubkal in Morocco is its highest peak.', 'It is closely associated with Amazigh, or Berber, highland cultures.'],
  },
  {
    id: 'pyrenees',
    name: 'Pyrenees',
    lat: 42.7,
    lon: 0.5,
    location: 'Location: On the France-Spain border, with Andorra in the eastern Pyrenees.',
    facts: ['The range is a natural barrier between Iberia and the rest of Europe.', 'Aneto is the highest peak in the Pyrenees.', 'Small valleys helped preserve distinct languages and local identities.'],
  },
  {
    id: 'carpathians',
    name: 'Carpathians',
    lat: 47,
    lon: 25.5,
    location: 'Location: Central and eastern Europe, including Slovakia, Poland, Ukraine, Romania, and nearby countries.',
    facts: ['The range forms a great arc around Transylvania.', 'The Tatras are its highest section.', 'It contains some of Europe\'s strongest remaining habitats for bears, wolves, and lynx.'],
  },
  {
    id: 'caucasus',
    name: 'Caucasus',
    lat: 43.4,
    lon: 42.5,
    location: 'Location: Between the Black Sea and Caspian Sea, across Russia, Georgia, Azerbaijan, and Armenia.',
    facts: ['Mount Elbrus is often counted as Europe\'s highest mountain.', 'The region is famous for extraordinary linguistic and cultural diversity.', 'Some geographic conventions use the range as part of the Europe-Asia boundary.'],
  },
  {
    id: 'urals',
    name: 'Urals',
    lat: 60,
    lon: 60,
    location: 'Location: Russia, running north-south from the Arctic toward Kazakhstan.',
    facts: ['It is the traditional boundary between Europe and Asia.', 'The range is rich in minerals and helped power Russian industry.', 'The Urals are very old and much more eroded than the Alps or Himalayas.'],
  },
  {
    id: 'appalachians',
    name: 'Appalachians',
    lat: 37.5,
    lon: -81,
    location: 'Location: Eastern North America, from Canada through the eastern United States to Alabama and Georgia.',
    facts: ['The Appalachians are ancient, rounded mountains worn down by erosion.', 'The Appalachian Trail runs for more than 2,000 miles along the range.', 'Its coalfields shaped the industrial history of the eastern United States.'],
  },
  {
    id: 'great-dividing-range',
    name: 'Great Dividing Range',
    lat: -27,
    lon: 152,
    location: 'Location: Eastern Australia, mainly Queensland, New South Wales, and Victoria.',
    facts: ['It is Australia\'s longest mountain system.', 'It separates short coastal rivers from inland river basins.', 'The Australian Alps are part of this broad range system.'],
  },
  {
    id: 'drakensberg',
    name: 'Drakensberg',
    lat: -29.5,
    lon: 29.3,
    location: 'Location: Southern Africa, mainly South Africa and Lesotho.',
    facts: ['The name is often translated as Dragon Mountains.', 'The escarpment helps form the high plateau of Lesotho.', 'The area is known for dramatic basalt cliffs and ancient rock art.'],
  },
  {
    id: 'karakoram',
    name: 'Karakoram',
    lat: 35.8,
    lon: 76.5,
    location: 'Location: High Asia, across Pakistan\'s Gilgit-Baltistan, India\'s Ladakh, and China\'s Xinjiang.',
    facts: ['K2, the world\'s second-highest mountain, is in the Karakoram.', 'It has some of the largest glaciers outside the polar regions.', 'The Karakoram Highway crosses one of the world\'s most dramatic high-mountain corridors.'],
  },
  {
    id: 'tian-shan',
    name: 'Tian Shan',
    lat: 42,
    lon: 80,
    location: 'Location: Central Asia, mainly Kyrgyzstan, Kazakhstan, China/Xinjiang, and Uzbekistan.',
    facts: ['The name is usually translated as Heavenly Mountains.', 'Jengish Chokusu, also called Tomur, is its highest peak.', 'It was a major natural barrier along Silk Road routes.'],
  },
  {
    id: 'zagros',
    name: 'Zagros',
    lat: 32,
    lon: 51,
    location: 'Location: Western Iran, with extensions into eastern Iraq and southeastern Turkey.',
    facts: ['It is a long fold-and-thrust mountain belt.', 'The Zagros foothills were important in early farming and domestication.', 'Its geology is closely tied to major oil and gas fields.'],
  },
  {
    id: 'sierra-nevada',
    name: 'Sierra Nevada',
    lat: 37,
    lon: -119,
    location: 'Location: Western United States, mainly California with an edge in Nevada.',
    facts: ['Mount Whitney is the highest summit in the contiguous United States.', 'Yosemite Valley sits on the western side of the range.', 'Snowpack from the Sierra Nevada is crucial to California\'s water supply.'],
  },
  {
    id: 'scandinavian-mountains',
    name: 'Scandinavian Mountains',
    lat: 63,
    lon: 13,
    location: 'Location: Scandinavia, mainly Norway and Sweden, with a northern extension toward Finland.',
    facts: ['The range helps create Norway\'s fjords and a strong rain shadow to the east.', 'Galdhopiggen in Norway is its highest peak.', 'It is tied to the ancient Caledonian mountain-building event.'],
  },
  {
    id: 'altai-mountains',
    name: 'Altai Mountains',
    lat: 49,
    lon: 88,
    location: 'Location: Central Asia, where Russia, Kazakhstan, Mongolia, and China meet.',
    facts: ['The name is often linked to the idea of gold or golden mountains.', 'The region feeds major river systems including the Irtysh and Ob.', 'It has long been a crossroads between steppe, forest, and high-mountain cultures.'],
  },
  {
    id: 'cascades',
    name: 'Cascades',
    lat: 45,
    lon: -121,
    location: 'Location: Western North America, from British Columbia through Washington, Oregon, and northern California.',
    facts: ['The Cascades are a volcanic arc above the Cascadia subduction zone.', 'Mount St Helens erupted dramatically in 1980.', 'Mount Rainier and Mount Hood are two of its best-known volcanoes.'],
  },
  {
    id: 'apennines',
    name: 'Apennines',
    lat: 43.5,
    lon: 12.5,
    location: 'Location: Italy, running down the spine of the Italian peninsula.',
    facts: ['The Apennines are often called the backbone of Italy.', 'Gran Sasso is one of the highest and most famous massifs in the range.', 'The mountains helped create strong regional identities across Italy.'],
  },
]

const paintings: QuizItem[] = [
  { id: 'mona-lisa', name: 'Mona Lisa', answer: 'Leonardo da Vinci', prompt: 'Name this painting or its artist', imageUrl: '/images/paintings/mona-lisa.jpg', detail: 'Renaissance portrait, Louvre.' },
  { id: 'starry-night', name: 'The Starry Night', answer: 'Vincent van Gogh', prompt: 'Name this painting or its artist', imageUrl: '/images/paintings/starry-night.jpg', detail: 'Post-Impressionism, 1889.' },
  { id: 'girl-pearl', name: 'Girl with a Pearl Earring', answer: 'Johannes Vermeer', imageUrl: '/images/paintings/girl-pearl.jpg', detail: 'Dutch Golden Age.' },
  { id: 'venus', name: 'The Birth of Venus', answer: 'Sandro Botticelli', imageUrl: '/images/paintings/birth-venus.jpg' },
  { id: 'las-meninas', name: 'Las Meninas', answer: 'Diego Velazquez', imageUrl: '/images/paintings/las-meninas.jpg' },
  { id: 'scream', name: 'The Scream', answer: 'Edvard Munch', imageUrl: '/images/paintings/the-scream.jpg' },
  { id: 'american-gothic', name: 'American Gothic', answer: 'Grant Wood', imageUrl: '/images/paintings/american-gothic.jpg' },
]

const solarSystemItems: QuizItem[] = [
  { id: 'mercury', name: 'Mercury', detail: 'Smallest planet and closest to the Sun.' },
  { id: 'venus', name: 'Venus', detail: 'Second planet from the Sun.' },
  { id: 'earth', name: 'Earth', detail: 'Third planet from the Sun.' },
  { id: 'mars', name: 'Mars', detail: 'Fourth planet from the Sun; the asteroid belt comes after it.' },
  { id: 'jupiter', name: 'Jupiter', detail: 'Fifth planet from the Sun and first beyond the asteroid belt.' },
  { id: 'saturn', name: 'Saturn', detail: 'Sixth planet from the Sun.' },
  { id: 'uranus', name: 'Uranus', detail: 'Seventh planet from the Sun.' },
  { id: 'neptune', name: 'Neptune', detail: 'Eighth planet from the Sun.' },
  { id: 'asteroid-belt', name: 'Asteroid belt', answer: 'Mars and Jupiter', prompt: 'Between which two planets is the main asteroid belt?', aliases: ['between mars and jupiter', 'mars jupiter', 'jupiter and mars', 'jupiter mars'] },
]

const knowledgeQuestions: Topic[] = [
  {
    id: 'political-systems',
    title: 'Political Systems: France, UK, EU, US',
    group: 'Politics',
    description: 'Mechanisms, institutions, checks, elections, and common traps.',
    modes: ['choice', 'type'],
    coverage: 'Core constitutional mechanics and gotcha questions for repeated practice.',
    items: [
      { id: 'fr-semi-pres', name: 'France is a semi-presidential republic', prompt: 'France is best described as what kind of system?', answer: 'Semi-presidential republic', options: ['Semi-presidential republic', 'Pure parliamentary monarchy', 'Federal presidential republic', 'Directorial republic'], detail: 'The president is directly elected and appoints the prime minister, but government also depends on the National Assembly.' },
      { id: 'cohabitation', name: 'Cohabitation', prompt: 'In France, what is cohabitation?', answer: 'A president and parliamentary majority from opposing camps', options: ['A president and parliamentary majority from opposing camps', 'A coalition inside the Senate', 'A referendum-only government', 'A temporary military cabinet'], detail: 'It shifts day-to-day domestic power toward the prime minister.' },
      { id: 'uk-confidence', name: 'Confidence of Commons', prompt: 'In the UK, what keeps a government in office?', answer: 'Confidence of the House of Commons', options: ['Confidence of the House of Commons', 'Direct election of the prime minister', 'Approval by the monarch every year', 'A fixed coalition treaty'], detail: 'The monarch appoints the person best able to command Commons confidence.' },
      { id: 'eu-commission', name: 'European Commission', prompt: 'Which EU institution proposes most EU legislation?', answer: 'European Commission', options: ['European Commission', 'European Council', 'Court of Justice of the EU', 'European Central Bank'] },
      { id: 'us-judicial-review', name: 'Judicial review', prompt: 'What power is associated with Marbury v. Madison?', answer: 'Judicial review', options: ['Judicial review', 'The filibuster', 'The two-term limit', 'Federal income tax'] },
      { id: 'us-amendment-1', name: 'First Amendment', prompt: 'Which US amendment protects speech, religion, press, assembly, and petition?', answer: 'First Amendment', options: ['First Amendment', 'Second Amendment', 'Fifth Amendment', 'Fourteenth Amendment'] },
    ],
  },
  {
    id: 'history-outline',
    title: 'History Outlines: Scotland, England, France',
    group: 'History',
    description: 'Broad chapters, dynasties, battles, empires, and modern leaders.',
    modes: ['choice', 'type'],
    coverage: 'High-level scaffolding: chapters first, dates and rulers second.',
    items: [
      { id: 'scot-chapter-1', name: 'Early Scotland', prompt: 'Which broad chapter comes before the Wars of Independence?', answer: 'Picts, Gaels, Vikings, and the making of Alba', options: ['Picts, Gaels, Vikings, and the making of Alba', 'Union of the Crowns', 'Industrial Scotland', 'Devolution'] },
      { id: 'scot-independence', name: 'Wars of Scottish Independence', prompt: 'Which pair anchors the Wars of Scottish Independence in memory?', answer: 'William Wallace and Robert the Bruce', options: ['William Wallace and Robert the Bruce', 'Oliver Cromwell and Charles II', 'Henry VIII and Wolsey', 'Pitt and Fox'] },
      { id: 'eng-chapter-1066', name: 'Norman Conquest', prompt: 'What year is the Norman Conquest of England?', answer: '1066', options: ['1066', '1215', '1485', '1688'] },
      { id: 'fr-dynasties', name: 'French royal dynasties', prompt: 'Put the core French royal dynastic order in one line.', answer: 'Merovingian, Carolingian, Capetian, Valois, Bourbon, Bonaparte', detail: 'For broad culture, know the hinge from Franks to Capetians to Valois/Bourbons to Revolution/Empire.' },
      { id: 'battle-hastings', name: 'Battle of Hastings', prompt: 'Who fought at Hastings in 1066?', answer: 'William of Normandy and Harold Godwinson', options: ['William of Normandy and Harold Godwinson', 'Caesar and Vercingetorix', 'Napoleon and Wellington', 'Saladin and Richard I'] },
      { id: 'battle-waterloo', name: 'Waterloo', prompt: 'What did Waterloo end?', answer: 'Napoleon Bonaparte’s final return to power', options: ['Napoleon Bonaparte’s final return to power', 'The Hundred Years War', 'The Roman Republic', 'The English Civil War'] },
      { id: 'empire-roman', name: 'Roman Empire', prompt: 'Which empire centered on the Mediterranean from the 1st century BCE onward?', answer: 'Roman Empire', options: ['Roman Empire', 'Mali Empire', 'Mughal Empire', 'Aztec Empire'] },
      { id: 'uk-pm-current', name: 'Keir Starmer', prompt: 'Who became UK Prime Minister on 5 July 2024?', answer: 'Keir Starmer', options: ['Keir Starmer', 'Rishi Sunak', 'Liz Truss', 'Boris Johnson'], detail: 'Current as checked on 6 May 2026.' },
      { id: 'fr-president-current', name: 'Emmanuel Macron', prompt: 'Who is President of France in May 2026?', answer: 'Emmanuel Macron', options: ['Emmanuel Macron', 'Francois Hollande', 'Nicolas Sarkozy', 'Jacques Chirac'], detail: 'Current as checked on 6 May 2026.' },
    ],
  },
  {
    id: 'empires-battles',
    title: 'Empires and Battles',
    group: 'History',
    description: 'Big empires, rough locations, chronology, rulers, and decisive battles.',
    modes: ['choice', 'type'],
    coverage: 'Top-level deck for 20 empires and 15 battle anchors; anecdotes can be deepened item by item.',
    items: [
      { id: 'empire-roman-peak', name: 'Roman Empire', prompt: 'Which empire reached from Britain to Egypt under Trajan?', answer: 'Roman Empire', options: ['Roman Empire', 'Achaemenid Empire', 'Mali Empire', 'Inca Empire'], era: '27 BCE-476 CE in the West' },
      { id: 'empire-mongol', name: 'Mongol Empire', prompt: 'Which land empire was built by Genghis Khan and his successors?', answer: 'Mongol Empire', options: ['Mongol Empire', 'Ottoman Empire', 'Songhai Empire', 'Spanish Empire'], era: '13th-14th centuries' },
      { id: 'empire-ottoman', name: 'Ottoman Empire', prompt: 'Which empire conquered Constantinople in 1453?', answer: 'Ottoman Empire', options: ['Ottoman Empire', 'Byzantine Empire', 'Portuguese Empire', 'Mughal Empire'] },
      { id: 'empire-british', name: 'British Empire', prompt: 'Which empire is remembered for the phrase “the empire on which the sun never sets”?', answer: 'British Empire', options: ['British Empire', 'Persian Empire', 'Aztec Empire', 'Han Empire'] },
      { id: 'empire-spanish', name: 'Spanish Empire', prompt: 'Which empire ruled vast American territories after Columbus and the conquistadors?', answer: 'Spanish Empire', options: ['Spanish Empire', 'Dutch Empire', 'Safavid Empire', 'Maurya Empire'] },
      { id: 'empire-abbasid', name: 'Abbasid Caliphate', prompt: 'Which empire-caliphate is associated with Baghdad’s House of Wisdom?', answer: 'Abbasid Caliphate', options: ['Abbasid Caliphate', 'Holy Roman Empire', 'Macedonian Empire', 'Qing Empire'] },
      { id: 'battle-marathon', name: 'Battle of Marathon', prompt: 'Marathon was fought between Athens and which empire?', answer: 'Persian Empire', options: ['Persian Empire', 'Roman Empire', 'Carthage', 'Macedon'] },
      { id: 'battle-tours', name: 'Battle of Tours', prompt: 'Which Frankish leader is linked to the Battle of Tours in 732?', answer: 'Charles Martel', options: ['Charles Martel', 'Charlemagne', 'Clovis', 'Hugh Capet'] },
      { id: 'battle-agincourt', name: 'Agincourt', prompt: 'Which English king won at Agincourt in 1415?', answer: 'Henry V', options: ['Henry V', 'Henry VIII', 'Edward I', 'Richard III'] },
      { id: 'battle-yorktown', name: 'Yorktown', prompt: 'Yorktown in 1781 was decisive in which war?', answer: 'American Revolutionary War', options: ['American Revolutionary War', 'Seven Years War', 'US Civil War', 'War of 1812'] },
      { id: 'battle-stalingrad', name: 'Stalingrad', prompt: 'Stalingrad was a turning point on which front of World War II?', answer: 'Eastern Front', options: ['Eastern Front', 'Western Front', 'North Africa', 'Pacific'] },
    ],
  },
  {
    id: 'modern-leaders',
    title: 'France and UK Leaders Since 1960',
    group: 'History',
    description: 'Prime ministers and presidents from 1960 to the present.',
    modes: ['choice', 'type'],
    coverage: 'UK prime ministers and French presidents from 1960 through leaders current on 6 May 2026.',
    items: [
      { id: 'pm-macmillan', name: 'Harold Macmillan', prompt: 'Who was UK Prime Minister at the start of 1960?', answer: 'Harold Macmillan', options: ['Harold Macmillan', 'Harold Wilson', 'Edward Heath', 'Alec Douglas-Home'] },
      { id: 'pm-wilson', name: 'Harold Wilson', prompt: 'Which Labour PM served 1964-1970 and 1974-1976?', answer: 'Harold Wilson', options: ['Harold Wilson', 'James Callaghan', 'Tony Blair', 'Clement Attlee'] },
      { id: 'pm-thatcher', name: 'Margaret Thatcher', prompt: 'Who was UK Prime Minister from 1979 to 1990?', answer: 'Margaret Thatcher', options: ['Margaret Thatcher', 'Theresa May', 'Liz Truss', 'Barbara Castle'] },
      { id: 'pm-blair', name: 'Tony Blair', prompt: 'Which Labour PM won landslides in 1997, 2001, and 2005?', answer: 'Tony Blair', options: ['Tony Blair', 'Gordon Brown', 'John Major', 'David Cameron'] },
      { id: 'pm-starmer', name: 'Keir Starmer', prompt: 'Which Labour leader became UK Prime Minister on 5 July 2024?', answer: 'Keir Starmer', options: ['Keir Starmer', 'Rishi Sunak', 'Boris Johnson', 'David Cameron'] },
      { id: 'fr-de-gaulle', name: 'Charles de Gaulle', prompt: 'Who was President of France at the start of the Fifth Republic period after 1958?', answer: 'Charles de Gaulle', options: ['Charles de Gaulle', 'Georges Pompidou', 'Valery Giscard d Estaing', 'Francois Mitterrand'] },
      { id: 'fr-mitterrand', name: 'Francois Mitterrand', prompt: 'Which French president served from 1981 to 1995?', answer: 'Francois Mitterrand', options: ['Francois Mitterrand', 'Jacques Chirac', 'Nicolas Sarkozy', 'Emmanuel Macron'] },
      { id: 'fr-chirac', name: 'Jacques Chirac', prompt: 'Which French president served from 1995 to 2007?', answer: 'Jacques Chirac', options: ['Jacques Chirac', 'Francois Hollande', 'Georges Pompidou', 'Emmanuel Macron'] },
      { id: 'fr-macron', name: 'Emmanuel Macron', prompt: 'Who is President of France as of 6 May 2026?', answer: 'Emmanuel Macron', options: ['Emmanuel Macron', 'Nicolas Sarkozy', 'Francois Hollande', 'Gabriel Attal'] },
    ],
  },
  {
    id: 'classical-music',
    title: 'Classical Music Movements',
    group: 'Music',
    description: 'Movements, representative composers, and one anchor piece each.',
    modes: ['choice', 'type'],
    coverage: 'Medieval to modern, with five-composer anchors across the main eras.',
    items: [
      { id: 'baroque-bach', name: 'Baroque: Bach', prompt: 'Which composer is tied to the Brandenburg Concertos?', answer: 'Johann Sebastian Bach', options: ['Johann Sebastian Bach', 'Claude Debussy', 'Giuseppe Verdi', 'Igor Stravinsky'] },
      { id: 'classical-mozart', name: 'Classical: Mozart', prompt: 'Who composed The Marriage of Figaro?', answer: 'Wolfgang Amadeus Mozart', options: ['Wolfgang Amadeus Mozart', 'Antonio Vivaldi', 'Franz Liszt', 'Gustav Mahler'] },
      { id: 'romantic-chopin', name: 'Romantic: Chopin', prompt: 'Which composer is the essential piano nocturne figure?', answer: 'Frederic Chopin', options: ['Frederic Chopin', 'Palestrina', 'John Cage', 'Monteverdi'] },
      { id: 'impressionism-debussy', name: 'Impressionism: Debussy', prompt: 'Who composed Prelude to the Afternoon of a Faun?', answer: 'Claude Debussy', options: ['Claude Debussy', 'Haydn', 'Wagner', 'Schoenberg'] },
      { id: 'modern-stravinsky', name: 'Modernism: Stravinsky', prompt: 'Which ballet famously caused a Paris scandal in 1913?', answer: 'The Rite of Spring', options: ['The Rite of Spring', 'Messiah', 'Eine kleine Nachtmusik', 'La traviata'] },
    ],
  },
  {
    id: 'art-movements-sculpture',
    title: 'Painting Movements and Sculpture',
    group: 'Art',
    description: 'Art movements, key artists, masterpieces, sculptors, and sculpture anchors.',
    modes: ['choice', 'type'],
    coverage: 'Core movement and sculpture deck; image recognition lives in the paintings deck.',
    items: [
      { id: 'renaissance', name: 'Renaissance', prompt: 'Which movement includes Leonardo, Michelangelo, and Raphael?', answer: 'Renaissance', options: ['Renaissance', 'Surrealism', 'Rococo', 'Abstract Expressionism'] },
      { id: 'baroque-art', name: 'Baroque', prompt: 'Caravaggio, Rubens, and Rembrandt are central to which movement?', answer: 'Baroque', options: ['Baroque', 'Impressionism', 'Cubism', 'Neoclassicism'] },
      { id: 'impressionism', name: 'Impressionism', prompt: 'Monet, Renoir, and Degas are central to which movement?', answer: 'Impressionism', options: ['Impressionism', 'Mannerism', 'Dada', 'Realism'] },
      { id: 'cubism', name: 'Cubism', prompt: 'Picasso and Braque are central to which movement?', answer: 'Cubism', options: ['Cubism', 'Romanticism', 'Gothic', 'Fauvism'] },
      { id: 'surrealism', name: 'Surrealism', prompt: 'Dali and Magritte are central to which movement?', answer: 'Surrealism', options: ['Surrealism', 'Pop Art', 'Symbolism', 'High Renaissance'] },
      { id: 'sculptor-michelangelo', name: 'Michelangelo', prompt: 'Who sculpted David and Pieta?', answer: 'Michelangelo', options: ['Michelangelo', 'Rodin', 'Bernini', 'Donatello'] },
      { id: 'sculptor-rodin', name: 'Auguste Rodin', prompt: 'Who sculpted The Thinker?', answer: 'Auguste Rodin', options: ['Auguste Rodin', 'Phidias', 'Brancusi', 'Henry Moore'] },
      { id: 'sculptor-bernini', name: 'Gian Lorenzo Bernini', prompt: 'Who sculpted Apollo and Daphne?', answer: 'Gian Lorenzo Bernini', options: ['Gian Lorenzo Bernini', 'Canova', 'Ghiberti', 'Cellini'] },
    ],
  },
  {
    id: 'philosophy-literature',
    title: 'Philosophy, Poetry, Books',
    group: 'Philosophy',
    description: 'Movements, famous philosophers, poets, and books to know by heart.',
    modes: ['choice', 'type'],
    coverage: 'Canonical Western and global anchors: names, works, and movements.',
    items: [
      { id: 'plato', name: 'Plato', prompt: 'Which philosopher wrote The Republic?', answer: 'Plato', options: ['Plato', 'Aristotle', 'Descartes', 'Nietzsche'] },
      { id: 'kant', name: 'Immanuel Kant', prompt: 'Which philosopher wrote Critique of Pure Reason?', answer: 'Immanuel Kant', options: ['Immanuel Kant', 'David Hume', 'Jean-Paul Sartre', 'Simone de Beauvoir'] },
      { id: 'existentialism', name: 'Existentialism', prompt: 'Which movement emphasizes freedom, responsibility, anxiety, and meaning?', answer: 'Existentialism', options: ['Existentialism', 'Scholasticism', 'Logical positivism', 'Stoicism'] },
      { id: 'homer', name: 'Homer', prompt: 'Who is traditionally credited with the Iliad and the Odyssey?', answer: 'Homer', options: ['Homer', 'Virgil', 'Dante', 'Goethe'] },
      { id: 'shakespeare', name: 'William Shakespeare', prompt: 'Which poet-playwright wrote Hamlet and the Sonnets?', answer: 'William Shakespeare', options: ['William Shakespeare', 'John Milton', 'T. S. Eliot', 'Pablo Neruda'] },
      { id: 'don-quixote', name: 'Don Quixote', prompt: 'Who wrote Don Quixote?', answer: 'Miguel de Cervantes', options: ['Miguel de Cervantes', 'Leo Tolstoy', 'Jane Austen', 'Murasaki Shikibu'] },
      { id: 'war-peace', name: 'War and Peace', prompt: 'Who wrote War and Peace?', answer: 'Leo Tolstoy', options: ['Leo Tolstoy', 'Fyodor Dostoevsky', 'Victor Hugo', 'Charles Dickens'] },
    ],
  },
]

export const topics: Topic[] = [
  { id: 'world-countries', title: 'Countries of the World', group: 'Geography', description: 'Click every country on a vector world map, or identify the highlighted country.', modes: ['map-click', 'map-type'], mapScope: 'world', mapKind: 'country-polygons', items: [], coverage: 'All country polygons available in the Natural Earth world-atlas deck.' },
  { id: 'world-capitals', title: 'World Capitals and Second Cities', group: 'Geography', description: 'Capital recall with second-city notes for every country and territory in the source deck.', modes: ['type', 'choice', 'map-click'], mapScope: 'world', mapKind: 'points', items: worldCountryKnowledge, coverage: 'All entries with capitals from the world-countries dataset.' },
  { id: 'scotland-historic-counties', title: 'Historic Counties of Scotland', group: 'Geography', description: 'Learn the historic counties as map targets over a detailed modern UK boundary layer.', modes: ['map-click', 'map-type'], mapScope: 'uk', mapKind: 'points', boundaryLayer: 'uk-admin', items: scotlandHistoricCounties, coverage: 'Historic county names with modern ONS county/unitary outlines as geographic reference. Note: outlines are modern administrative boundaries, not historic county borders.' },
  { id: 'gb-historic-counties', title: 'Historic Counties of Great Britain', group: 'Geography', description: 'Practice the historic county names of England, Wales, and Scotland over detailed modern UK outlines.', modes: ['map-click', 'map-type'], mapScope: 'uk', mapKind: 'points', boundaryLayer: 'uk-admin', items: greatBritainHistoricCounties, coverage: 'Historic counties target deck for Great Britain, with modern ONS outlines for map detail. Note: outlines are modern administrative boundaries, not historic county borders.' },
  { id: 'uk-cities', title: 'Top UK Cities', group: 'Geography', description: 'Place the main cities and learn the population anchors for the top five.', modes: ['map-click', 'map-type'], mapScope: 'uk', mapKind: 'points', boundaryLayer: 'uk-admin', items: ukCities, coverage: 'Top-city starter deck with population notes.' },
  { id: 'scotland-settlements', title: 'Top 20 Scottish Settlements', group: 'Geography', description: 'Place Scotland’s major cities and towns on the map.', modes: ['map-click', 'map-type'], mapScope: 'uk', mapKind: 'points', boundaryLayer: 'uk-admin', items: scottishSettlements, coverage: 'Top 20 settlement deck.' },
  { id: 'england-settlements', title: 'Top 20 English Settlements', group: 'Geography', description: 'Place England’s major cities and famous university/port settlements.', modes: ['map-click', 'map-type'], mapScope: 'uk', mapKind: 'points', boundaryLayer: 'uk-admin', items: englishSettlements, coverage: 'Top 20 practical deck.' },
  { id: 'french-departments', title: 'French Departments and Biggest Cities', group: 'Geography', description: 'Click departments on real boundaries, name their location, and recall the biggest city.', modes: ['map-click', 'map-type', 'type', 'choice'], mapScope: 'france', mapKind: 'points', boundaryLayer: 'fr-departments', items: frenchDepartments, coverage: 'All current departments with biggest-city prompts; map modes show metropolitan France only (GeoJSON); typed/choice modes include overseas departments.' },
  { id: 'french-regions', title: 'French Regions and Biggest Cities', group: 'Geography', description: 'Click regions on real boundaries and recall the biggest city for every region.', modes: ['map-click', 'map-type', 'type', 'choice'], mapScope: 'france', mapKind: 'points', boundaryLayer: 'fr-regions', items: frenchRegions, coverage: 'Current French regions with region polygons rendered from GeoJSON. Map modes show metropolitan France only; typed/choice modes include overseas regions.' },
  { id: 'france-cities', title: 'Top 20 French Cities', group: 'Geography', description: 'Place France’s largest communes and remember the top-five population anchors.', modes: ['map-click', 'map-type'], mapScope: 'france', mapKind: 'points', boundaryLayer: 'fr-departments', items: frenchCities, coverage: 'Top 20 commune deck.' },
  { id: 'us-states', title: 'US States and Capitals', group: 'Geography', description: 'Place all 50 states as center targets and drill their capitals.', modes: ['map-click', 'map-type', 'type', 'choice'], mapScope: 'usa', mapKind: 'points', boundaryLayer: 'us-states', items: usStates, coverage: 'All 50 states with capitals.' },
  { id: 'rivers', title: 'Major World, UK, and French Rivers', group: 'Geography', description: 'Locate the world great rivers plus UK and France anchors.', modes: ['map-click', 'map-type'], mapScope: 'world', mapKind: 'points', items: riversAndRanges, coverage: 'Top world rivers plus Thames, Seine, and Loire anchors.' },
  { id: 'mountain-ranges', title: 'Top 20 Mountain Ranges', group: 'Geography', description: 'Place the main mountain systems of the world.', modes: ['map-click', 'map-type'], mapScope: 'world', mapKind: 'points', items: mountainRanges, coverage: 'Top 20 global range deck.' },
  { id: 'solar-system', title: 'Planets of the Solar System', group: 'Science', description: 'Name the planets from the Sun outward, and recall where the asteroid belt sits.', modes: ['sequence'], items: solarSystemItems, coverage: 'Eight planets in order plus the main asteroid belt between Mars and Jupiter.' },
  { id: 'paintings', title: 'Famous Paintings Recognition', group: 'Art', description: 'See the painting; name the work or the artist.', modes: ['image', 'choice'], items: paintings, coverage: 'Core image-recognition deck with public-domain/open Wikimedia images where available.' },
  ...knowledgeQuestions,
]
