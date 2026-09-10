import * as THREE from 'three';
import {archetypes} from './data.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const palette={grass:0xc5d8ad,edge:0x9bab7e,earth:0xc6af8c,path:0xede0ba,water:0x83bac0};
function material(color){return new THREE.MeshStandardMaterial({color,roughness:.88});}
function part(group,geo,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(geo,material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
const box=(g,c,x,y,z,sx,sy,sz)=>part(g,new THREE.BoxGeometry(sx,sy,sz),c,x,y,z);
const ball=(g,c,x,y,z,r)=>part(g,new THREE.SphereGeometry(r,14,10),c,x,y,z);
const cyl=(g,c,x,y,z,r1,r2,h,n=12)=>part(g,new THREE.CylinderGeometry(r1,r2,h,n),c,x,y,z);
export function character(person,scale=1){const g=new THREE.Group(),c=person.color;const dark=0x42534a,skin=0xf0c8a6;
 box(g,dark,-.13,.13,0,.19,.26,.22);box(g,dark,.13,.13,0,.19,.26,.22);
 cyl(g,c,0,.48,0,.25,.3,.5);ball(g,skin,0,.96,0,.3);const hair=ball(g,0x514238,0,1.08,-.065,.30);hair.scale.set(1,.68,1);
 ball(g,dark,-.1,1,.266,.023);ball(g,dark,.1,1,.266,.023);ball(g,0xdc9b8f,-.2,.91,.225,.04);ball(g,0xdc9b8f,.2,.91,.225,.04);
 const arm=box(g,c,-.33,.56,0,.16,.36,.18);arm.rotation.z=-.2;box(g,c,.33,.56,0,.16,.36,.18);ball(g,skin,.33,.36,0,.085);ball(g,skin,-.34,.36,0,.085);
 box(g,0xf3e6c9,0,.66,.235,.08,.28,.04);
 const h=person.hat;
 if(h==='wizard'){cyl(g,c,0,1.19,0,.4,.4,.045);cyl(g,c,0,1.48,0,0,.28,.55);ball(g,0xffe5a0,0,1.77,0,.06);}
 else if(h==='leaf'){cyl(g,0xd7b978,0,1.25,0,.44,.44,.055);cyl(g,0xddc48c,0,1.32,0,.24,.29,.18);const leaf=ball(g,0x608868,.24,1.43,0,.13);leaf.scale.set(.5,1.4,.5);}
 else if(h==='gem'){const gem=part(g,new THREE.OctahedronGeometry(.17),0xdac5e2,0,1.37,0);gem.rotation.z=.4;}
 else if(h==='artist'){const beret=ball(g,0x698eab,0,1.28,0,.32);beret.scale.y=.35;box(g,0x725c4a,.43,.6,0,.04,.65,.04);ball(g,0xefad83,.43,.96,0,.055);}
 else if(h==='builder'||h==='forge'){cyl(g,h==='builder'?0xe5b75e:0x72868d,0,1.26,0,.32,.36,.18);if(h==='forge'){box(g,0x614b3a,.46,.43,0,.06,.5,.06);box(g,0x8d989b,.46,.68,0,.28,.15,.15);}}
 else if(h==='moon'){cyl(g,0x769eb8,0,1.29,0,.27,.34,.18);ball(g,0xf9dd90,0,1.44,0,.105);box(g,0xf0e9d3,-.33,.44,.18,.24,.22,.1);}
 else if(h==='lamp'){cyl(g,0xc67753,0,1.25,0,.28,.33,.14);box(g,0x5d4d3c,.46,.48,0,.07,.36,.07);ball(g,0xffdd88,.46,.32,0,.14);}
 else if(h==='sailor'){cyl(g,0xf5edda,0,1.27,0,.32,.32,.1);box(g,0x486f84,0,1.25,.28,.36,.07,.06);}
 else if(h==='tea'){cyl(g,0xf1e7d4,0,1.23,0,.26,.28,.06);cyl(g,0xf1e7d4,.38,.4,.14,.13,.09,.15);}
 else if(h==='cloud'){for(let i=-1;i<=1;i++)ball(g,0xf4f2e7,i*.17,1.3,0,.16);box(g,0xefe7d3,.35,.55,.14,.2,.27,.09);}
 else {cyl(g,0xc89759,0,1.24,0,.42,.42,.05);cyl(g,0xd3a76e,0,1.32,0,.18,.29,.2);}
 const stem=person.pillars[2][0];
 if(stem==='임'){for(let k=0;k<2;k++){const wave=part(g,new THREE.TorusGeometry(.52+k*.17,.045,7,36,Math.PI*1.7),0x6aaec5,0,.17+k*.13,0);wave.rotation.set(Math.PI/2,0,k*1.8);}}
 if(stem==='계'){const points=[];for(let j=0;j<24;j++)points.push(new THREE.Vector3(Math.sin(j*.4)*.17-.5+j*.04,.06,Math.cos(j*.24)*.42));part(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.045,6,false),0x94d5d9);const drop=ball(g,0xa8e4e1,.48,.8,0,.09);drop.scale.y=1.5;}
 if(stem==='병'){const disk=part(g,new THREE.SphereGeometry(.4,24,12),0xf4b854,0,1.2,-.24);disk.scale.z=.15;for(let j=0;j<10;j++){const a=j/10*Math.PI*2;const ray=box(g,0xf5c669,Math.sin(a)*.52,1.2+Math.cos(a)*.52,-.24,.045,.16,.04);ray.rotation.z=-a;}}
 if(stem==='정'){cyl(g,0xffefd3,-.52,.74,.02,.07,.075,.3);const flame=ball(g,0xffc455,-.52,.98,.02,.075);flame.scale.y=1.8;ball(g,0xffe49c,-.52,.965,.065,.038);}
 if(stem==='무'){for(let k=0;k<3;k++)part(g,new THREE.ConeGeometry(.22,.3+k*.1,5),0xb2a386,-.45+k*.43,.1,-.12);}
 if(stem==='기'){box(g,0x997852,0,.03,0,.92,.05,.7);for(const x of [-.36,.36]){cyl(g,0x72956b,x,.15,.25,.015,.015,.26);const l=ball(g,0x8eb67f,x+.06,.25,.25,.1);l.scale.set(1,.4,.7);}}
 if(stem==='경'||stem==='신'){const stone=part(g,new THREE.OctahedronGeometry(stem==='신'?.2:.25),stem==='신'?0xd8b6e4:0xb8c4c7,-.52,.8,0);stone.rotation.z=.35;}
 if(stem==='갑'){cyl(g,0x967247,-.43,.6,-.23,.045,.06,1.2);for(const [x,y] of [[-.43,1.3],[-.63,1.12],[-.25,1.12]])ball(g,0x7f9e69,x,y,-.23,.24);}
 if(stem==='을'){for(let k=0;k<5;k++){const l=ball(g,0x8eaf76,Math.sin(k)*.37,.3+k*.23,-.08,.12);l.scale.set(.5,1,.6);}}
 g.scale.setScalar(scale);return g;
}
export function avatarData(p){const bg=p.color;const hats={moon:'☾',lamp:'✦',leaf:'❧',adventure:'⌁',forge:'◆',builder:'▰',sailor:'⚓',tea:'♧',gem:'◇',artist:'✧',cloud:'☁',wizard:'✦'};const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130"><ellipse cx="60" cy="117" rx="36" ry="7" fill="#344d4820"/><rect x="39" y="99" width="16" height="17" rx="5" fill="#47544b"/><rect x="65" y="99" width="16" height="17" rx="5" fill="#47544b"/><path d="M36 77Q60 61 84 77L91 104H29Z" fill="${bg}"/><rect x="54" y="74" width="12" height="29" rx="3" fill="#f6e9ca"/><circle cx="60" cy="53" r="29" fill="#f0c8a6"/><path d="M32 50Q26 14  sixty 20" fill="none"/><path d="M31 49Q26 19 60 20Q91 18 90 49L79 36Q58 47 39 37Z" fill="#514238"/><circle cx="49" cy="55" r="2.5" fill="#435247"/><circle cx="71" cy="55" r="2.5" fill="#435247"/><ellipse cx="39" cy="62" rx="5" ry="3" fill="#df9b8d"/><ellipse cx="81" cy="62" rx="5" ry="3" fill="#df9b8d"/><path d="M55 66Q60 70 65 66" stroke="#b87a63" stroke-width="2" fill="none"/><ellipse cx="60" cy="28" rx="34" ry="8" fill="${bg}"/><path d="M38 26Q36 6 60 7Q82 6 82 26" fill="${bg}"/><text x="60" y="24" text-anchor="middle" font-size="20" fill="#fff2c4">${hats[p.hat]||'✦'}</text></svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace('</svg>',`<text x="101" y="106" text-anchor="middle" font-size="24">${archetypes[p.pillars[2][0]].symbol}</text></svg>`).replace('<path d="M32 50Q26 14  sixty 20" fill="none"/>',''));}
export function createWorld(container,people,onSelect){
 let disposed=false,selected=people[0]?.id,night=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xe9eee2);scene.fog=new THREE.Fog(0xe9eee2,40,95);
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{return {failed:true,destroy(){},select(){},theme(){},reset(){},zoom(){},pause(){},lines(){}};}
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','운결마을 3D 디오라마. 드래그로 회전하고 주민 이름으로 선택하세요.');
 const camera=new THREE.PerspectiveCamera(34,1,.1,150);camera.position.set(23,27,32);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);controls.minDistance=18;controls.maxDistance=60;controls.maxPolarAngle=Math.PI/2.3;controls.minPolarAngle=.25;controls.enablePan=false;
 const ambient=new THREE.HemisphereLight(0xfff6dd,0x8a9e86,2.8);scene.add(ambient);const sun=new THREE.DirectionalLight(0xffe8c2,3.5);sun.position.set(-12,25,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.normalBias=.04;scene.add(sun);
 const island=new THREE.Group();scene.add(island);cyl(island,palette.earth,0,-1.15,0,12.6,11.8,1.8,64);cyl(island,palette.edge,0,-.38,0,12.8,12.6,.42,64);cyl(island,palette.grass,0,-.13,0,12.8,12.8,.25,64);
 const floor=part(scene,new THREE.PlaneGeometry(200,200),0xe9eee2,0,-2.2,0);floor.rotation.x=-Math.PI/2;
 const river=new THREE.Shape();river.moveTo(-13,-1.8);river.bezierCurveTo(-7,-4,-4,1,-1,-1);river.bezierCurveTo(3,-4,7,-2,12,-5);river.lineTo(11,-6.2);river.bezierCurveTo(5,-3,3,-5,-1,-2.2);river.bezierCurveTo(-5,0,-8,-5,-12.8,-3);river.closePath();const riv=part(island,new THREE.ShapeGeometry(river,32),palette.water,0,.02,0);riv.rotation.x=-Math.PI/2;
 const ring=part(island,new THREE.RingGeometry(7,7.65,64),palette.path,0,.028,0);ring.rotation.x=-Math.PI/2;
 cyl(island,palette.path,0,.015,0,2.5,2.5,.08,48);cyl(island,0xe6d7b3,0,.18,0,.95,1.12,.3,24);cyl(island,0x8bb4ac,0,.36,0,.72,.83,.1,24);cyl(island,0xe9e0c7,0,.75,0,.12,.2,.8);ball(island,0xd8c08c,0,1.22,0,.29);
 // A little timber bridge joins the two banks.
 for(let i=0;i<10;i++)box(island,0xb99063,-4+i*.22,.22,1.9, .19,.15,2.0);
 for(const z of [.95,2.85]){box(island,0x927752,-3,.75,z,2.35,.08,.07);for(const x of [-4,-3,-2])box(island,0x927752,x,.45,z,.08,.8,.08);}
 const spots=people.map((p,i)=>{const angle=i/people.length*Math.PI*2+.16;return {x:Math.cos(angle)*8.9,z:Math.sin(angle)*8.9};});
 const chars=[],labels=[],houses=[];
 people.forEach((p,i)=>{const {x,z}=spots[i];const angle=Math.atan2(x,z);const house=new THREE.Group();house.position.set(x,0,z);house.rotation.y=angle+Math.PI;island.add(house);houses.push(house);
 box(house,0xf4e8ca,0,.83,0,1.7,1.65,1.5);const roof=part(house,new THREE.ConeGeometry(1.5,.95,4),p.color,0,2.1,0);roof.rotation.y=Math.PI/4;roof.scale.z=.96;
 box(house,0x806d57,0,.51,.766,.48,1.02,.045);ball(house,0xd3b477,.15,.55,.81,.035);
 for(const wx of [-.56,.56]){box(house,0xd9b575,wx,1.08,.77,.38,.45,.06);box(house,0xffe8a0,wx,1.08,.81,.29,.34,.035);box(house,0xf5edcf,wx,1.08,.84,.035,.37,.035);}
 box(house,0xc5b392,0,.12,.95,.75,.23,.35);box(house,0xcfc1a5,0,.055,1.2,.96,.11,.27);
 if(i%3===0){box(house,0xc1ac8c,.5,2.18,-.3,.24,.8,.24);}if(i===1){cyl(house,0xf4e5c8,-1.15,1,0,.42,.5,2);cyl(house,0xffdfa0,-1.15,2.2,0,.4,.4,.3);cyl(house,p.color,-1.15,2.5,0,0,.62,.4);}
 const toward=new THREE.Vector3(-x,0,-z).normalize();const pos=new THREE.Vector3(x,0,z).add(toward.multiplyScalar(2.2));const char=character(p,1.04);char.position.copy(pos);char.rotation.y=Math.atan2(17-pos.x,23-pos.z);char.userData={id:p.id,base:pos.clone()};island.add(char);chars.push(char);
 const label=document.createElement('button');label.className='world-label';label.innerHTML=`<span class="label-dot" style="background:${p.color}"></span><span></span>`;label.lastChild.textContent=p.name;label.setAttribute('aria-label',`${p.name} ${p.role} 선택`);label.onclick=()=>onSelect(p.id);container.appendChild(label);labels.push(label);
 // Gardens, flower boxes, and low picket fences.
 for(let k=-1;k<=1;k++){box(house,0xb8a179,k*.5,.25,-1.1,.07,.5,.07);}box(house,0xc7b08b,0,.34,-1.1,1.25,.055,.055);
 for(let f=0;f<3;f++){cyl(house,0xb99877,.98,.18,f*.22-.2,.16,.11,.28);ball(house,[0xe8ca82,0xe0a09a,0xf3ead0][f],.98,.42,f*.22-.2,.14);}
 });
 let seed=42;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
 function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);island.add(g);cyl(g,0x957b54,0,.6,0,.1,.16,1.2);const tone=[0x7a9f72,0x97b582,0x6d9272,0xa7bd86][Math.floor(rand()*4)];ball(g,tone,0,1.65,0,.72);ball(g,tone,-.35,1.37,0,.5);ball(g,tone,.35,1.4,.1,.5);}
 for(let i=0;i<42;i++){const a=rand()*Math.PI*2,r=10.8+rand()*1.35;tree(Math.cos(a)*r,Math.sin(a)*r,.65+rand()*.5);}
 for(let i=0;i<14;i++){const a=rand()*Math.PI*2,r=3.8+rand()*.9;tree(Math.cos(a)*r,Math.sin(a)*r,.65+rand()*.5);}
 for(let i=0;i<45;i++){let x=(rand()-.5)*22,z=(rand()-.5)*22;if(x*x+z*z>140)continue;const rock=ball(island,0xc5c7a5,x,.12,z,.1+rand()*.12);rock.scale.set(1.4,.6,1);}
 // Picnic corner and little paper pennants.
 box(island,0xb88e5f,2.3,.55,2.5,1.5,.13,.65);for(const x of [1.8,2.8])box(island,0x9d805a,x,.28,2.5,.1,.5,.4);box(island,0xd0a575,2.3,.28,3.1,1.6,.12,.22);
 const balloons=[];for(let i=0;i<5;i++){const g=new THREE.Group();g.position.set(-2+i,3.8+Math.sin(i)*.4,-3);const b=ball(g,[0xe4b184,0xabc29c,0x90b6bf,0xdac48e,0xcba3ae][i],0,0,0,.26);b.scale.y=1.2;cyl(g,0xc2bca5,0,-.6,0,.009,.009,.7,5);island.add(g);balloons.push(g);}
 const highlight=part(island,new THREE.RingGeometry(.48,.57,48),0xfff4ba,0,.055,0);highlight.rotation.x=-Math.PI/2;
 const links=new THREE.Group();island.add(links);const projected=new THREE.Vector3();
 function resize(){const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.zoom=width/height<1?.80:1.13;camera.updateProjectionMatrix();}const obs=new ResizeObserver(resize);obs.observe(container);resize();
 let raf;function animate(t){if(disposed)return;raf=requestAnimationFrame(animate);controls.update();chars.forEach((c,i)=>{c.position.y=paused?0:Math.sin(t*.0017+i)*.035;const isSelected=c.userData.id===selected;if(isSelected){highlight.position.x=c.position.x;highlight.position.z=c.position.z;}const pt=c.userData.base.clone();pt.y+=1.8;projected.copy(pt).project(camera);labels[i].style.transform=`translate(-50%,-50%) translate(${(projected.x*.5+.5)*container.clientWidth}px,${(-projected.y*.5+.5)*container.clientHeight}px)`;labels[i].classList.toggle('selected',isSelected);labels[i].style.display=projected.z>1?'none':'';});balloons.forEach((g,i)=>{if(!paused)g.position.y=3.8+Math.sin(t*.001+i)*.17;});renderer.render(scene,camera);}animate(0);
 return {select(id){selected=id;},theme(mode){night=mode==='night';scene.background.set(night?0x253c47:0xe9eee2);scene.fog.color.copy(scene.background);floor.material.color.copy(scene.background);sun.intensity=night?1.0:3.5;ambient.intensity=night?1.2:2.8;},pause(){paused=!paused;return paused;},zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);},reset(){camera.position.set(23,27,32);controls.target.set(0,0,0);},lines(rs){while(links.children.length){const child=links.children[0];child.geometry.dispose();child.material.dispose();links.remove(child);}for(const r of rs){const ca=chars.find(c=>c.userData.id===r.a.id),cb=chars.find(c=>c.userData.id===r.b.id);if(!ca||!cb)continue;const a=ca.position.clone(),b=cb.position.clone();a.y=.65;b.y=.65;const mid=a.clone().lerp(b,.5);mid.y=3;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.028,5,false),new THREE.MeshBasicMaterial({color:r.type==='티격태격'?0xa087b5:r.type==='귀인 동행'?0x4f9d89:0xc37886,transparent:true,opacity:.55}));links.add(mesh);}},destroy(){disposed=true;cancelAnimationFrame(raf);controls.dispose();obs.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){const arr=Array.isArray(o.material)?o.material:[o.material];arr.forEach(m=>m.dispose());}});renderer.dispose();container.replaceChildren();}};
}
