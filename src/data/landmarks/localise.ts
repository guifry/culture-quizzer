import type { Landmark, Topic } from '../types'
import type { Language } from '../../settings'
import { franceLandmarksFr } from './france-landmarks.fr'

const FR_TOPIC_TEXT = {
  title: 'Top 42 des monuments de France',
  description: 'Situez les grands monuments de France, nommez-les d\'après leurs photos ou à partir d\'un indice.',
  coverage: 'Quarante-deux monuments de France : préhistoire, Gaule romaine, cathédrales médiévales, châteaux de la Renaissance, monuments modernes et merveilles naturelles.',
}

function localiseLandmark(landmark: Landmark, language: Language): Landmark {
  const fr = franceLandmarksFr[landmark.id]
  if (!fr) return landmark
  if (language !== 'fr') {
    return { ...landmark, nameFr: fr.name }
  }
  return {
    ...landmark,
    name: fr.name,
    nameFr: landmark.name,
    mapBlurb: fr.mapBlurb,
    clues: fr.clues,
    course: {
      ...landmark.course,
      nutshell: fr.course.nutshell,
      when: fr.course.when,
      who: fr.course.who,
      people: fr.course.people ?? landmark.course.people,
      events: fr.course.events ?? landmark.course.events,
    },
  }
}

// The France deck is the only localised game for now. In English mode the French names are
// still attached (nameFr) so typed answers are accepted in both languages either way.
export function localiseLandmarkTopic(topic: Topic, language: Language): Topic {
  if (topic.id !== 'france-landmarks-game' || !topic.landmarks) return topic
  const landmarks = topic.landmarks.map((landmark) => localiseLandmark(landmark, language))
  const items = landmarks.map((landmark) => ({ id: landmark.id, name: landmark.name, lat: landmark.lat, lon: landmark.lon }))
  if (language !== 'fr') return { ...topic, landmarks, items }
  return { ...topic, ...FR_TOPIC_TEXT, landmarks, items }
}
