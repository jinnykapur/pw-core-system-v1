import { normalizeToken, uniqueNormalized } from "./normalize";
import type { Career, Profile } from "./types";

type Vocabulary = Map<string, number>;

function buildVocabulary(profile: Profile, careers: Career[]) {
  const tokens: string[] = [];

  tokens.push(...profile.skills, ...profile.interests);
  for (const c of careers) {
    tokens.push(...c.requiredSkills, ...c.interests, ...c.academicStrengths);
  }

  const vocab: Vocabulary = new Map();
  for (const t of uniqueNormalized(tokens)) vocab.set(t, vocab.size);
  return vocab;
}

function makeVector(vocab: Vocabulary, items: Array<{ token: string; weight: number }>) {
  const v = new Array(vocab.size).fill(0);
  for (const it of items) {
    const idx = vocab.get(normalizeToken(it.token));
    if (idx === undefined) continue;
    v[idx] += it.weight;
  }
  return v;
}

export function vectorizeProfile(profile: Profile, careers: Career[]) {
  const vocab = buildVocabulary(profile, careers);

  const items: Array<{ token: string; weight: number }> = [];

  for (const s of profile.skills) items.push({ token: s, weight: 1.0 });
  for (const i of profile.interests) items.push({ token: i, weight: 0.8 });

  return { vocab, vector: makeVector(vocab, items) };
}

export function vectorizeCareer(career: Career, vocab: Vocabulary) {
  const items: Array<{ token: string; weight: number }> = [];

  for (const s of career.requiredSkills) items.push({ token: s, weight: 1.0 });
  for (const i of career.interests) items.push({ token: i, weight: 0.8 });
  for (const a of career.academicStrengths) items.push({ token: a, weight: 0.6 });

  return makeVector(vocab, items);
}

