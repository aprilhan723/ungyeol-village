import {elements} from './data.js';
export const stems='갑을병정무기경신임계';
export const branches='자축인묘진사오미신유술해';
const stemEl=[0,0,1,1,2,2,3,3,4,4], branchEl=[4,2,0,0,2,1,1,2,3,3,2,4];
export const hidden={자:'계',축:'기계신',인:'갑병무',묘:'을',진:'무을계',사:'병무경',오:'정기',미:'기정을',신:'경임무',유:'신',술:'무신정',해:'임갑'};
const hap=['갑기','을경','병신','정임','무계'],six=['자축','인해','묘술','진유','사신','오미'],clash=['자오','축미','인신','묘유','진술','사해'];
const noble={갑:'축미',무:'축미',경:'축미',을:'자신',기:'자신',병:'해유',정:'해유',신:'인오',임:'묘사',계:'묘사'};
const matches=(table,a,b)=>table.some(p=>p===a+b||p===b+a);
export function element(stem){return stemEl[stems.indexOf(stem)];}
export function distribution(p){const out=[0,0,0,0,0];p.pillars.filter(Boolean).forEach(pair=>{out[element(pair[0])]++;out[branchEl[branches.indexOf(pair[1])]]++;});return out;}
export function tenGod(day,other){const a=stems.indexOf(day),b=stems.indexOf(other),delta=(stemEl[b]-stemEl[a]+5)%5,same=a%2===b%2;return [['비견','겁재'],['식신','상관'],['편재','정재'],['편관','정관'],['편인','정인']][delta][same?0:1];}
export function season(p){return ['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'][branches.indexOf(p.pillars[1][1])];}
export function validateResident(p){
 if(!p||typeof p.name!=='string'||p.name.trim().length<1||p.name.length>24)throw Error('이름은 1~24자로 입력해 주세요.');
 if(!Array.isArray(p.pillars)||p.pillars.length!==4)throw Error('연·월·일·시 네 자리가 필요해요.');
 p.pillars.forEach((pair,i)=>{if(pair===null&&i===3)return;if(typeof pair!=='string'||pair.length!==2||!stems.includes(pair[0])||!branches.includes(pair[1]))throw Error('명식은 경진처럼 두 글자로 입력해 주세요.');if(stems.indexOf(pair[0])%2!==branches.indexOf(pair[1])%2)throw Error(`${pair}은 유효한 간지 조합이 아니에요.`);});
 const [y,m,d,h]=p.pillars;const monthOffset=(branches.indexOf(m[1])+10)%12;const expected=(stems.indexOf(y[0])%5*2+2+monthOffset)%10;
 if(stems.indexOf(m[0])!==expected)throw Error('연간과 월간의 조합을 다시 확인해 주세요.');
 if(h&&stems.indexOf(h[0])!==(stems.indexOf(d[0])%5*2+branches.indexOf(h[1]))%10)throw Error('일간과 시간의 조합을 다시 확인해 주세요.');
 return true;
}
export function relation(a,b){
 const da=a.pillars[2],db=b.pillars[2],ea=element(da[0]),eb=element(db[0]);let affinity=30,tension=0,support=0;const evidence=[];
 if(matches(hap,da[0],db[0])){affinity+=24;evidence.push({kind:'합',text:`일간 ${da[0]}·${db[0]} 천간합`,detail:'서로에게 주의를 기울이는 장면의 재료. 합화나 실제 연애를 의미하지 않습니다.'});}
 if(matches(six,da[1],db[1])){affinity+=20;evidence.push({kind:'합',text:`일지 ${da[1]}·${db[1]} 육합`,detail:'가까운 일상에서 호흡을 맞추는 이야기로 표현합니다.'});}
 if(matches(clash,da[1],db[1])){tension+=30;evidence.push({kind:'충',text:`일지 ${da[1]}·${db[1]} 충`,detail:'다른 속도와 선택이 부딪히는 장면. 나쁜 인연이라는 판정은 아닙니다.'});}
 const seen=new Set();a.pillars.filter(Boolean).forEach((pa,i)=>b.pillars.filter(Boolean).forEach((pb,j)=>{if(i===2&&j===2)return;const key=[pa[1],pb[1]].sort().join('');if(seen.has(key))return;seen.add(key);if(matches(six,pa[1],pb[1])){affinity+=4;evidence.push({kind:'합',text:`지지 ${pa[1]}·${pb[1]} 육합`,detail:'두 명식 사이에서 같은 종류의 지지 쌍은 한 번만 반영합니다.'});}if(matches(clash,pa[1],pb[1])){tension+=6;evidence.push({kind:'충',text:`지지 ${pa[1]}·${pb[1]} 충`,detail:'두 명식 사이의 변화 상징입니다. 위치별 강약 전체를 판단한 것은 아닙니다.'});}}));
 if(ea===eb){affinity+=10;evidence.push({kind:'공명',text:`일간 오행 ${elements[ea]}의 공명`,detail:'닮은 주제를 나누는 동료 서사. 같은 성격이라는 뜻은 아닙니다.'});}
 const feedA=(ea+1)%5===eb,feedB=(eb+1)%5===ea;
 if(feedA||feedB){support+=20;affinity+=8;evidence.push({kind:'상생',text:`${feedA?a.name:b.name} → ${feedA?b.name:a.name} 오행 상생`,detail:'일간 오행의 생 관계를 도움을 건네는 장면으로 번역했습니다. 실제 도움의 크기는 알 수 없습니다.'});}
 const na=b.pillars.filter(Boolean).some(p=>noble[da[0]].includes(p[1]));const nb=a.pillars.filter(Boolean).some(p=>noble[db[0]].includes(p[1]));
 if(na){support+=12;evidence.push({kind:'귀인',text:`${b.name} → ${a.name} 천을귀인 표 해당`,detail:`${a.name}의 일간 ${da[0]} 기준 ${noble[da[0]].split('').join('·')}를 상대 명식에서 확인. 보조 규칙이며 실제 귀인 여부를 보장하지 않습니다.`});}
 if(nb){support+=12;evidence.push({kind:'귀인',text:`${a.name} → ${b.name} 천을귀인 표 해당`,detail:`${b.name}의 일간 ${db[0]} 기준 ${noble[db[0]].split('').join('·')}를 상대 명식에서 확인. 학파에 따른 차이가 있습니다.`});}
 const type=affinity>=58&&tension>=18?'불꽃 케미':affinity>=58?'끌림의 인연':support>=24?'귀인 동행':tension>=24?'티격태격':ea===eb?'닮은 영혼':'느긋한 이웃';
 const score=Math.min(99,affinity);return {a,b,type,affinity:score,tension:Math.min(99,tension),support:Math.min(99,support),evidence,missing:!a.pillars[3]||!b.pillars[3],gods:[tenGod(da[0],db[0]),tenGod(db[0],da[0])],story:story(type,a,b),direction:feedA?[a.id,b.id]:feedB?[b.id,a.id]:null};
}
export const typeMeta={ '끌림의 인연':{color:'#c37886',icon:'heart',line:'서로의 장면에 자꾸 등장하는 두 사람'},'불꽃 케미':{color:'#d68b55',icon:'flame',line:'가까워질수록 이야기가 많아지는 사이'},'귀인 동행':{color:'#4f9d89',icon:'sparkles',line:'내가 놓친 작은 것을 챙겨 주는 사이'},'티격태격':{color:'#a087b5',icon:'zap',line:'다른 박자로 재미있는 리듬을 만드는 사이'},'닮은 영혼':{color:'#6996b4',icon:'orbit',line:'긴 설명 없이도 같은 풍경을 보는 사이'},'느긋한 이웃':{color:'#9b9e78',icon:'coffee',line:'서두르지 않고 한 칸씩 가까워지는 사이'}};
function story(type,a,b){return ({'끌림의 인연':`${a.place}에 도착한 작은 초대장. ${b.name}은 핑계를 하나 만들어 다시 찾아온다. 둘의 이야기를 로맨스로 쓸지, 오래된 우정으로 쓸지는 당신의 몫.`, '불꽃 케미':`${a.name}은 축제를 오늘 열자고 하고, ${b.name}은 내일이 좋다고 한다. 한참을 다투고도, 막상 무대에서는 서로의 빈자리를 가장 먼저 채운다.`, '귀인 동행':`${a.name}의 계획이 멈춘 날, ${b.name}이 문을 두드린다. 대단한 조언 대신 작은 도구 하나. 두 사람은 함께 다음 장면을 완성한다.`, '티격태격':`마을의 새 길을 두고 ${a.name}과 ${b.name}의 의견이 갈린다. 한 사람의 지름길과 다른 사람의 산책길. 결국 길은 두 개가 되고, 마을은 조금 더 재미있어진다.`, '닮은 영혼':`모두 돌아간 광장에 ${a.name}과 ${b.name}이 남는다. 같은 하늘을 보고 다른 문장을 적다가, 서로의 노트를 보고 웃는다.`, '느긋한 이웃':`${a.name}과 ${b.name}은 늘 같은 길에서 스쳐 간다. 어느 비 오는 날 함께 처마 아래에 선 뒤로, 짧았던 인사가 조금씩 길어진다.`})[type];}
export function allRelations(people){return people.flatMap((a,i)=>people.slice(i+1).map(b=>relation(a,b)));}
