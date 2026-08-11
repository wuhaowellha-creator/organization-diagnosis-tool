import { eq } from "drizzle-orm";
import { aiProviderSettings, type AiProvider } from "../../db/schema";
import { getDb } from "../../db";
import { getDefaultAiProvider, getAiProviderOptions } from "./providers";

export type AiProviderSetting = {
  model: string;
  provider: AiProvider;
};

function getDefaultModel(provider: AiProvider) {
  return getAiProviderOptions().find((option) => option.value === provider)?.default_model ?? "";
}

export async function getAiProviderSetting(userId: string): Promise<AiProviderSetting> {
  const rows = await getDb()
    .select({ model: aiProviderSettings.model, provider: aiProviderSettings.provider })
    .from(aiProviderSettings)
    .where(eq(aiProviderSettings.userId, userId))
    .limit(1);
  const saved = rows[0];

  if (saved) {
    return { model: saved.model || getDefaultModel(saved.provider), provider: saved.provider };
  }

  const provider = getDefaultAiProvider();
  return { model: getDefaultModel(provider), provider };
}

export async function saveAiProviderSetting(userId: string, input: AiProviderSetting) {
  const now = new Date().toISOString();
  await getDb()
    .insert(aiProviderSettings)
    .values({
      createdAt: now,
      model: input.model,
      provider: input.provider,
      updatedAt: now,
      userId
    })
    .onConflictDoUpdate({
      set: { model: input.model, provider: input.provider, updatedAt: now },
      target: aiProviderSettings.userId
    });

  return input;
}
