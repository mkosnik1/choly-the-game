import { createCharacter, presets } from './state/character';
import type { CharacterBuild, Attribute, Skill } from './state/character';
export type { Attribute, Skill } from './state/character';
export const character = createCharacter(presets.Psycholog);
export const skillAttribute: Record<Skill,Attribute> = {Analiza:'Intelekt',Dedukcja:'Intelekt',Wiedza:'Intelekt',Empatia:'Psychika',Perswazja:'Psychika',Opanowanie:'Psychika',Spostrzegawczość:'Percepcja',Intuicja:'Percepcja',Nasłuchiwanie:'Percepcja',Przetrwanie:'Instynkt',Refleks:'Instynkt',Folklor:'Instynkt'};
export function bonus(skill:Skill, modifiers=0, build:CharacterBuild=character):number { return build.attributes[skillAttribute[skill]] + build.skills[skill] + modifiers; }
export function chance(skill:Skill, dc:number, modifiers=0, build:CharacterBuild=character):number { let success=0; for(let a=1;a<=6;a++) for(let b=1;b<=6;b++) if(a+b+bonus(skill, modifiers, build)>=dc) success++;return Math.round(success/36*1000)/10; }
export function roll(skill:Skill,dc:number, random:()=>number=Math.random, modifiers=0, build:CharacterBuild=character) {const dice:[number,number]=[Math.floor(random()*6)+1,Math.floor(random()*6)+1];const premia=bonus(skill, modifiers, build);const total=dice[0]+dice[1]+premia;return {dice,total,dc,bonus:premia,modifiers,success:total>=dc,exceptional:total>=dc+5,skill};}

export type RollResult = ReturnType<typeof roll>;
