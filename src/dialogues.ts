// Dialogi adaptacyjne prototypu, nie cytaty z powieści.
type Choice={label:string;next:string;skill?:'Empatia'|'Opanowanie';dc?:number};
type DialogueNode={speaker:string;text:string;choices:Choice[]};
export const dialogues:Record<string,DialogueNode>={
 intro:{speaker:'Piotr Bieniasz',text:'Inspekcja trzody była w zeszłym miesiącu. Czego pan szuka?',choices:[{label:'Doktor Jerzy Drozd. Przyjechałem z Warszawy.',next:'document'}]},
 document:{speaker:'Piotr Bieniasz',text:'Doktor psychologii... A więc nie lekarz?',choices:[{label:'[OPANOWANIE 13] Zachowaj spokój.',skill:'Opanowanie',dc:13,next:'end'},{label:'Prowadzę badania społeczne. Mam dokumenty.',next:'end'}]},
 end:{speaker:'Jerzy, myśli',text:'Rozmowa dopiero się zaczyna. Muszę zdobyć zakwaterowanie.',choices:[]}
};
