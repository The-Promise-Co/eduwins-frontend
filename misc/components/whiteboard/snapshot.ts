/**
 * User-created snapshots — the ONLY persistent whiteboard feature.
 *
 * Flow: export scene JSON + PNG preview → upload PNG via the existing R2
 * presigned-URL pipeline (`useR2`, same as chat attachments) → caller saves
 * metadata with `useSaveWhiteboardSnapshot` (server + localStorage).
 * Images only — PDFs are rejected.
 */
import { exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { WhiteboardSnapshotData } from './types';

export function formatSnapshotTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Capture the current board. Returns null when the board is empty or export
 * fails. `uploadPng` should upload the PNG file and resolve the public URL
 * (null when the upload fails — the scene JSON is still returned so the
 * snapshot can be saved without a preview).
 */
export async function captureSnapshot(
  api: ExcalidrawImperativeAPI,
  uploadPng: (file: File) => Promise<string | null>,
  author: { name: string; role: 'parent' | 'teacher' | 'child' },
): Promise<WhiteboardSnapshotData | null> {
  const elements = api.getSceneElements();
  if (elements.length === 0) return null;

  const appState = api.getAppState();
  const files = api.getFiles();

  const scene = serializeAsJSON(elements, appState, files, 'database');

  const blob = await exportToBlob({
    elements,
    appState: {
      ...appState,
      exportBackground: true,
    },
    files,
    mimeType: 'image/png',
  });

  const now = new Date();
  const formattedTime = formatSnapshotTime(now);

  let imageUrl = '';
  try {
    const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });
    imageUrl = (await uploadPng(file)) || '';
  } catch {
    // Scene still saved without preview — best effort.
  }

  return {
    id: `wb-snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `Board Snapshot (${formattedTime})`,
    scene,
    imageUrl,
    timestamp: formattedTime,
    authorName: author.name,
    authorRole: author.role,
    createdAt: now.toISOString(),
  };
}
