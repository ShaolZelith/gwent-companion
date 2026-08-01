
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
weather:{cold:false,fog:false,rain:false,tsunami:false},powerPresets:[0,1,2,3,4,5,6,7,8,9,10,15],playerNames:["Joueur 1","Joueur 2"],showLabelModal:false,labelModal:{player1:"Joueur 1",player2:"Joueur 2"},coinResult:null,isFlipping:false,factions:[
  {id:"nilfgaard",name:"Nilfgaard"},
  {id:"northern",name:"Royaumes du Nord"},
  {id:"skellige",name:"Skellige"},
  {id:"scoiatel",name:"Scoia'tel"},
  {id:"monsters",name:"Monstres"}
],factionSelections:[0,1],newCard:{player:1,row:"melee",value:1,type:"normal",heroBonus:"none"},
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
  this.$nextTick(()=>{
    this.updateRowWidths();
    this.openLabelModal();
  });
},
unmounted(){
  window.removeEventListener('resize', this.updateRowWidths);
  window.removeEventListener('keydown', this.handleKeydown);
},
methods:{

selectNewCardType(type){
  this.newCard.type = type;
  if(type !== 'hero'){
    this.newCard.heroBonus = 'none';
  }
},
selectHeroBonus(bonus){
  this.newCard.heroBonus = bonus;
},
rowsForPlayer(){
    return [...this.rows]; // Mêlée, Distance, Siège
},

cardIcons(c){
  if(c.type === 'hero'){
    return c.heroBonus === 'morale' ? ['⭐','💪'] : ['⭐'];
  }
  return [{hero:'⭐',morale:'💪',bond:'🤝',jaskier:'🎭',vache:'🐄'}[c.type] || ''];
},
toggleWeather(id){this.weather[id]=!this.weather[id]; this.$nextTick(()=>setTimeout(this.updateRowWidths, 50))},
clearWeather(){Object.keys(this.weather).forEach(k=>this.weather[k]=false); this.$nextTick(()=>setTimeout(this.updateRowWidths, 50))},
flipPlayerToken(){
  if(this.isFlipping) return;
  this.isFlipping = true;
  this.coinResult = null;
  setTimeout(()=>{
    this.coinResult = Math.random() < 0.5 ? 1 : 2;
    this.isFlipping = false;
  }, 520);
},
cycleFaction(slot){
  const next = (this.factionSelections[slot] + 1) % this.factions.length;
  this.factionSelections.splice(slot, 1, next);
},
factionClass(playerId){
  const slot = playerId - 1;
  const selectedIndex = this.factionSelections[slot] || 0;
  return `faction-board-${this.factions[selectedIndex].id}`;
},
factionCardClass(playerId){
  const slot = playerId - 1;
  const selectedIndex = this.factionSelections[slot] || 0;
  return `faction-card-${this.factions[selectedIndex].id}`;
},
factionScoreClass(playerId){
  const slot = playerId - 1;
  const selectedIndex = this.factionSelections[slot] || 0;
  return `score-secondary-${this.factions[selectedIndex].id}`;
},
isMonsterFaction(playerId){
  const slot = playerId - 1;
  const selectedIndex = this.factionSelections[slot] || 0;
  return this.factions[selectedIndex]?.id === 'monsters';
},
monsterUnitCandidates(playerId){
  const player = this.players[playerId - 1];
  if(!player) return [];
  return ['melee','range','siege'].flatMap(row =>
    player[row].cards
      .map((card, index) => ({row, card, index}))
      .filter(item => item.card.type !== 'hero' && item.card.type !== 'vache')
  );
},
hasMonsterUnitCandidates(playerId){
  return this.monsterUnitCandidates(playerId).length > 0;
},
resetToRandomMonsterCard(playerId){
  if(!this.isMonsterFaction(playerId)) return;

  const bothMonsters = this.isMonsterFaction(1) && this.isMonsterFaction(2);

  // If both players are Monsters, clicking either button makes BOTH players draw a random unit
  if(bothMonsters){
    const savedChoices = [];
    for(let pid = 1; pid <= 2; pid++){
      const candidates = this.monsterUnitCandidates(pid);
      if(candidates.length === 0) continue;
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      savedChoices.push({ playerId: pid, card: {...choice.card}, row: choice.row });
    }
    if(savedChoices.length === 0) return;
    this.resetGame();
    savedChoices.forEach(sc => {
      const player = this.players[sc.playerId - 1];
      player[sc.row].cards.push(sc.card);
    });
    this.$nextTick(this.updateRowWidths);
    return;
  }

  // Default behaviour: only affect the clicked player
  const candidates = this.monsterUnitCandidates(playerId);
  if(candidates.length === 0) return;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const savedCard = {...choice.card};
  const savedRow = choice.row;

  this.resetGame();
  const player = this.players[playerId - 1];
  player[savedRow].cards.push(savedCard);
  this.$nextTick(this.updateRowWidths);
},
resetGame(){
  this.clearWeather();
  const transformedVacheCards = [];

  this.players.forEach(p=>{
    ['melee','range','siege'].forEach(row => {
      p[row].cards.forEach(card => {
        if(card.type === 'vache'){
          transformedVacheCards.push({playerId: p.id, card: {value: 8, type: 'normal'}});
        }
      });
    });

    p.melee.cards=[];
    p.melee.horn=false;
    p.range.cards=[];
    p.range.horn=false;
    p.siege.cards=[];
    p.siege.horn=false;
  });

  transformedVacheCards.forEach(({playerId, card}) => {
    this.players[playerId - 1].melee.cards.push(card);
  });

  this.newCard = {player:1,row:'melee',value:1,type:'normal',heroBonus:'none'};
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
const cardValue = this.newCard.type === 'vache' ? 0 : this.newCard.value;
const card = this.newCard.type === 'hero'
  ? {value:cardValue, type:this.newCard.type, heroBonus:this.newCard.heroBonus || 'none'}
  : {value:cardValue, type:this.newCard.type};
p[this.newCard.row].cards.push(card);
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
weatherRowClass(row){
  if(row === 'melee' && this.weather.cold){
    return 'weather-cold';
  }
  if(row === 'range'){
    if(this.weather.tsunami){
      return 'weather-tsunami';
    }
    if(this.weather.fog){
      return 'weather-fog';
    }
  }
  if(row === 'siege'){
    if(this.weather.tsunami){
      return 'weather-tsunami';
    }
    if(this.weather.rain){
      return 'weather-rain';
    }
  }
  return '';
},
weatherCardClass(row){
  return this.weatherRowClass(row) ? `${this.weatherRowClass(row)}-card` : '';
},
hasJaskier(p,row){
return p[row].cards.some(c=>c.type==="jaskier");
},
displayedCards(p,row){
  const cards = p[row].cards.map((card,index)=>({card,index}));
  const jaskierCards = cards.filter(item=>item.card.type==="jaskier");
  const otherCards = cards.filter(item=>item.card.type!=="jaskier");
  return [...jaskierCards, ...otherCards];
},
setCardRowRef(el, playerId, rowId){
  if(!el) return;
  this.rowElements[`${playerId}-${rowId}`] = el;
  if(el.clientWidth > 0){
    this.rowWidths[`${playerId}-${rowId}`] = el.clientWidth;
  }
},
updateRowWidths(){
  Object.entries(this.rowElements).forEach(([key, el])=>{
    if(el && el.clientWidth > 0){
      this.rowWidths[key] = el.clientWidth;
    }
  });
},
cardPosition(index, count, p, row){
  const key = `${p.id}-${row}`;
  let available = this.rowWidths[key] || 0;
  
  // Recalculer directement depuis le DOM pour éviter les valeurs en cache qui seraient fausses
  const el = this.rowElements[key];
  if(el && el.clientWidth > 0){
    available = el.clientWidth;
  }
  
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
const isMoraleCard = card.type === "morale" || (card.type === "hero" && card.heroBonus === "morale");
const moraleCards=p[row].cards.filter(c=>c.type==="morale" || (c.type==="hero" && c.heroBonus==="morale")).length;
if(card.type!=="hero" && moraleCards>0){
    v+=moraleCards-(isMoraleCard?1:0);
}

// 4 bonus moral sur un héro spécialisé
if(card.type === "hero" && card.heroBonus === "morale" && moraleCards > 0){
    v += moraleCards - 1;
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
