
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
{id:"fog",icon:"🌫️",name:"Brouillard"},
{id:"rain",icon:"🌧️",name:"Pluie"},
{id:"tsunami",icon:"🌊",name:"Tsunami"}
],
weather:{cold:false,fog:false,rain:false,tsunami:false},
newCard:{player:1,row:"melee",value:1,type:"normal"},
players:[]
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
methods:{

rowsForPlayer(player){
    // Joueur 1 affiché en haut
    if(player.id===1){
        return [...this.rows].reverse(); // Siège, Distance, Mêlée
    }
    // Joueur 2 affiché en bas
    return [...this.rows]; // Mêlée, Distance, Siège
},

icon(c){
return {hero:"⭐",morale:"💪",bond:"🤝"}[c.type]||"";
},
toggleWeather(id){this.weather[id]=!this.weather[id]},
clearWeather(){Object.keys(this.weather).forEach(k=>this.weather[k]=false)},
addCard(){
const p=this.players[this.newCard.player-1];
p[this.newCard.row].cards.push({value:this.newCard.value,type:this.newCard.type});
this.newCard.value=1;
},
removeCard(p,row,i){p[row].cards.splice(i,1)},
weatherOnRow(row){
return (row==="melee"&&this.weather.cold)||
(row==="range"&&(this.weather.fog||this.weather.tsunami))||
(row==="siege"&&(this.weather.rain||this.weather.tsunami));
},
effective(card,p,row){
let v=card.value;

// 1 météo
if(card.type!=="hero" && this.weatherOnRow(row))
    v=1;

// 2 moral
const moraleCards=p[row].cards.filter(c=>c.type==="morale").length;
if(card.type!=="hero" && moraleCards>0){
    v+=moraleCards-(card.type==="morale"?1:0);
}

// 3 lien serré
if(card.type==="bond"){
    const n=p[row].cards.filter(c=>c.type==="bond"&&c.value===card.value).length;
    if(n>1) v*=n;
}

// 4 cor (double tout sauf héros)
if(p[row].horn && card.type!=="hero"){
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
