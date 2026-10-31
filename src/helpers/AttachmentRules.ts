// The rules for what customers can attach to a service request.
// Kept separate from the screen so the checks are easy to test and change.
import type { ImagePickerAsset } from 'expo-image-picker';

export const MAX_ATTACHMENTS = 5;
export const MAX_PHOTO_MB = 10;
export const MAX_VIDEO_MB = 50;
export const MAX_VIDEO_SECONDS = 60;

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

export type Attachment = {
  uri: string;
  kind: 'photo' | 'video';
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number;
};

// Turns what the picker gives us into our own simpler shape.
export function toAttachment(asset: ImagePickerAsset): Attachment {
  const kind = asset.type === 'video' ? 'video' : 'photo';
  return {
    uri: asset.uri,
    kind,
    fileName: asset.fileName ?? (kind === 'video' ? 'video' : 'photo'),
    mimeType: asset.mimeType,
    sizeBytes: asset.fileSize,
    durationMs: asset.duration ?? undefined,
  };
}

// Returns a message if the file isn't allowed, or null if it's fine.
// Some phones don't report size or type, so we only check what we're given.
export function checkAttachment(file: Attachment): string | null {
  const mb = file.sizeBytes ? file.sizeBytes / (1024 * 1024) : 0;

  if (file.kind === 'photo') {
    if (file.mimeType && !PHOTO_TYPES.includes(file.mimeType))
      return `${file.fileName}: photos must be JPG, PNG, HEIC, or WEBP.`;
    if (mb > MAX_PHOTO_MB) return `${file.fileName}: photos must be under ${MAX_PHOTO_MB} MB.`;
  } else {
    if (file.mimeType && !VIDEO_TYPES.includes(file.mimeType))
      return `${file.fileName}: videos must be MP4 or MOV.`;
    if (mb > MAX_VIDEO_MB) return `${file.fileName}: videos must be under ${MAX_VIDEO_MB} MB.`;
    if (file.durationMs && file.durationMs > MAX_VIDEO_SECONDS * 1000)
      return `${file.fileName}: videos must be ${MAX_VIDEO_SECONDS} seconds or shorter.`;
  }
  return null;
}

// Same file picked twice? On web every pick gets a new uri, so also compare name + size.
function isSameFile(a: Attachment, b: Attachment) {
  return a.uri === b.uri || (a.fileName === b.fileName && a.sizeBytes !== undefined && a.sizeBytes === b.sizeBytes);
}

// Adds new picks to the current list. Bad files and anything past the limit
// are skipped, and we explain why instead of failing silently.
export function addAttachments(current: Attachment[], picked: Attachment[]) {
  const accepted: Attachment[] = [];
  const problems: string[] = [];

  for (const file of picked) {
    if ([...current, ...accepted].some((f) => isSameFile(f, file))) continue;
    const problem = checkAttachment(file);
    if (problem) problems.push(problem);
    else if (current.length + accepted.length >= MAX_ATTACHMENTS)
      problems.push(`You can add up to ${MAX_ATTACHMENTS} photos or videos.`);
    else accepted.push(file);
  }

  return { list: [...current, ...accepted], problems: [...new Set(problems)] };
}

// "2.4 MB", "640 KB" -- shown under each thumbnail.
export function formatSize(bytes?: number) {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// 24000 ms -> "0:24"
export function formatDuration(ms?: number) {
  if (!ms) return '';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
