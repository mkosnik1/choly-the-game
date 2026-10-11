export const initialSkills = { Analiza: 1, Dedukcja: 2, Wiedza: 2, Empatia: 2, Perswazja: 1, Opanowanie: 1, Spostrzegawczość: 1, Intuicja: 0, Nasłuchiwanie: 0, Przetrwanie: 0, Refleks: 1, Folklor: 0 } as const;
export type Skill = keyof typeof initialSkills;
export const attributeInfo = {
  Intelekt: { description: 'Analizowanie faktów, wyciąganie wniosków i wiedza naukowa.', skills: 'Analiza, Dedukcja, Wiedza' },
  Psychika: { description: 'Rozumienie emocji, perswazja i zachowanie opanowania.', skills: 'Empatia, Perswazja, Opanowanie' },
  Percepcja: { description: 'Obserwowanie szczegółów, intuicja i nasłuchiwanie.', skills: 'Spostrzegawczość, Intuicja, Nasłuchiwanie' },
  Instynkt: { description: 'Przetrwanie, refleks i rozumienie lokalnych wierzeń.', skills: 'Przetrwanie, Refleks, Folklor' }
} as const;
export type Attribute = keyof typeof attributeInfo;
export type Attributes = Record<Attribute, number>;
export type CharacterBuild = { readonly name: 'Jerzy Drozd'; readonly attributes: Readonly<Attributes>; readonly skills: Readonly<Record<Skill, number>> };
export const presets: Record<string, Attributes> = {
  Psycholog: { Intelekt: 4, Psychika: 3, Percepcja: 3, Instynkt: 2 },
  Analityk: { Intelekt: 6, Psychika: 3, Percepcja: 2, Instynkt: 1 },
  Obserwator: { Intelekt: 2, Psychika: 3, Percepcja: 5, Instynkt: 2 }
};
export function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function remainingPoints(attributes: Attributes) { return 12 - Object.values(attributes).reduce((a, b) => a + b, 0); }
export function validAttributes(value: unknown): value is Attributes {
  return isRecord(value) && Object.keys(value).length === 4 && Object.keys(attributeInfo).every(key => Number.isInteger(value[key]) && Number(value[key]) >= 1 && Number(value[key]) <= 6) && Object.values(value).reduce<number>((a, b) => a + Number(b), 0) === 12;
}
export function validSkills(value: unknown): value is Record<Skill, number> {
  return isRecord(value) && Object.keys(value).length === 12 && Object.keys(initialSkills).every(key => Number.isInteger(value[key]) && Number(value[key]) >= 0 && Number(value[key]) <= 5);
}
export function adjustAttribute(attributes: Attributes, key: Attribute, change: -1 | 1): Attributes {
  if (attributes[key] + change < 1 || attributes[key] + change > 6 || (change === 1 && remainingPoints(attributes) <= 0)) return { ...attributes };
  return { ...attributes, [key]: attributes[key] + change };
}
export function createCharacter(attributes: Attributes): CharacterBuild {
  if (!validAttributes(attributes)) throw new Error('Rozdziel dokładnie 12 punktów; każdy atrybut musi mieć wartość 1–6.');
  return Object.freeze({ name: 'Jerzy Drozd', attributes: Object.freeze({ ...attributes }), skills: Object.freeze({ ...initialSkills }) });
}
