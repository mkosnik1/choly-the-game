import { describe, it, expect } from 'vitest';
import { bonus, chance, roll, character, skillAttribute, type Skill } from '../src/rpg';
import { canWalk, findPath } from '../src/navigation';
describe('RPG 2k6', () => {
  it('maps all twelve skills to starting attributes', () => {
    expect(Object.keys(character.skills)).toHaveLength(12);
    for (const skill of Object.keys(character.skills) as Skill[]) expect(bonus(skill)).toBe(character.attributes[skillAttribute[skill]] + character.skills[skill]);
    expect(bonus('Opanowanie')).toBe(4);
  });
  it('enumerates all 36 outcomes with inclusive success and exceptional thresholds', () => {
    let successes = 0;
    for (let a=1;a<=6;a++) for(let b=1;b<=6;b++) {
      const samples = [(a-1)/6,(b-1)/6];
      const result = roll('Opanowanie',13,()=>samples.shift()!);
      expect(result.dice).toEqual([a,b]);
      expect(result.total).toBe(a+b+4);
      expect(result.success).toBe(a+b+4>=13);
      expect(result.exceptional).toBe(a+b+4>=18);
      if(result.success)successes++;
    }
    expect(successes).toBe(10);
    expect(chance('Opanowanie',13)).toBe(27.8);
    expect(roll('Dedukcja',13,()=>0.999).exceptional).toBe(true);
  });
  it('applies situational modifiers consistently',()=>{
    expect(bonus('Opanowanie',2)).toBe(6);
    expect(roll('Opanowanie',13,()=>0.5,2).total).toBe(14);
    expect(chance('Opanowanie',13,2)).toBe(58.3);
    expect(roll('Opanowanie',13,()=>0.999,2).exceptional).toBe(true);
    expect(roll('Opanowanie',13,()=>0.999,1).exceptional).toBe(false);
  });
  it('has no automatic success or failure',()=>{
    expect(roll('Dedukcja',7,()=>0).success).toBe(true);
    expect(roll('Folklor',22,()=>0.999).success).toBe(false);
    expect(chance('Dedukcja',7)).toBe(100);
    expect(chance('Folklor',22)).toBe(0);
  });
});
describe('square navigation',()=>{
  it('routes around a building without crossing any collision rectangle',()=>{
    const start={x:30,y:120},end={x:400,y:120};
    expect(canWalk(start,end)).toBe(false);
    const path=findPath(start,end);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual(end);
    let previous=start;for(const point of path){expect(canWalk(previous,point)).toBe(true);previous=point;}
  });
  it('rejects building clicks and clamps targets to the square',()=>{
    expect(findPath({x:470,y:365},{x:100,y:100})).toEqual([]);
    expect(findPath({x:470,y:365},{x:2000,y:2000}).at(-1)).toEqual({x:940,y:478});
  });
});
