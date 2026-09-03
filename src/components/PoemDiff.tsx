import type { CharSegment, PoemDiff, PoemDiffStats } from '../data/poems/diff'

export function DiffStats({ stats }: { stats: PoemDiffStats }) {
  return (
    <div className="poem-diff-stats" aria-label="Assessment">
      <div className="poem-accuracy">
        <strong>{stats.accuracy}%</strong>
        <span>accuracy</span>
      </div>
      <div className="poem-diff-counts">
        <span>{stats.referenceChars} chars</span>
        <span>{stats.missingLines} missing lines</span>
        <span>{stats.extraLines} extra lines</span>
        <span>{stats.changedLines} changed lines</span>
      </div>
    </div>
  )
}

function splitSegments(segments: CharSegment[]): { left: CharSegment[]; right: CharSegment[] } {
  const left: CharSegment[] = []
  const right: CharSegment[] = []
  segments.forEach((segment) => {
    // Left pane is the user's version: their additions that are absent from the reference
    // read as deletions (red). Right pane is the reference: its lines missing from the
    // submission read as insertions (green).
    if (!segment.removed) left.push(segment)
    if (!segment.added) right.push(segment)
  })
  return { left, right }
}

export function PoemDiffView({ diff }: { diff: PoemDiff }) {
  return (
    <div className="poem-diff" role="list" aria-label="Line by line comparison">
      <div className="poem-diff-head" aria-hidden="true">
        <span>Your version</span>
        <span>Reference</span>
      </div>
      {diff.lines.map((line, index) => {
        if (line.kind === 'same') {
          return (
            <div key={index} className="poem-diff-row" role="listitem">
              <div className="poem-diff-cell poem-diff-left">{line.value || '\u00A0'}</div>
              <div className="poem-diff-cell poem-diff-right">{line.value || '\u00A0'}</div>
            </div>
          )
        }
        if (line.kind === 'removed') {
          return (
            <div key={index} className="poem-diff-row" role="listitem">
              <div className="poem-diff-cell poem-diff-left poem-diff-empty">{'\u00A0'}</div>
              <div className="poem-diff-cell poem-diff-right poem-diff-added">{line.value || '\u00A0'}</div>
            </div>
          )
        }
        if (line.kind === 'added') {
          return (
            <div key={index} className="poem-diff-row" role="listitem">
              <div className="poem-diff-cell poem-diff-left poem-diff-removed">{line.value || '\u00A0'}</div>
              <div className="poem-diff-cell poem-diff-right poem-diff-empty">{'\u00A0'}</div>
            </div>
          )
        }
        const { left, right } = splitSegments(line.segments)
        return (
          <div key={index} className="poem-diff-row" role="listitem">
            <div className="poem-diff-cell poem-diff-left poem-diff-removed">
              {left.map((segment, segmentIndex) => (
                <span key={segmentIndex} className={segment.added ? 'poem-diff-del' : ''}>
                  {segment.value}
                </span>
              ))}
            </div>
            <div className="poem-diff-cell poem-diff-right poem-diff-added">
              {right.map((segment, segmentIndex) => (
                <span key={segmentIndex} className={segment.removed ? 'poem-diff-ins' : ''}>
                  {segment.value}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
