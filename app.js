
const {createApp}=Vue;

createApp({
data(){
return{
rows:[
{id:"melee",name:"Mêlée",icon:"⚔️"},
{id:"range",name:"Distance",icon:"🏹"},
{id:"siege",name:"Siège",icon:"🏰"}
],
weatherButtons:[
{id:"cold",icon:"❄️",name:"Froid"},
{id:"fog",icon:"☁️",name:"Brouillard"},
{id:"rain",icon:"🌧️",name:"Pluie"},
{id:"tsunami",icon:"🌊",name:"Tsunami"}
],
weather:{cold:false,fog:false,rain:false,tsunami:false},powerPresets:[0,1,2,3,4,5,6,7,8,10,15],playerNames:["Joueur 1","Joueur 2"],showLabelModal:false,labelModal:{player1:"Joueur 1",player2:"Joueur 2"},newCard:{player:1,row:"melee",value:1,type:"normal"},
players:[],
rowElements:{},
rowWidths:{}
}
},
created(){
for(let i=1;i<=2;i++){
this.players.push({
id:i,
melee:{cards:[],horn:false},
range:{cards:[],horn:false},
siege:{cards:[],horn:false}
});
}
},
mounted(){
  window.addEventListener('resize', this.updateRowWidths);
  window.addEventListener('keydown', this.handleKeydown);
  this.$nextTick(this.updateRowWidths);
},
unmounted(){
  window.removeEventListener('resize', this.updateRowWidths);
  window.removeEventListener('keydown', this.handleKeydown);
},
methods:{

rowsForPlayer(){
    return [...this.rows]; // Mêlée, Distance, Siège
},

icon(c){
return {hero:"⭐",morale:"💪",bond:"🤝",jaskier:"🎭"}[c.type]||"";
},
toggleWeather(id){this.weather[id]=!this.weather[id]},
clearWeather(){Object.keys(this.weather).forEach(k=>this.weather[k]=false)},
resetGame(){
  this.clearWeather();
  this.players.forEach(p=>{
    p.melee.cards=[];
    p.melee.horn=false;
    p.range.cards=[];
    p.range.horn=false;
    p.siege.cards=[];
    p.siege.horn=false;
  });
  this.newCard = {player:1,row:'melee',value:1,type:'normal'};
  this.$nextTick(this.updateRowWidths);
},
openLabelModal(){
  this.labelModal.player1 = this.playerNames[0];
  this.labelModal.player2 = this.playerNames[1];
  this.showLabelModal = true;
},
closeLabelModal(){
  this.showLabelModal = false;
},
saveLabelModal(){
  const newName1 = this.labelModal.player1.trim().slice(0,20);
  const newName2 = this.labelModal.player2.trim().slice(0,20);
  if(newName1.length > 0){
    this.playerNames[0] = newName1;
  }
  if(newName2.length > 0){
    this.playerNames[1] = newName2;
  }
  this.closeLabelModal();
},
handleKeydown(event){
  if(event.key === 'Escape' && this.showLabelModal){
    this.closeLabelModal();
  }
},
addCard(){
const p=this.players[this.newCard.player-1];
p[this.newCard.row].cards.push({value:this.newCard.value,type:this.newCard.type});
this.newCard.value=this.newCard.type==="jaskier"?2:1;
this.$nextTick(this.updateRowWidths);
},
removeCard(p,row,i){p[row].cards.splice(i,1); this.$nextTick(this.updateRowWidths);},
weatherOnRow(row){
return (row==="melee"&&this.weather.cold)||
(row==="range"&&(this.weather.fog||this.weather.tsunami))||
(row==="siege"&&(this.weather.rain||this.weather.tsunami));
},
isWeatherActiveRow(row){
return (row==="melee"&&this.weather.cold)||
((row==="range"&&(this.weather.fog||this.weather.tsunami))||
(row==="siege"&&(this.weather.rain||this.weather.tsunami)));
},
hasJaskier(p,row){
return p[row].cards.some(c=>c.type==="jaskier");
},
displayedCards(p,row){
  const cards = p[row].cards.map((card,index)=>({card,index}));
  const specialCards = cards.filter(item=>item.card.type!== "normal");
  const normalCards = cards.filter(item=>item.card.type=== "normal");
  return [...specialCards, ...normalCards];
},
setCardRowRef(el, playerId, rowId){
  if(!el) return;
  this.rowElements[`${playerId}-${rowId}`] = el;
  this.rowWidths[`${playerId}-${rowId}`] = el.clientWidth;
},
updateRowWidths(){
  Object.entries(this.rowElements).forEach(([key, el])=>{
    if(el && el.clientWidth){
      this.rowWidths[key] = el.clientWidth;
    }
  });
},
cardPosition(index, count, p, row){
  const key = `${p.id}-${row}`;
  const available = this.rowWidths[key] || 0;
  const baseWidth = 50;
  const baseHeight = 70;
  let cardWidth = baseWidth;
  let cardHeight = baseHeight;
  let spacing = baseWidth;
  if(count > 1 && available > 0){
    const needed = count * baseWidth;
    if(needed > available){
      cardWidth = Math.max(28, Math.floor(available / count));
      cardHeight = Math.round(cardWidth * baseHeight / baseWidth);
      spacing = (available - cardWidth) / (count - 1);
    }
  }
  const scale = Math.max(0.56, cardWidth / baseWidth);
  return {
    position: 'absolute',
    top: `${Math.round((70 - cardHeight) / 2)}px`,
    left: `${Math.round(index * spacing)}px`,
    width: `${cardWidth}px`,
    height: `${cardHeight}px`,
    zIndex: index + 1,
    '--card-scale': scale
  };
},
effective(card,p,row){
let v=card.value;

// 1 météo
if(card.type!=="hero" && this.weatherOnRow(row))
    v=1;

// 2 lien serré
if(card.type==="bond"){
    const n=p[row].cards.filter(c=>c.type==="bond"&&c.value===card.value).length;
    if(n>1) v*=n;
}

// 3 moral
const moraleCards=p[row].cards.filter(c=>c.type==="morale").length;
if(card.type!=="hero" && moraleCards>0){
    v+=moraleCards-(card.type==="morale"?1:0);
}

// 4 cor / Jaskier line doubling
const lineDouble = (p[row].horn || this.hasJaskier(p,row)) && card.type!=="hero" && card.type!=="jaskier";
if(lineDouble){
    v*=2;
}

// 5 Jaskier doubled by horn only
if(card.type==="jaskier" && p[row].horn){
    v*=2;
}

return v;
},
rowTotal(p,row){
return p[row].cards.reduce((s,c)=>s+this.effective(c,p,row),0);
},
playerTotal(p){
return this.rowTotal(p,"melee")+this.rowTotal(p,"range")+this.rowTotal(p,"siege");
}
}
}).mount("#app");
