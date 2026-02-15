/* eslint-disable @typescript-eslint/ban-ts-comment */
import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseLangPath = join(__dirname, 'pt-BR.json');

const TARGET_LANGUAGES = [
  { fileName: 'pt-BR.json', to: 'pt' },
  { fileName: 'en-US.json', to: 'en' },
  { fileName: 'es.json', to: 'es' },
] as const;

const BATCH_SIZE = 20;
const SPLIT_TOKEN = '\n__CURSOR_TRANSLATION_SPLIT__\n';

type MissingEntry = {
  path: string;
  text: string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== '';

const setByPath = (
  target: Record<string, unknown>,
  path: string,
  value: string
) => {
  const segments = path.split('.');
  let current: Record<string, unknown> = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];

    if (!isPlainObject(next)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const collectMissingEntries = (
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  result: Record<string, unknown>,
  prefix = ''
): MissingEntry[] => {
  const missing: MissingEntry[] = [];

  for (const key of Object.keys(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue)) {
      const currentResultNode = result[key];
      const nextResultNode = isPlainObject(currentResultNode)
        ? currentResultNode
        : {};
      result[key] = nextResultNode;

      const nextTargetNode = isPlainObject(targetValue) ? targetValue : {};
      missing.push(
        ...collectMissingEntries(
          sourceValue,
          nextTargetNode,
          nextResultNode,
          fullKey
        )
      );
      continue;
    }

    if (hasValue(targetValue)) {
      result[key] = targetValue;
      continue;
    }

    const textToTranslate = String(sourceValue ?? '');
    missing.push({ path: fullKey, text: textToTranslate });
  }

  return missing;
};

const translateBatch = async (entries: MissingEntry[], to: string) => {
  if (entries.length === 0) return [];
  if (to === 'en') return entries.map((entry) => entry.text);

  const joinedText = entries.map((entry) => entry.text).join(SPLIT_TOKEN);
  const translated = await translate(joinedText, { to });
  const splitResult = translated.text.split(SPLIT_TOKEN);

  // Fallback defensivo: se o split vier inconsistente, mantém textos originais
  if (splitResult.length !== entries.length) {
    console.warn(
      `⚠️ Split mismatch for language "${to}". Using original text for this batch.`
    );
    return entries.map((entry) => entry.text);
  }

  return splitResult;
};

async function autoTranslateMissingKeys() {
  const base = JSON.parse(fs.readFileSync(baseLangPath, 'utf-8'));
  const baseObject = base as Record<string, unknown>;

  for (const targetLanguage of TARGET_LANGUAGES) {
    const targetLangPath = join(__dirname, targetLanguage.fileName);
    let target: Record<string, unknown> = {};

    if (fs.existsSync(targetLangPath)) {
      const fileContent = fs.readFileSync(targetLangPath, 'utf-8');
      try {
        target = JSON.parse(fileContent || '{}');
      } catch {
        console.error(`❌ ${targetLanguage.fileName} está malformado.`);
        process.exit(1);
      }
    }

    const filled: Record<string, unknown> = { ...target };
    const missingEntries = collectMissingEntries(baseObject, target, filled);
    const batches = chunk(missingEntries, BATCH_SIZE);

    for (const [index, batch] of batches.entries()) {
      console.warn(
        `🔁 Translating batch ${index + 1}/${batches.length} for ${targetLanguage.fileName} (${batch.length} keys)`
      );

      try {
        const translatedTexts = await translateBatch(batch, targetLanguage.to);
        batch.forEach((entry, entryIndex) => {
          setByPath(filled, entry.path, translatedTexts[entryIndex] ?? entry.text);
        });
      } catch (err) {
        console.warn(`❌ Failed batch for ${targetLanguage.fileName}`, err);
        batch.forEach((entry) => {
          setByPath(filled, entry.path, entry.text);
        });
      }
    }

    fs.writeFileSync(targetLangPath, JSON.stringify(filled, null, 2), 'utf-8');
    console.warn(
      `✅ ${targetLanguage.fileName} atualizado com traduções faltantes.`
    );
  }
}

autoTranslateMissingKeys();
