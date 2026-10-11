export const character = {
  name: 'Jerzy Drozd',
  attributes: { Intelekt: 4, Psychika: 3, Percepcja: 3, Instynkt: 1 },
  skills: { Analiza: 1, Dedukcja: 2, Wiedza: 2, Empatia: 2, Perswazja: 1, Opanowanie: 1, Spostrzegawczość: 1, Intuicja: 0, Nasłuchiwanie: 0, Przetrwanie: 0, Refleks: 1, Folklor: 0 }
} as const;
export type Attribute = keyof typeof character.attributes;
export type Skill = keyof typeof character.skills;
export const skillAttribute: Record<Skill,Attribute> = {Analiza:'Intelekt',Dedukcja:'Intelekt',Wiedza:'Intelekt',Empatia:'Psychika',Perswazja:'Psychika',Opanowanie:'Psychika',Spostrzegawczość:'Percepcja',Intuicja:'Percepcja',Nasłuchiwanie:'Percepcja',Przetrwanie:'Instynkt',Refleks:'Instynkt',Folklor:'Instynkt'};
export function bonus(skill:Skill):number { return character.attributes[skillAttribute[skill]] + character.skills[skill]; }
export function chance(skill:Skill, dc:number):number { let success=0; for(let a=1;a<=6;a++) for(let b=1;b<=6;b++) if(a+b+bonus(skill)>=dc) success++;return Math.round(success/36*1000)/10; }
export function roll(skill:Skill,dc:number, random:()=>number=Math.random) {const dice:[number,number]=[Math.floor(random()*6)+1,Math.floor(random()*6)+1];const total=dice[0]+dice[1]+bonus(skill);return {dice,total,dc,success:total>=dc,exceptional:total>=dc+5,skill};}
