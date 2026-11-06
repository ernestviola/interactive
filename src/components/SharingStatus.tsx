'use client';
import type { Connection } from '../lib/session-client';
import type { Drawing } from '../lib/drawing/state';
export function SharingStatus({ drawing, connection }: { drawing: Drawing; connection: Connection }) {
  const sent = connection.lastRead;
  if (!sent) return <p className="sharing-status muted" role="status">No snapshot sent in this session.</p>;
  const changed = drawing.revision !== sent.drawingRevision || drawing.selectionRevision !== sent.selectionRevision;
  return <section className="sharing-status" aria-label="Sharing status" role="status"><strong>Last sent to AI client</strong><time dateTime={sent.capturedAt}>{new Date(sent.capturedAt).toLocaleString()}</time><span className="snapshot-identity">{sent.snapshotId}</span><p>{changed ? 'Changes since last send. The preview is the current eligible region; the earlier snapshot stays unchanged.' : 'The current drawing and selection match this snapshot’s revisions.'}</p><p className="fine-print">Sent means delivered to the client connection. It does not confirm AI understanding or a spoken reply.</p></section>;
}
