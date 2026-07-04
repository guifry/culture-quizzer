import type { ColonyRelation, Topic } from '../types'

// Curated, deliberately editorial mapping from a coloniser (present-day country or
// major empire) to the PRESENT-DAY countries that were once under its rule. Country
// names match the world-atlas 110m `properties.name` exactly so map clicks resolve.
//
// Rules frozen for consistency (see CLAUDE.md):
// - A present-day country may appear under several colonisers (ruled in turn / split).
// - Category (colony / protectorate / mandate / trust / settler) is blurred into a
//   short `note` shown as a pill; it is never itself quizzed.
// - `lostYear` = year that coloniser lost control. `independenceYear` = year the
//   country became independent, set only when it differs from `lostYear`.
// - Settler states are included, tagged with a `settler` note.

type Relation = Omit<ColonyRelation, 'status'>

const FORMER: Record<string, Relation[]> = {
  'United Kingdom': [
    // Africa
    { coloniser: 'United Kingdom', country: 'Egypt', lostYear: 1922, note: 'protectorate' },
    { coloniser: 'United Kingdom', country: 'Sudan', lostYear: 1956, note: 'Anglo-Egyptian condominium' },
    { coloniser: 'United Kingdom', country: 'S. Sudan', lostYear: 1956, independenceYear: 2011, note: 'part of Anglo-Egyptian Sudan' },
    { coloniser: 'United Kingdom', country: 'Nigeria', lostYear: 1960 },
    { coloniser: 'United Kingdom', country: 'Ghana', lostYear: 1957, note: 'Gold Coast' },
    { coloniser: 'United Kingdom', country: 'Sierra Leone', lostYear: 1961 },
    { coloniser: 'United Kingdom', country: 'Gambia', lostYear: 1965 },
    { coloniser: 'United Kingdom', country: 'Kenya', lostYear: 1963 },
    { coloniser: 'United Kingdom', country: 'Uganda', lostYear: 1962, note: 'protectorate' },
    { coloniser: 'United Kingdom', country: 'Tanzania', lostYear: 1961, note: 'Tanganyika, mandate after Germany' },
    { coloniser: 'United Kingdom', country: 'Zambia', lostYear: 1964, note: 'Northern Rhodesia' },
    { coloniser: 'United Kingdom', country: 'Zimbabwe', lostYear: 1980, note: 'Southern Rhodesia' },
    { coloniser: 'United Kingdom', country: 'Malawi', lostYear: 1964, note: 'Nyasaland' },
    { coloniser: 'United Kingdom', country: 'Botswana', lostYear: 1966, note: 'Bechuanaland protectorate' },
    { coloniser: 'United Kingdom', country: 'Lesotho', lostYear: 1966, note: 'Basutoland' },
    { coloniser: 'United Kingdom', country: 'eSwatini', lostYear: 1968, note: 'Swaziland' },
    { coloniser: 'United Kingdom', country: 'South Africa', lostYear: 1931, note: 'settler; Union 1910' },
    { coloniser: 'United Kingdom', country: 'Namibia', lostYear: 1990, note: 'South African mandate, UK-linked' },
    { coloniser: 'United Kingdom', country: 'Somalia', lostYear: 1960, note: 'British Somaliland' },
    { coloniser: 'United Kingdom', country: 'Somaliland', lostYear: 1960, note: 'British Somaliland' },
    { coloniser: 'United Kingdom', country: 'Cameroon', lostYear: 1961, note: 'British Cameroons (western part)' },
    // Asia
    { coloniser: 'United Kingdom', country: 'India', lostYear: 1947 },
    { coloniser: 'United Kingdom', country: 'Pakistan', lostYear: 1947, note: 'partition of British India' },
    { coloniser: 'United Kingdom', country: 'Bangladesh', lostYear: 1947, independenceYear: 1971, note: 'British India, then East Pakistan' },
    { coloniser: 'United Kingdom', country: 'Sri Lanka', lostYear: 1948, note: 'Ceylon' },
    { coloniser: 'United Kingdom', country: 'Myanmar', lostYear: 1948, note: 'Burma' },
    { coloniser: 'United Kingdom', country: 'Malaysia', lostYear: 1957, note: 'Malaya; federation 1963' },
    { coloniser: 'United Kingdom', country: 'Brunei', lostYear: 1984, note: 'protectorate' },
    // Middle East
    { coloniser: 'United Kingdom', country: 'Iraq', lostYear: 1932, note: 'mandate' },
    { coloniser: 'United Kingdom', country: 'Jordan', lostYear: 1946, note: 'Transjordan mandate' },
    { coloniser: 'United Kingdom', country: 'Israel', lostYear: 1948, note: 'Mandatory Palestine' },
    { coloniser: 'United Kingdom', country: 'Palestine', lostYear: 1948, note: 'Mandatory Palestine' },
    { coloniser: 'United Kingdom', country: 'Kuwait', lostYear: 1961, note: 'protectorate' },
    { coloniser: 'United Kingdom', country: 'Qatar', lostYear: 1971, note: 'protectorate' },
    { coloniser: 'United Kingdom', country: 'United Arab Emirates', lostYear: 1971, note: 'Trucial States' },
    { coloniser: 'United Kingdom', country: 'Yemen', lostYear: 1967, note: 'Aden / South Arabia' },
    { coloniser: 'United Kingdom', country: 'Cyprus', lostYear: 1960 },
    // Americas
    { coloniser: 'United Kingdom', country: 'United States of America', lostYear: 1783, note: 'settler; independence 1776' },
    { coloniser: 'United Kingdom', country: 'Canada', lostYear: 1931, note: 'settler; confederation 1867' },
    { coloniser: 'United Kingdom', country: 'Jamaica', lostYear: 1962 },
    { coloniser: 'United Kingdom', country: 'Bahamas', lostYear: 1973 },
    { coloniser: 'United Kingdom', country: 'Belize', lostYear: 1981, note: 'British Honduras' },
    { coloniser: 'United Kingdom', country: 'Guyana', lostYear: 1966, note: 'British Guiana' },
    { coloniser: 'United Kingdom', country: 'Trinidad and Tobago', lostYear: 1962 },
    // Oceania
    { coloniser: 'United Kingdom', country: 'Australia', lostYear: 1931, note: 'settler; federation 1901' },
    { coloniser: 'United Kingdom', country: 'New Zealand', lostYear: 1947, note: 'settler; dominion 1907' },
    { coloniser: 'United Kingdom', country: 'Fiji', lostYear: 1970 },
    { coloniser: 'United Kingdom', country: 'Papua New Guinea', lostYear: 1975, note: 'British/Australian Papua (south)' },
    { coloniser: 'United Kingdom', country: 'Solomon Is.', lostYear: 1978, note: 'protectorate' },
    { coloniser: 'United Kingdom', country: 'Vanuatu', lostYear: 1980, note: 'Anglo-French condominium' },
    // Europe
    { coloniser: 'United Kingdom', country: 'Ireland', lostYear: 1922, note: 'Irish Free State' },
  ],

  France: [
    // North Africa
    { coloniser: 'France', country: 'Algeria', lostYear: 1962 },
    { coloniser: 'France', country: 'Tunisia', lostYear: 1956, note: 'protectorate' },
    { coloniser: 'France', country: 'Morocco', lostYear: 1956, note: 'protectorate (shared with Spain)' },
    // West / Central / East Africa
    { coloniser: 'France', country: 'Senegal', lostYear: 1960 },
    { coloniser: 'France', country: 'Mali', lostYear: 1960, note: 'French Sudan' },
    { coloniser: 'France', country: 'Niger', lostYear: 1960 },
    { coloniser: 'France', country: 'Chad', lostYear: 1960 },
    { coloniser: 'France', country: 'Mauritania', lostYear: 1960 },
    { coloniser: 'France', country: 'Burkina Faso', lostYear: 1960, note: 'Upper Volta' },
    { coloniser: 'France', country: "Côte d'Ivoire", lostYear: 1960 },
    { coloniser: 'France', country: 'Guinea', lostYear: 1958 },
    { coloniser: 'France', country: 'Benin', lostYear: 1960, note: 'Dahomey' },
    { coloniser: 'France', country: 'Togo', lostYear: 1960, note: 'French Togoland after Germany' },
    { coloniser: 'France', country: 'Cameroon', lostYear: 1960, note: 'French Cameroon (eastern part)' },
    { coloniser: 'France', country: 'Gabon', lostYear: 1960 },
    { coloniser: 'France', country: 'Congo', lostYear: 1960, note: 'Middle Congo' },
    { coloniser: 'France', country: 'Central African Rep.', lostYear: 1960, note: 'Ubangi-Shari' },
    { coloniser: 'France', country: 'Djibouti', lostYear: 1977, note: 'French Somaliland' },
    { coloniser: 'France', country: 'Madagascar', lostYear: 1960 },
    // Asia / Middle East
    { coloniser: 'France', country: 'Vietnam', lostYear: 1954, note: 'French Indochina' },
    { coloniser: 'France', country: 'Laos', lostYear: 1953, note: 'French Indochina' },
    { coloniser: 'France', country: 'Cambodia', lostYear: 1953, note: 'French Indochina' },
    { coloniser: 'France', country: 'Syria', lostYear: 1946, note: 'mandate' },
    { coloniser: 'France', country: 'Lebanon', lostYear: 1943, note: 'mandate' },
    // Americas / Oceania
    { coloniser: 'France', country: 'Haiti', lostYear: 1804, note: 'Saint-Domingue' },
    { coloniser: 'France', country: 'Vanuatu', lostYear: 1980, note: 'Anglo-French condominium' },
  ],

  Spain: [
    // Americas
    { coloniser: 'Spain', country: 'Mexico', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Guatemala', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Honduras', lostYear: 1821 },
    { coloniser: 'Spain', country: 'El Salvador', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Nicaragua', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Costa Rica', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Panama', lostYear: 1821, independenceYear: 1903, note: 'via Gran Colombia' },
    { coloniser: 'Spain', country: 'Colombia', lostYear: 1819 },
    { coloniser: 'Spain', country: 'Venezuela', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Ecuador', lostYear: 1822 },
    { coloniser: 'Spain', country: 'Peru', lostYear: 1824 },
    { coloniser: 'Spain', country: 'Bolivia', lostYear: 1825 },
    { coloniser: 'Spain', country: 'Chile', lostYear: 1818 },
    { coloniser: 'Spain', country: 'Argentina', lostYear: 1816 },
    { coloniser: 'Spain', country: 'Paraguay', lostYear: 1811 },
    { coloniser: 'Spain', country: 'Uruguay', lostYear: 1828 },
    { coloniser: 'Spain', country: 'Cuba', lostYear: 1898 },
    { coloniser: 'Spain', country: 'Dominican Rep.', lostYear: 1821 },
    { coloniser: 'Spain', country: 'Puerto Rico', lostYear: 1898, note: 'ceded to the US' },
    // Africa
    { coloniser: 'Spain', country: 'Eq. Guinea', lostYear: 1968, note: 'Spanish Guinea' },
    { coloniser: 'Spain', country: 'W. Sahara', lostYear: 1975, note: 'Spanish Sahara' },
    { coloniser: 'Spain', country: 'Morocco', lostYear: 1956, note: 'Spanish protectorate (north)' },
    // Asia
    { coloniser: 'Spain', country: 'Philippines', lostYear: 1898, note: 'ceded to the US' },
  ],

  Portugal: [
    { coloniser: 'Portugal', country: 'Brazil', lostYear: 1822 },
    { coloniser: 'Portugal', country: 'Angola', lostYear: 1975 },
    { coloniser: 'Portugal', country: 'Mozambique', lostYear: 1975 },
    { coloniser: 'Portugal', country: 'Guinea-Bissau', lostYear: 1974, note: 'Portuguese Guinea' },
    { coloniser: 'Portugal', country: 'Timor-Leste', lostYear: 1975, independenceYear: 2002, note: 'Portuguese Timor, then Indonesia' },
  ],

  Netherlands: [
    { coloniser: 'Netherlands', country: 'Indonesia', lostYear: 1949, note: 'Dutch East Indies' },
    { coloniser: 'Netherlands', country: 'Suriname', lostYear: 1975, note: 'Dutch Guiana' },
    { coloniser: 'Netherlands', country: 'South Africa', lostYear: 1806, note: 'Cape Colony, ceded to Britain' },
    { coloniser: 'Netherlands', country: 'Sri Lanka', lostYear: 1796, note: 'Dutch Ceylon, ceded to Britain' },
  ],

  Germany: [
    // All German colonies lost at Versailles, 1919.
    { coloniser: 'Germany', country: 'Tanzania', lostYear: 1919, independenceYear: 1961, note: 'German East Africa' },
    { coloniser: 'Germany', country: 'Namibia', lostYear: 1919, independenceYear: 1990, note: 'German South-West Africa' },
    { coloniser: 'Germany', country: 'Cameroon', lostYear: 1919, independenceYear: 1960, note: 'Kamerun' },
    { coloniser: 'Germany', country: 'Togo', lostYear: 1919, independenceYear: 1960, note: 'Togoland' },
    { coloniser: 'Germany', country: 'Rwanda', lostYear: 1919, independenceYear: 1962, note: 'German East Africa' },
    { coloniser: 'Germany', country: 'Burundi', lostYear: 1919, independenceYear: 1962, note: 'German East Africa' },
    { coloniser: 'Germany', country: 'Papua New Guinea', lostYear: 1919, independenceYear: 1975, note: 'German New Guinea (north)' },
  ],

  Italy: [
    { coloniser: 'Italy', country: 'Libya', lostYear: 1943, independenceYear: 1951 },
    { coloniser: 'Italy', country: 'Eritrea', lostYear: 1941, independenceYear: 1993, note: 'then federated with Ethiopia' },
    { coloniser: 'Italy', country: 'Somalia', lostYear: 1941, independenceYear: 1960, note: 'Italian Somaliland' },
    { coloniser: 'Italy', country: 'Ethiopia', lostYear: 1941, note: 'occupied 1936–41' },
  ],

  Belgium: [
    { coloniser: 'Belgium', country: 'Dem. Rep. Congo', lostYear: 1960, note: 'Belgian Congo' },
    { coloniser: 'Belgium', country: 'Rwanda', lostYear: 1962, note: 'trust territory after Germany' },
    { coloniser: 'Belgium', country: 'Burundi', lostYear: 1962, note: 'trust territory after Germany' },
  ],

  Japan: [
    { coloniser: 'Japan', country: 'South Korea', lostYear: 1945, note: 'Korea annexed 1910' },
    { coloniser: 'Japan', country: 'North Korea', lostYear: 1945, note: 'Korea annexed 1910' },
    { coloniser: 'Japan', country: 'Taiwan', lostYear: 1945, note: 'ceded to the ROC' },
  ],

  'United States of America': [
    { coloniser: 'United States of America', country: 'Philippines', lostYear: 1946 },
    { coloniser: 'United States of America', country: 'Cuba', lostYear: 1902, note: 'protectorate (Platt Amendment)' },
  ],

  Denmark: [
    { coloniser: 'Denmark', country: 'Iceland', lostYear: 1944 },
    { coloniser: 'Denmark', country: 'Norway', lostYear: 1814, independenceYear: 1905, note: 'Denmark–Norway, ceded to Sweden' },
  ],

  Russia: [
    // Ex-Soviet republics (USSR dissolved 1991)
    { coloniser: 'Russia', country: 'Estonia', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Latvia', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Lithuania', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Belarus', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Ukraine', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Moldova', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Georgia', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Armenia', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Azerbaijan', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Kazakhstan', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Uzbekistan', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Turkmenistan', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Tajikistan', lostYear: 1991, note: 'USSR' },
    { coloniser: 'Russia', country: 'Kyrgyzstan', lostYear: 1991, note: 'USSR' },
    // Russian Empire
    { coloniser: 'Russia', country: 'Finland', lostYear: 1917, note: 'Grand Duchy of Finland' },
    { coloniser: 'Russia', country: 'Poland', lostYear: 1918, note: 'Russian partition' },
  ],

  'Ottoman Empire': [
    // Balkans / Europe
    { coloniser: 'Ottoman Empire', country: 'Greece', lostYear: 1830 },
    { coloniser: 'Ottoman Empire', country: 'Serbia', lostYear: 1878 },
    { coloniser: 'Ottoman Empire', country: 'Bulgaria', lostYear: 1878, independenceYear: 1908 },
    { coloniser: 'Ottoman Empire', country: 'Romania', lostYear: 1878 },
    { coloniser: 'Ottoman Empire', country: 'Montenegro', lostYear: 1878 },
    { coloniser: 'Ottoman Empire', country: 'Bosnia and Herz.', lostYear: 1878, note: 'to Austria-Hungary' },
    { coloniser: 'Ottoman Empire', country: 'Albania', lostYear: 1912 },
    { coloniser: 'Ottoman Empire', country: 'Macedonia', lostYear: 1912 },
    { coloniser: 'Ottoman Empire', country: 'Kosovo', lostYear: 1912, independenceYear: 2008 },
    { coloniser: 'Ottoman Empire', country: 'Hungary', lostYear: 1699, note: 'central Hungary 1541–1699' },
    { coloniser: 'Ottoman Empire', country: 'Cyprus', lostYear: 1878, note: 'ceded to Britain' },
    // Middle East
    { coloniser: 'Ottoman Empire', country: 'Iraq', lostYear: 1918, note: 'then British mandate' },
    { coloniser: 'Ottoman Empire', country: 'Syria', lostYear: 1918, note: 'then French mandate' },
    { coloniser: 'Ottoman Empire', country: 'Lebanon', lostYear: 1918, note: 'then French mandate' },
    { coloniser: 'Ottoman Empire', country: 'Israel', lostYear: 1918, note: 'Ottoman Palestine' },
    { coloniser: 'Ottoman Empire', country: 'Palestine', lostYear: 1918, note: 'Ottoman Palestine' },
    { coloniser: 'Ottoman Empire', country: 'Jordan', lostYear: 1918 },
    { coloniser: 'Ottoman Empire', country: 'Saudi Arabia', lostYear: 1918, note: 'Hejaz' },
    { coloniser: 'Ottoman Empire', country: 'Yemen', lostYear: 1918, note: 'North Yemen' },
    { coloniser: 'Ottoman Empire', country: 'Kuwait', lostYear: 1913, note: 'nominal, then British' },
    // North Africa
    { coloniser: 'Ottoman Empire', country: 'Egypt', lostYear: 1914, note: 'nominal after 1882 British rule' },
    { coloniser: 'Ottoman Empire', country: 'Libya', lostYear: 1912, note: 'then Italian' },
    { coloniser: 'Ottoman Empire', country: 'Tunisia', lostYear: 1881, note: 'then French' },
    { coloniser: 'Ottoman Empire', country: 'Algeria', lostYear: 1830, note: 'then French' },
  ],
}

export const coloniserOrder: string[] = Object.keys(FORMER)

export const colonyRelations: ColonyRelation[] = coloniserOrder.flatMap((coloniser) =>
  FORMER[coloniser].map((relation) => ({ ...relation, status: 'former' as const })),
)

export function relationsByColoniser(status: ColonyRelation['status'] = 'former'): Map<string, ColonyRelation[]> {
  const grouped = new Map<string, ColonyRelation[]>()
  for (const relation of colonyRelations) {
    if (relation.status !== status) continue
    const list = grouped.get(relation.coloniser) ?? []
    list.push(relation)
    grouped.set(relation.coloniser, list)
  }
  return grouped
}

export const coloniesTopic: Topic = {
  id: 'colonies',
  title: 'Colonies and Empires',
  group: 'Geography',
  description: 'For each empire, click every present-day country it once ruled, then press Space to check.',
  coverage: 'Former colonies, protectorates, mandates, and settler states of 13 major colonial powers, mapped to present-day countries.',
  modes: ['map-multi'],
  kind: 'colonies',
  colonies: colonyRelations,
  items: [],
}
