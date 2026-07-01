import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { HistoryDate } from '../data/types'

export function EventSummaryDialog({ entry, onClose }: { entry: HistoryDate; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="summary-overlay" role="dialog" aria-modal="true" aria-label={`About ${entry.event}`} onClick={onClose}>
      <div className="summary-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="summary-dialog-head">
          <div>
            <span className="summary-date">{entry.date}</span>
            <h2>{entry.event}</h2>
            <p className="summary-location">{entry.location}</p>
          </div>
          <button className="summary-close" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="summary-body" tabIndex={0}>
          <p>{entry.summary}</p>
        </div>
      </div>
    </div>
  )
}
