import Phaser from 'phaser';
import {character,bonus,chance,roll} from './rpg';
type Choice={label:string;next:string;skill?:'Empatia'|'Opanowanie';dc?:number};
type DialogueNode={speaker:string;text:string;choices:Choice[]};
const dialogues:Record<string,DialogueNode>={
 intro:{speaker:'Piotr Bieniasz',text:'Inspekcja trzody była w zeszłym miesiącu. Czego pan szuka?',choices:[{label:'Doktor Jerzy Drozd. Przyjechałem z Warszawy.',next:'document'}]},
 document:{speaker:'Piotr Bieniasz',text:'Doktor psychologii... A więc nie lekarz?',choices:[{label:'[OPANOWANIE 13] Zachowaj spokój.',skill:'Opanowanie',dc:13,next:'end'},{label:'Prowadzę badania społeczne. Mam dokumenty.',next:'end'}]},
 end:{speaker:'Jerzy, myśli',text:'Rozmowa dopiero się zaczyna. Muszę zdobyć zakwaterowanie.',choices:[]}
};
class SquareScene extends Phaser.Scene{
 private player!:Phaser.GameObjects.Container;
 private target?:Phaser.Math.Vector2;
 private dialog?:Phaser.GameObjects.Container;
 private note!:Phaser.GameObjects.Text;
 private questDone=false;
 constructor(){super('Square')}
 create(){
  const g=this.add.graphics();g.fillStyle(0x263e32);g.fillRect(0,0,960,540);
  const poly=(x:number,y:number,w:number,h:number,c:number)=>{g.fillStyle(c);g.fillPoints([{x,y:y-h},{x:x+w,y},{x,y:y+h},{x:x-w,y}],true)};
  for(let yy=75;yy<540;yy+=56)for(let xx=20;xx<960;xx+=112)poly(xx+(yy%112?56:0),yy,56,27,0x52584b);
  g.fillStyle(0x7a6152);g.fillRect(60,70,280,110);g.fillRect(630,60,265,130);
  this.add.text(90,88,'SŁODYCZE  WINA',{fontFamily:'Georgia',fontSize:'24px',color:'#f2e5cb'});
  this.add.text(677,99,'DOMY CHOŁÓW',{fontFamily:'Georgia',fontSize:'19px',color:'#ede1c7'});
  const drawnPerson=(color:number)=>{const c=this.add.container(0,0);const body=this.add.rectangle(0,0,19,30,color);const head=this.add.circle(0,-23,10,0xdab999);c.add([body,head]);return c;};
  this.player=drawnPerson(0x405875);this.player.setPosition(470,365);
  const piotr=drawnPerson(0x85704b).setPosition(690,310);
  piotr.setSize(65,85).setInteractive(new Phaser.Geom.Rectangle(-28,-62,56,84),Phaser.Geom.Rectangle.Contains);
  this.add.text(635,242,'Piotr Bieniasz',{fontSize:'18px',color:'#fff4da'});
  this.add.text(28,16,'PIEŚNI CHOŁÓW  |  PROTOTYP PLACU',{fontSize:'21px',color:'#f5e4bf'});
  this.note=this.add.text(28,505,'Kliknij teren, by podejść. Kliknij Piotra, by porozmawiać. [K] karta postaci.',{fontSize:'15px',color:'#f5eddc'});
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.dialog||this.questDone)return;this.target=new Phaser.Math.Vector2(p.worldX,p.worldY)});
  piotr.on('pointerdown',(p:Phaser.Input.Pointer)=>{p.event.stopPropagation();this.target=undefined;this.showDialogue('intro')});
  this.input.keyboard?.on('keydown-K',()=>{if(this.dialog){this.dialog.destroy();this.dialog=undefined;return;}const txt=['JERZY DROZD',...Object.entries(character.attributes).map(([k,v])=>k+': '+v),'',...Object.entries(character.skills).map(([k,v])=>k+': '+v+' (premia '+bonus(k as keyof typeof character.skills)+')')].join('\n');this.openOverlay(txt,[{label:'Zamknij',next:''}],()=>{this.dialog?.destroy();this.dialog=undefined})});
 }
 update(_t:number,delta:number){if(!this.target||this.dialog)return;const dx=this.target.x-this.player.x,dy=this.target.y-this.player.y;const d=Math.hypot(dx,dy);if(d<3){this.target=undefined;return;}const step=Math.min(d,170*delta/1000);this.player.x+=dx/d*step;this.player.y+=dy/d*step;}
 private openOverlay(text:string,choices:{label:string;next:string}[],onChoice:(i:number)=>void){
  const bg=this.add.rectangle(480,355,850,330,0x17251e,0.96).setStrokeStyle(2,0x9e9173);
  const content=this.add.text(86,206,text,{fontFamily:'Georgia',fontSize:'18px',color:'#efe5d4',wordWrap:{width:780},lineSpacing:5});
  const container=this.add.container(0,0,[bg,content]);this.dialog=container;
  choices.forEach((c,i)=>{const t=this.add.text(94,388+i*39,(i+1)+'. '+c.label,{fontFamily:'Georgia',fontSize:'17px',color:'#d0dcae',wordWrap:{width:755}}).setInteractive({useHandCursor:true});t.on('pointerdown',()=>onChoice(i));container.add(t)});
 }
 private showDialogue(id:string,result?:string){
  this.dialog?.destroy();const n=dialogues[id];this.openOverlay(n.speaker+'\n\n'+n.text+(result?'\n\n'+result:''),n.choices.length?n.choices:[{label:'Zakończ rozmowę',next:''}],i=>{
   const c=n.choices[i];if(!c){this.dialog?.destroy();this.dialog=undefined;this.questDone=true;this.note.setText('Rozmowa zakończona. Następne sceny powstaną w kolejnych etapach.');return;}
   let info='';if(c.skill&&c.dc){const r=roll(c.skill,c.dc);info='TEST '+c.skill+' ('+chance(c.skill,c.dc)+'%): ['+r.dice.join(' + ')+'] + '+bonus(c.skill)+' = '+r.total+' / '+c.dc+' — '+(r.success?'SUKCES':'PORAŻKA');}
   this.showDialogue(c.next,info);
  });
 }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:540,backgroundColor:'#18251d',scene:[SquareScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
