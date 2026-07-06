// Named landmarks per city — one recognisable Commons photo is sourced per entry.
// Run: node scripts/prep-city-images.mjs [id ...]  (no args = all cities)
export const LANDMARKS = {
  paris: [
    'Eiffel Tower Paris', 'Louvre pyramid', 'Arc de Triomphe Paris', 'Notre-Dame de Paris cathedral',
    'Sacre-Coeur Paris', 'Pantheon Paris', 'Musee d Orsay building', 'Champs Elysees Paris',
    'Pont Alexandre III', 'Place de la Concorde Paris', 'Palais Garnier opera Paris', 'Montmartre Paris street',
  ],
  tokyo: [
    'Tokyo Tower', 'Tokyo Skytree', 'Shibuya Crossing', 'Sensoji temple Asakusa',
    'Tokyo Imperial Palace bridge', 'Shinjuku skyscrapers night', 'Rainbow Bridge Tokyo', 'Meiji Shrine Tokyo',
    'Tokyo Station Marunouchi building', 'Odaiba Tokyo', 'Ginza Tokyo street', 'Shibuya night Tokyo',
  ],
  'new-york': [
    'Statue of Liberty', 'Empire State Building', 'Times Square New York', 'Brooklyn Bridge New York',
    'Central Park New York', 'Lower Manhattan skyline', 'One World Trade Center', 'Rockefeller Center New York',
    'Flatiron Building New York', 'Grand Central Terminal interior', 'Chrysler Building New York', 'Fifth Avenue New York',
  ],
  'los-angeles': [
    'Hollywood Sign', 'Griffith Observatory', 'Hollywood Walk of Fame', 'Santa Monica Pier',
    'Los Angeles downtown skyline', 'Walt Disney Concert Hall', 'Getty Center building architecture', 'Venice Beach Los Angeles',
    'Los Angeles City Hall', 'Universal Studios Hollywood', 'Rodeo Drive Beverly Hills', 'Union Station Los Angeles',
  ],
  london: [
    'Big Ben Elizabeth Tower', 'Tower Bridge London', 'Buckingham Palace', 'London Eye',
    'St Pauls Cathedral London', 'Houses of Parliament London', 'Tower of London', 'Trafalgar Square London',
    'Piccadilly Circus London', 'The Shard London', 'Westminster Abbey exterior', 'British Museum London',
  ],
  beijing: [
    'Forbidden City Beijing', 'Great Wall of China Badaling', 'Temple of Heaven Beijing', 'Tiananmen Beijing',
    'Summer Palace Beijing', 'Beijing National Stadium', 'CCTV Headquarters Beijing', 'Lama Temple Beijing',
    'Beijing skyline', 'Hutong Beijing', 'Great Hall of the People Beijing', 'Wangfujing Beijing',
  ],
  cairo: [
    'Pyramids of Giza', 'Great Sphinx of Giza', 'Egyptian Museum Cairo', 'Cairo Citadel',
    'Mosque of Muhammad Ali Cairo', 'Khan el-Khalili Cairo', 'Al-Azhar Mosque Cairo', 'Cairo Tower',
    'Nile river Cairo', 'Coptic Cairo', 'Tahrir Square Cairo', 'Cairo skyline',
  ],
  rome: [
    'Colosseum Rome', 'Trevi Fountain Rome', 'St Peters Basilica Rome', 'Roman Forum',
    'Pantheon Rome', 'St Peters Square colonnade Vatican', 'Spanish Steps Rome', 'Piazza Navona Rome',
    'Castel Sant Angelo Rome', 'Altare della Patria Rome', 'Colosseum interior Rome', 'Piazza del Popolo Rome',
  ],
  istanbul: [
    'Hagia Sophia', 'Blue Mosque Istanbul', 'Topkapi Palace Istanbul', 'Bosphorus Istanbul',
    'Grand Bazaar Istanbul', 'Galata Tower Istanbul', 'Basilica Cistern Istanbul', 'Suleymaniye Mosque Istanbul',
    'Dolmabahce Palace', 'Istanbul skyline', 'Spice Bazaar Istanbul', 'Bosphorus Bridge Istanbul',
  ],
  moscow: [
    'Saint Basils Cathedral Moscow', 'Moscow Kremlin', 'Red Square Moscow', 'Bolshoi Theatre Moscow',
    'Moscow State University building', 'Cathedral of Christ the Saviour Moscow', 'GUM Moscow', 'Moscow City skyscrapers',
    'Tretyakov Gallery Moscow', 'Novodevichy Convent Moscow', 'Moscow Metro station', 'Gorky Park Moscow',
  ],
  delhi: [
    'India Gate Delhi', 'Red Fort Delhi', 'Qutub Minar Delhi', 'Humayuns Tomb Delhi',
    'Lotus Temple Delhi', 'Jama Masjid Delhi', 'Akshardham Delhi', 'Rashtrapati Bhavan Delhi',
    'Connaught Place Delhi', 'Chandni Chowk Delhi', 'Gurudwara Bangla Sahib Delhi', 'Delhi skyline',
  ],
  'rio-de-janeiro': [
    'Christ the Redeemer Rio', 'Sugarloaf Mountain Rio', 'Copacabana beach Rio', 'Ipanema beach Rio',
    'Maracana Stadium Rio', 'Selaron Steps Rio', 'Rio de Janeiro skyline', 'Santa Teresa Rio',
    'Municipal Theatre Rio de Janeiro', 'Rio de Janeiro harbour', 'Botafogo Rio', 'Lapa Arches Rio',
  ],
  'mexico-city': [
    'Metropolitan Cathedral Mexico City', 'Palacio de Bellas Artes', 'Angel of Independence Mexico City', 'Zocalo Mexico City',
    'Templo Mayor Mexico City', 'Chapultepec Castle', 'National Palace Mexico City', 'Torre Latinoamericana',
    'Basilica of Guadalupe', 'Paseo de la Reforma Mexico City', 'Frida Kahlo Museum', 'Mexico City skyline',
  ],
  shanghai: [
    'Oriental Pearl Tower Shanghai', 'The Bund Shanghai', 'Shanghai Tower', 'Yu Garden Shanghai',
    'Nanjing Road Shanghai', 'Shanghai Pudong skyline', 'Jin Mao Tower', 'Shanghai World Financial Center',
    'City God Temple Shanghai', 'Shanghai Museum', 'Lujiazui Shanghai', 'Shanghai night skyline',
  ],
  mumbai: [
    'Gateway of India Mumbai', 'Chhatrapati Shivaji Terminus', 'Marine Drive Mumbai', 'Taj Mahal Palace Hotel Mumbai',
    'Haji Ali Dargah Mumbai', 'Bandra-Worli Sea Link', 'Elephanta Caves', 'Mumbai skyline',
    'Dhobi Ghat Mumbai', 'Siddhivinayak Temple Mumbai', 'Nariman Point Mumbai', 'Colaba Mumbai',
  ],
  berlin: [
    'Brandenburg Gate', 'East Side Gallery Berlin Wall', 'Reichstag building Berlin', 'Berlin Cathedral',
    'Fernsehturm Berlin TV Tower', 'Checkpoint Charlie Berlin', 'Museum Island Berlin', 'Holocaust Memorial Berlin',
    'Berlin Victory Column', 'Potsdamer Platz Berlin', 'Charlottenburg Palace Berlin', 'Berlin skyline',
  ],
  sydney: [
    'Sydney Opera House', 'Sydney Harbour Bridge', 'Bondi Beach Sydney', 'Sydney skyline',
    'Darling Harbour Sydney', 'Queen Victoria Building Sydney', 'Sydney Tower', 'Circular Quay Sydney',
    'Royal Botanic Garden Sydney', 'Manly Beach Sydney', 'Sydney Harbour', 'St Marys Cathedral Sydney',
  ],
  bangkok: [
    'Grand Palace Bangkok', 'Wat Arun Bangkok', 'Wat Pho reclining Buddha', 'Wat Phra Kaew Bangkok',
    'Chao Phraya river Bangkok', 'Bangkok skyline', 'Chatuchak Market Bangkok', 'Khao San Road Bangkok',
    'Democracy Monument Bangkok', 'Temple of the Emerald Buddha', 'Wat Saket Golden Mount', 'Bangkok Chinatown',
  ],
  dubai: [
    'Burj Khalifa', 'Burj Al Arab', 'Palm Jumeirah', 'Dubai Marina',
    'Dubai Fountain', 'Dubai Frame', 'Sheikh Zayed Road Dubai', 'Dubai Mall',
    'Jumeirah Mosque Dubai', 'Dubai skyline', 'Museum of the Future Dubai', 'Atlantis The Palm Dubai',
  ],
  seoul: [
    'Gyeongbokgung Palace', 'N Seoul Tower', 'Bukchon Hanok Village', 'Dongdaemun Design Plaza',
    'Cheonggyecheon Seoul', 'Lotte World Tower', 'Changdeokgung Palace', 'Myeongdong Seoul',
    'Han River Seoul', 'Gwanghwamun Seoul', 'Namdaemun Gate Seoul', 'Seoul skyline',
  ],
  'buenos-aires': [
    'Obelisco Buenos Aires', 'Casa Rosada Buenos Aires', 'Teatro Colon Buenos Aires', 'Caminito La Boca Buenos Aires',
    'Puerto Madero Buenos Aires', 'Recoleta Cemetery Buenos Aires', 'Plaza de Mayo Buenos Aires', 'Palacio Barolo Buenos Aires',
    'El Ateneo Grand Splendid Buenos Aires', 'Avenida 9 de Julio Buenos Aires', 'Buenos Aires Cathedral', 'Buenos Aires skyline',
  ],
  'cape-town': [
    'Table Mountain Cape Town', 'Cape of Good Hope', 'V and A Waterfront Cape Town', 'Bo-Kaap Cape Town',
    'Lions Head Cape Town', 'Cape Town City Hall', 'Boulders Beach penguins Cape Town', 'Robben Island',
    'Camps Bay Cape Town', 'Cape Town Stadium', 'Signal Hill Cape Town', 'Cape Town skyline',
  ],
  barcelona: [
    'Sagrada Familia', 'Park Guell Barcelona', 'Casa Batllo Barcelona', 'La Rambla Barcelona',
    'Casa Mila La Pedrera', 'Barcelona Cathedral', 'Camp Nou Barcelona', 'Montjuic Barcelona',
    'Gothic Quarter Barcelona', 'Arc de Triomf Barcelona', 'Barceloneta beach Barcelona', 'Barcelona skyline',
  ],
  amsterdam: [
    'Amsterdam canals', 'Rijksmuseum Amsterdam', 'Anne Frank House Amsterdam', 'Van Gogh Museum Amsterdam',
    'Dam Square Amsterdam', 'Amsterdam Centraal station', 'Royal Palace Amsterdam', 'Magere Brug Amsterdam',
    'Jordaan Amsterdam', 'Vondelpark Amsterdam', 'Westerkerk Amsterdam', 'Amsterdam canal houses',
  ],
  athens: [
    'Acropolis of Athens', 'Parthenon Athens', 'Temple of Olympian Zeus Athens', 'Panathenaic Stadium Athens',
    'Erechtheion Athens', 'Ancient Agora of Athens', 'Plaka Athens', 'Syntagma Square Athens',
    'Odeon of Herodes Atticus', 'Mount Lycabettus Athens', 'Hadrians Arch Athens', 'Athens skyline',
  ],
  vienna: [
    'Schonbrunn Palace Vienna', 'St Stephens Cathedral Vienna', 'Belvedere Palace Vienna', 'Vienna State Opera',
    'Hofburg Palace Vienna', 'Vienna City Hall Rathaus', 'Karlskirche Vienna', 'Prater Vienna Ferris wheel',
    'Austrian Parliament Building Vienna', 'Hundertwasserhaus Vienna', 'Kunsthistorisches Museum Vienna', 'Vienna skyline',
  ],
  chicago: [
    'Cloud Gate Chicago', 'Willis Tower Chicago', 'Chicago skyline', 'Navy Pier Chicago',
    'Millennium Park Chicago', 'Michigan Avenue Chicago', 'Chicago River downtown', 'Wrigley Field Chicago',
    'Art Institute of Chicago', 'John Hancock Center Chicago', 'Buckingham Fountain Chicago', 'Chicago Theatre',
  ],
  'san-francisco': [
    'Golden Gate Bridge', 'Alcatraz Island', 'San Francisco cable car', 'Painted Ladies San Francisco',
    'Lombard Street San Francisco', 'Fishermans Wharf San Francisco', 'Coit Tower San Francisco', 'San Francisco skyline',
    'Palace of Fine Arts San Francisco', 'Transamerica Pyramid San Francisco', 'Chinatown San Francisco', 'Bay Bridge San Francisco',
  ],
  toronto: [
    'CN Tower Toronto', 'Toronto skyline', 'Royal Ontario Museum', 'Casa Loma Toronto',
    'Nathan Phillips Square Toronto', 'Distillery District Toronto', 'Rogers Centre Toronto', 'Toronto City Hall',
    'Art Gallery of Ontario', 'Union Station Toronto', 'Toronto Islands', 'Old City Hall Toronto',
  ],
  lagos: [
    'Lagos Nigeria skyline', 'Third Mainland Bridge Lagos', 'National Theatre Lagos', 'Lekki Ikoyi Link Bridge',
    'Victoria Island Lagos', 'Tafawa Balewa Square Lagos', 'Nike Art Gallery Lagos', 'Lagos Island',
    'Eko Atlantic Lagos', 'Lekki Conservation Centre Lagos', 'Freedom Park Lagos', 'Marina Lagos Nigeria',
  ],
}
