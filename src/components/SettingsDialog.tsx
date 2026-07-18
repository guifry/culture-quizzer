import { useEffect } from 'react'
import { X } from 'lucide-react'
import { updateSettings, useSettings, type Language } from '../settings'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="settings-backdrop" onClick={onClose} role="presentation">
      <div className="settings-dialog" role="dialog" aria-modal="true" aria-label="Settings" onClick={(event) => event.stopPropagation()}>
        <div className="settings-head">
          <h2>Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="settings-field">
            <span>Language</span>
            <select value={settings.language} onChange={(event) => updateSettings({ language: event.target.value as Language })}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <p className="settings-note">For now the language applies to the Top 42 France Landmarks game only.</p>
        </form>
      </div>
    </div>
  )
}
