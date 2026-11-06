'use client';
import { useEffect, useState } from 'react';
import type { Connection } from '../lib/session-client';
export function ConnectionControls({ connection, pair, end }: { connection: Connection; pair(): Promise<string>; end(): void }) {
  const [token, setToken] = useState(''); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  async function connect() {
    setPending(true); setToken(''); setMessage('');
    try { setToken(await pair()); } catch { setMessage('Could not connect. Your drawing is still here; retry when the broker is available.'); }
    finally { setPending(false); }
  }
  return <section className="connection-section"><div className="section-label">03 / Discuss</div><h2>Bring the sketch into conversation.</h2>
    <p>Use your desktop voice chat to read this selection. The AI can look, but it cannot edit your drawing.</p>
    <div className="connection-status" role="status"><span className={`status-dot ${connection.state}`} />{connection.message}</div>
    <ConnectionActions key={connection.retryAfter ?? 0} seconds={connection.retryAfter ?? 0} pending={pending} connect={connect} end={end} />
    {token && (connection.state === 'paired' || connection.state === 'reading') && <div className="pairing"><p>The local desktop MCP helper can now read this session. Ask it to inspect your selection. Connecting another canvas revokes this pairing.</p>
      <details><summary>Advanced: separate read capability</summary><label htmlFor="read-capability">Read capability</label><input id="read-capability" type="password" readOnly value={token} autoComplete="off" spellCheck={false} />
        <p>For a separately configured read-only client. Keep it out of chat and screenshots. It expires when this session ends or loses its connection lease.</p></details></div>}
    {message && <p role="status" className="muted">{message}</p>}
    <p className="fine-print">Images already sent to ChatGPT follow its retention settings. Ending this session revokes future reads.</p>
  </section>;
}

function ConnectionActions({ seconds, pending, connect, end }: { seconds: number; pending: boolean; connect(): void; end(): void }) {
  const [retry, setRetry] = useState(seconds);
  useEffect(() => {
    if (!seconds) return;
    const deadline = Date.now() + seconds * 1000;
    const timer = setInterval(() => setRetry(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [seconds]);
  return <><div className="actions"><button className="primary" onClick={connect} disabled={pending || retry > 0}>{pending ? 'Connecting…' : 'Connect'}</button><button className="quiet" onClick={end}>End session</button></div>{retry > 0 && <p role="status">Retry in {retry} seconds. Your drawing is preserved.</p>}</>;
}
