import { Platform } from "react-native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export interface UploadedMedia {
  path: string;
  url: string; // absolute URL usable directly in <Image>
  content_type: string;
  is_video: boolean;
  size: number;
}

/**
 * Uploads a picked media asset (image or short video) to the backend, which
 * stores it in Emergent managed object storage and returns a public URL.
 *
 * Handles the web vs native FormData body-shape split (see storage playbook).
 */
export async function uploadMedia(
  uri: string,
  fileName: string,
  mimeType: string
): Promise<UploadedMedia> {
  const form = new FormData();

  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, fileName);
  } else {
    // React Native native shape — do NOT set Content-Type manually.
    form.append("file", { uri, name: fileName, type: mimeType } as any);
  }

  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = "Upload failed";
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch {
      // plain-text / non-json error body
    }
    throw new Error(detail);
  }

  const data = await res.json();
  return {
    path: data.path,
    url: `${BACKEND_URL}${data.url}`,
    content_type: data.content_type,
    is_video: data.is_video,
    size: data.size,
  };
}
