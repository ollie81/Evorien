"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { clearAllMemory, deleteMemory, setMemoryEnabled } from "@/lib/ai/memory";

export async function deleteMemoryAction(memoryId: string) {
  const userId = await requireUserId();
  await deleteMemory(userId, memoryId);
  revalidatePath("/ai/memory");
}

export async function clearAllMemoryAction() {
  const userId = await requireUserId();
  await clearAllMemory(userId);
  revalidatePath("/ai/memory");
}

export async function setMemoryEnabledAction(enabled: boolean) {
  const userId = await requireUserId();
  await setMemoryEnabled(userId, enabled);
  revalidatePath("/ai/memory");
}
