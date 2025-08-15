// Utility functions for Camp Network API calls

export async function generateImage(model: "bear" | "fox" | "goat", jwt: string) {
  const res = await fetch(`${import.meta.env.VITE_ORIGIN_API}/auth/merv/generate-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model_type: model }),
  });
  const { data } = await res.json();
  return data.images as { id: string; url: string }[];
}

export async function getCredits(jwt: string) {
  const res = await fetch(`${import.meta.env.VITE_ORIGIN_API}/auth/merv/check-generations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const { data } = await res.json();
  return data.generations_left as number;
}

export async function assignImage(imageId: string, jwt: string) {
  await fetch(`${import.meta.env.VITE_ORIGIN_API}/auth/merv/assign-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_id: imageId }),
  });
}

export interface UploadedMemory {
  id: string;
  title: string;
  description: string;
  preview: string;
  minted: boolean;
  mintedAt?: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  metadata?: {
    name: string;
    description: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export const saveMemoryToStorage = (memory: UploadedMemory) => {
  try {
    const memories = JSON.parse(localStorage.getItem('sobro-memories') || '[]');
    memories.push(memory);
    localStorage.setItem('sobro-memories', JSON.stringify(memories));
    return true;
  } catch (error) {
    console.error('Error saving memory:', error);
    return false;
  }
};

export const getMemoriesFromStorage = (): UploadedMemory[] => {
  try {
    return JSON.parse(localStorage.getItem('sobro-memories') || '[]');
  } catch (error) {
    console.error('Error loading memories:', error);
    return [];
  }
};

export const clearMemoriesFromStorage = () => {
  try {
    localStorage.removeItem('sobro-memories');
    return true;
  } catch (error) {
    console.error('Error clearing memories:', error);
    return false;
  }
};