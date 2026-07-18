import type { Language } from '../../settings'
import type { QuizMode } from '../types'

// UI strings for the landmark quiz. French is currently only served for the France deck;
// every other deck stays English regardless of the app language setting.
export type LandmarkQuizStrings = {
  locateEyebrow: string
  locateHelp: string
  photosAsk: string
  photosReveal: string
  clueEyebrow: string
  inputPlaceholder: string
  check: string
  next: string
  nameLabel: string
  nameCorrect: string
  nameWas: (name: string) => string
  youWrote: (text: string) => string
  locationLabel: string
  notPlaced: (region: string) => string
  correctInside: string
  correctSpotOn: string
  correctNear: (km: number) => string
  wrongAt: (region: string, km: number | null) => string
  historyName: string
  historyLocation: string
  kmOff: (km: number) => string
  deck: string
  progress: string
  score: string
  name: string
  location: string
  streak: string
  best: string
  deckComplete: string
  roundFinished: string
  newRound: string
  nameAccuracy: string
  locationAccuracy: string
  bestStreak: string
  quizType: string
  view: string
  play: string
  course: string
  modeLabel: (mode: QuizMode) => string
  loadingPhotos: string
  noPhotos: string
  mysteryPhotoAlt: string
  enlargePhoto: string
  mapHint: string
  mapAria: string
}

const en: LandmarkQuizStrings = {
  locateEyebrow: 'Locate on the map',
  locateHelp: 'Click where this landmark is in France.',
  photosAsk: 'Name the landmark from its photos',
  photosReveal: 'What you were looking at',
  clueEyebrow: 'Name the landmark from this clue',
  inputPlaceholder: 'Type the landmark name',
  check: 'Check',
  next: 'Next',
  nameLabel: 'Name:',
  nameCorrect: 'correct',
  nameWas: (name) => `it was ${name}`,
  youWrote: (text) => ` (you wrote "${text}")`,
  locationLabel: 'Location:',
  notPlaced: (region) => `not placed — it is in ${region}.`,
  correctInside: 'correct — inside the area.',
  correctSpotOn: 'correct — spot on.',
  correctNear: (km) => `correct — ${km} km from the exact spot.`,
  wrongAt: (region, km) => `it is in ${region}.${km !== null ? ` Your click was ${km} km away.` : ''}`,
  historyName: 'Name',
  historyLocation: 'Location',
  kmOff: (km) => `${km} km off`,
  deck: 'Deck',
  progress: 'Progress',
  score: 'Score',
  name: 'Name',
  location: 'Location',
  streak: 'Streak',
  best: 'Best',
  deckComplete: 'Deck complete',
  roundFinished: 'Round finished',
  newRound: 'Start new shuffled round',
  nameAccuracy: 'Name accuracy',
  locationAccuracy: 'Location accuracy',
  bestStreak: 'Best streak',
  quizType: 'Quiz type',
  view: 'View',
  play: 'Play',
  course: 'Course',
  modeLabel: (mode) => (mode === 'landmark-locate' ? 'Locate' : mode === 'landmark-photos' ? 'Photos' : 'Clue'),
  loadingPhotos: 'Loading photos…',
  noPhotos: 'Photos for this landmark are not available yet.',
  mysteryPhotoAlt: 'Photo of the mystery landmark',
  enlargePhoto: 'Enlarge photo',
  mapHint: 'Ctrl/⌘ + scroll to zoom · drag to pan',
  mapAria: 'Map of France',
}

const fr: LandmarkQuizStrings = {
  locateEyebrow: 'Situez sur la carte',
  locateHelp: 'Cliquez à l\'emplacement de ce monument en France.',
  photosAsk: 'Nommez le monument d\'après ses photos',
  photosReveal: 'Ce que vous regardiez',
  clueEyebrow: 'Nommez le monument à partir de cet indice',
  inputPlaceholder: 'Tapez le nom du monument',
  check: 'Vérifier',
  next: 'Suivant',
  nameLabel: 'Nom :',
  nameCorrect: 'correct',
  nameWas: (name) => `c'était ${name}`,
  youWrote: (text) => ` (vous avez écrit « ${text} »)`,
  locationLabel: 'Lieu :',
  notPlaced: (region) => `non placé — se trouve : ${region}.`,
  correctInside: 'correct — dans la zone.',
  correctSpotOn: 'correct — en plein dans le mille.',
  correctNear: (km) => `correct — à ${km} km du point exact.`,
  wrongAt: (region, km) => `se trouve : ${region}.${km !== null ? ` Votre clic était à ${km} km.` : ''}`,
  historyName: 'Nom',
  historyLocation: 'Lieu',
  kmOff: (km) => `à ${km} km`,
  deck: 'Jeu',
  progress: 'Progression',
  score: 'Score',
  name: 'Nom',
  location: 'Lieu',
  streak: 'Série',
  best: 'Record',
  deckComplete: 'Jeu terminé',
  roundFinished: 'Manche terminée',
  newRound: 'Nouvelle manche mélangée',
  nameAccuracy: 'Précision des noms',
  locationAccuracy: 'Précision des lieux',
  bestStreak: 'Meilleure série',
  quizType: 'Type de quiz',
  view: 'Vue',
  play: 'Jouer',
  course: 'Cours',
  modeLabel: (mode) => (mode === 'landmark-locate' ? 'Situer' : mode === 'landmark-photos' ? 'Photos' : 'Indice'),
  loadingPhotos: 'Chargement des photos…',
  noPhotos: 'Les photos de ce monument ne sont pas encore disponibles.',
  mysteryPhotoAlt: 'Photo du monument mystère',
  enlargePhoto: 'Agrandir la photo',
  mapHint: 'Ctrl/⌘ + molette pour zoomer · glissez pour déplacer',
  mapAria: 'Carte de France',
}

export function landmarkQuizStrings(language: Language): LandmarkQuizStrings {
  return language === 'fr' ? fr : en
}

const FR_REGION_NAMES: Record<string, string> = {
  Normandy: 'Normandie',
  Brittany: 'Bretagne',
  Corsica: 'Corse',
}

export function frenchRegionName(name: string): string {
  return FR_REGION_NAMES[name] ?? name
}
