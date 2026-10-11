import Phaser from 'phaser';
import {character,bonus,chance,roll} from './rpg';
import { dialogues } from './dialogues';
import { buildings, findPath, type Point } from './navigation';
class SquareScene extends Phaser.Scene{
 private player!:Phaser.GameObjects.Container;
 private path:Point[]=[];
 private talkPending=false;
 private checkResults=new Map<string,string>();
 private dialog?:Phaser.GameObjects.Container;
 private note!:Phaser.GameObjects.Text;

 constructor(){super('Square')}
 create(){
  const g=this.add.graphics();g.fillStyle(0x263e32);g.fillRect(0,0,960,540);
  const poly=(x:number,y:number,w:number,h:number,c:number)=>{g.fillStyle(c);g.fillPoints([{x,y:y-h},{x:x+w,y},{x,y:y+h},{x:x-w,y}],true)};
  for(let yy=75;yy<540;yy+=56)for(let xx=20;xx<960;xx+=112)poly(xx+(yy%112?56:0),yy,56,27,0x52584b);
  g.fillStyle(0x7a6152);for(const r of buildings)g.fillRect(r.x,r.y,r.width,r.height);
  this.add.text(90,88,'SŁODYCZE  WINA',{fontFamily:'Georgia',fontSize:'24px',color:'#f2e5cb'});
  this.add.text(677,99,'DOMY CHOŁÓW',{fontFamily:'Georgia',fontSize:'19px',color:'#ede1c7'});
  const drawnPerson=(color:number)=>{const c=this.add.container(0,0);const body=this.add.rectangle(0,0,19,30,color);const head=this.add.circle(0,-23,10,0xdab999);c.add([body,head]);return c;};
  this.player=drawnPerson(0x405875);this.player.setPosition(470,365);
  const piotr=drawnPerson(0x85704b).setPosition(690,310).setDepth(310);
  piotr.setSize(65,85).setInteractive({useHandCursor:true});
  this.add.text(635,242,'Piotr Bieniasz',{fontSize:'18px',color:'#fff4da'});
  this.add.text(28,16,'PIEŚNI CHOŁÓW  |  PROTOTYP PLACU',{fontSize:'21px',color:'#f5e4bf'});
  this.note=this.add.text(28,505,'Kliknij teren, by podejść. Kliknij Piotra, by porozmawiać. [K] karta postaci.',{fontSize:'15px',color:'#f5eddc'});
  this.input.on('pointerdown',(p:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{if(this.dialog||objects.length)return;this.talkPending=false;const path=findPath(this.player,{x:p.worldX,y:p.worldY});if(path.length)this.path=path;else this.note.setText('Nie można tam wejść. Wybierz dostępny teren.');});
  piotr.on('pointerdown',()=>{if(this.dialog)return;this.path=findPath(this.player,{x:650,y:330});this.talkPending=true;});
  this.input.keyboard?.on('keydown-K',()=>{if(this.dialog){this.dialog.destroy();this.dialog=undefined;return;}const txt=['JERZY DROZD',...Object.entries(character.attributes).map(([k,v])=>k+': '+v),'',...Object.entries(character.skills).map(([k,v])=>k+': '+v+' (premia '+bonus(k as keyof typeof character.skills)+')')].join('\n');this.path=[];this.talkPending=false;this.openOverlay(txt,[{label:'Zamknij',next:''}],()=>{this.dialog?.destroy();this.dialog=undefined})});
 }
 update(_t:number,delta:number){
  if(this.dialog)return;
  let remaining=170*Math.min(delta,100)/1000;
  while(this.path.length&&remaining>0){const target=this.path[0];const dx=target.x-this.player.x,dy=target.y-this.player.y,d=Math.hypot(dx,dy);if(d<=remaining){this.player.setPosition(target.x,target.y);this.path.shift();remaining-=d;}else{this.player.x+=dx/d*remaining;this.player.y+=dy/d*remaining;remaining=0;}}
  this.player.setDepth(this.player.y);
  if(this.talkPending&&!this.path.length){this.talkPending=false;this.showDialogue('intro');}
 }
 private openOverlay(text:string,choices:{label:string;next:string}[],onChoice:(i:number)=>void){
  const card=text.startsWith('JERZY DROZD');
  const bg=this.add.rectangle(480,card?270:355,850,card?500:330,0x17251e,0.96).setStrokeStyle(2,0x9e9173);
  const content=this.add.text(86,card?48:206,text,{fontFamily:'Georgia',fontSize:card?'16px':'18px',color:'#efe5d4',wordWrap:{width:780},lineSpacing:card?1:5});
  const container=this.add.container(0,0,[bg,content]);this.dialog=container.setDepth(1000);
  choices.forEach((c,i)=>{const t=this.add.text(94,(card?480:388)+i*39,(i+1)+'. '+c.label,{fontFamily:'Georgia',fontSize:'17px',color:'#d0dcae',wordWrap:{width:755}}).setInteractive({useHandCursor:true});t.on('pointerdown',()=>onChoice(i));container.add(t)});
 }
 private showDialogue(id:string,result?:string){
  this.dialog?.destroy();const n=dialogues[id];this.openOverlay(n.speaker+' (dialog adaptacyjny)\n\n'+n.text+(result?'\n\n'+result:''),n.choices.length?n.choices.map((c,i)=>({...c,label:c.label+(c.skill&&c.dc?(this.checkResults.has(id+':'+i)?' — wynik zapisany':' — szansa '+chance(c.skill,c.dc)+'%'):'' )})):[{label:'Zakończ rozmowę',next:''}],i=>{
   const c=n.choices[i];if(!c){this.dialog?.destroy();this.dialog=undefined;this.note.setText('Rozmowa zakończona. Możesz dalej zwiedzać plac. [K] karta postaci.');return;}
   let info='';if(c.skill&&c.dc){const key=id+':'+i;const previous=this.checkResults.get(key);if(previous){this.showDialogue(c.next,previous);return;}const r=roll(c.skill,c.dc);info='TEST '+c.skill+' ('+chance(c.skill,c.dc)+'%): ['+r.dice.join(' + ')+'] + '+bonus(c.skill)+' = '+r.total+' / '+c.dc+' — '+(r.exceptional?'SUKCES WYJĄTKOWY':r.success?'SUKCES':'PORAŻKA');this.checkResults.set(key,info);}
   this.showDialogue(c.next,info);
  });
 }
}
export const game = new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:540,backgroundColor:'#18251d',scene:[SquareScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
