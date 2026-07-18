import { useSyncExternalStore } from 'react'

export type Language = 'en' | 'fr'

export type AppSettings = {
  language: Language
}

const STORAGE_KEY = 'culture-quizzer-settings'
const defaults: AppSettings = { language: 'en' }

function load(): AppSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AppSettings>
    return { ...defaults, language: raw.language === 'fr' ? 'fr' : 'en' }
  } catch {
    return defaults
  }
}

let settings: AppSettings = load()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSettings(): AppSettings {
  return settings
}

export function updateSettings(patch: Partial<AppSettings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener())
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribe, getSettings)
}
