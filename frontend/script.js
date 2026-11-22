'use strict';
/* ALTER AI — university demo. Most pages use fixed demo data; the Live AI Team Builder on Research Matching calls the real backend. */
const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = (key,value)=>localStorage.setItem('alter_v2_'+key,JSON.stringify(value));
const load = (key,fallback)=>{try{let v=JSON.parse(localStorage.getItem('alter_v2_'+key));return v??fallback}catch{return fallback}};
let profile=load('profile',{name:'Zarina',field:'AI & Software Development',skills:'Python, Machine Learning',interests:'AI, Research',hours:10,email:'zarina@example.com',role:'Student'});
let settings=load('settings',{autoNegotiation:true,notificationsOn:true});
let requests=load('requests',[]), teamsMine=load('teams',[]), applied=load('applied',[]), negotiations=load('negotiations',0);
let partner='Alex Chen', activeChat='Alex Chen', running=false, toastTimeout;
let researchSearched=false;
const people=[
 {name:'Alex Chen',role:'Researcher · AI & ML',bio:'Interested in computer vision and deep learning research.',skills:['Python','Machine Learning','Computer Vision'],interests:['AI','Research'],hours:12},
 {name:'Sarah Patel',role:'Data Scientist',bio:'Working on NLP and large language models.',skills:['NLP','PyTorch','Data Analysis','Python'],interests:['AI','Research'],hours:8},
 {name:'Mike Johnson',role:'Research Engineer',bio:'Focused on building scalable AI systems and experiments.',skills:['Python','Distributed Systems','MLOps'],interests:['Research','Software'],hours:10}
];
const hacks=[
 {name:'AI for Education',detail:'Looking for 2 teammates · Online Hackathon',tags:['AI','Education']},
 {name:'Healthcare Assistant',detail:'Need ML engineer · 48 hours',tags:['ML','Healthcare']},
 {name:'Smart City Solutions',detail:'Open to collaboration · Hybrid',tags:['IoT','Data']}
];
const internships=[
 {name:'Research Intern (AI)',company:'Google',detail:'Example listing · Demo only',category:'AI / ML',tags:['Python','Research']},
 {name:'Machine Learning Intern',company:'NVIDIA',detail:'Example listing · Demo only',category:'AI / ML',tags:['Python','ML']},
 {name:'Research Intern',company:'OpenAI',detail:'Example listing · Demo only',category:'Research',tags:['AI','Research']}
];
const chatContacts=['Alex Chen','Hackathon Team','Internship Updates','Sarah Patel'];
let chats={};let chatReplyTimer=null;
function resetChats(){
 clearTimeout(chatReplyTimer);chatReplyTimer=null;
 chats=Object.fromEntries(chatContacts.map(n=>[n,[]]));
 activeChat='Alex Chen';$('chatInput').value='';
}
function replyFor(name,message){
 const q=message.toLowerCase();
 if(/рахмет|thank|спасибо/.test(q))return 'You are welcome! What else would you like to discuss?';
 if(/how are you|қалайсың|қалайсын|как дела/.test(q))return 'I am doing well! What project would you like to discuss?';
 if(name==='Internship Updates')return 'The Internship page shows example roles at Google, NVIDIA and OpenAI. These are demo listings, not real applications. Which company interests you?';
 if(name==='Hackathon Team')return /join|қосыл|вступ/.test(q)?'Open Hackathon Team and click Join Team next to your chosen project.':'Our demo teams include AI for Education, Healthcare Assistant and Smart City Solutions. Which would you like to join?';
 if(/python|machine learning|\bml\b|\bai\b|research|nlp|жоба|зерттеу/.test(q))return name==='Alex Chen'?'I work with Python, Machine Learning and Computer Vision. What is your project goal?':'I work with Python, NLP and Data Analysis. What skills do you need?';
 if(/hour|time|available|schedule|сағат|уақыт/.test(q))return name==='Alex Chen'?'My demo profile shows 12 hours per week. How many hours do you need?':'My demo profile shows 8 hours per week. Does that fit your schedule?';
 if(/skill|experience|дағды|тәжірибе/.test(q))return name==='Alex Chen'?'My demo skills are Python, Machine Learning and Computer Vision.':'My demo skills are Python, NLP, PyTorch and Data Analysis.';
 if(/hi|hello|hey|сәлем|салем|привет/.test(q))return 'Hi! What project or collaboration are you interested in?';
 return 'Thanks for your message! Could you share more details about the project, skills or schedule?';
}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.add('hidden'),3200)}
function showPage(page){
 if(!document.getElementById('page-'+page))page='home';
 $('landing').classList.add('hidden');$('app').classList.remove('hidden');
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hidden',p.id!=='page-'+page));
 document.querySelectorAll('#sidebarNav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 if(page==='research')renderPeople();if(page==='hackathon')renderHacks();if(page==='internship')renderInternships();
 if(page==='messages'){resetChats();renderChats();}if(page==='agent')fillProfile();if(page==='settings')fillSettings();
 if(page==='home')renderHome();if(page==='negotiation')$('negPartner').textContent='Partner: '+partner;
 window.scrollTo(0,0);
}
function showLanding(){$('app').classList.add('hidden');$('landing').classList.remove('hidden');window.scrollTo(0,0)}
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-open]');if(open){showPage(open.dataset.open);return}
 const nav=e.target.closest('[data-page]');if(nav){showPage(nav.dataset.page);return}
 const scroll=e.target.closest('[data-scroll]');if(scroll){document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:'smooth'});return}
});$('logout').onclick=showLanding;
function renderHome(){
 $('welcomeName').textContent=profile.name.split(' ')[0]||'User';$('sideName').textContent=profile.name;$('negCount').textContent=negotiations;
 $('activityList').innerHTML= requests.length ? requests.slice(-3).reverse().map(r=>`<div><strong>${esc(r)}</strong><p class="muted">Research request · saved locally</p></div>`).join('') : '<p class="muted">No activity yet. Try finding a research partner.</p>';
}
function constraintsMatch(p){
 const skills=profile.skills.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 const interests=profile.interests.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 return (skills.some(s=>p.skills.some(t=>t.toLowerCase().includes(s)||s.includes(t.toLowerCase())))||interests.some(s=>p.interests.some(t=>t.toLowerCase().includes(s))))&&p.hours>=Math.min(profile.hours,12);
}
function matchingScore(p){
 const skills=profile.skills.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 const interests=profile.interests.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 const skillScore=skills.length ? skills.filter(s=>p.skills.some(t=>t.toLowerCase().includes(s)||s.includes(t.toLowerCase()))).length/skills.length : 0;
 const interestScore=interests.length ? interests.filter(s=>p.interests.some(t=>t.toLowerCase()===s)).length/interests.length : 0;
 const hourScore=Math.min(1,p.hours/Math.max(1,Number(profile.hours)||10));
 return Math.round(100*(0.55*skillScore+0.25*interestScore+0.20*hourScore));
}
function renderPeople(){
 const q=$('researchSearch').value.trim().toLowerCase();
 if(!researchSearched || !q){
  $('researchPartners').innerHTML='<div class="panel pad research-empty"><h2>Find your research partner</h2><p class="muted">Enter a skill or research topic (for example, Python, AI, NLP) and click Search to see matching people and their compatibility scores.</p></div>';
  return;
 }
 const list=people.filter(p=>(p.name+' '+p.role+' '+p.bio+' '+p.skills.join(' ')+' '+p.interests.join(' ')).toLowerCase().includes(q));
 $('researchPartners').innerHTML=list.length?list.map(p=>`<article class="candidate-card"><span class="avatar">${esc(p.name[0])}</span><h2>${esc(p.name)}</h2><p class="role">${esc(p.role)}</p><div class="match-result"><strong>${matchingScore(p)}% Match</strong><span>Demo compatibility score</span><div class="match-track"><div class="match-fill" style="width:${matchingScore(p)}%"></div></div></div><p class="bio">${esc(p.bio)}</p><div class="tags">${p.skills.slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="card-buttons"><button class="btn primary" data-connect="${esc(p.name)}">♧ Connect</button><button class="btn outline" data-message="${esc(p.name)}">Message</button></div></article>`).join(''):'<div class="panel pad">No matching research partners found. Try another skill or topic.</div>';
}
function submitResearch(){researchSearched=true;renderPeople()}
$('researchSubmit').addEventListener('click',submitResearch);
$('researchSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitResearch()}});
$('researchSearch').addEventListener('input',()=>{researchSearched=false;renderPeople()});
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-connect]');if(c){partner=c.dataset.connect;showPage('negotiation');$('negMessages').innerHTML='<p class="muted">Press Start Negotiation to run a scripted demo.</p>';return}
 const m=e.target.closest('[data-message]');if(m){activeChat=m.dataset.message;showPage('messages');activeChat=m.dataset.message;renderChats();return}
});
function renderRequests(){$('requestList').innerHTML=requests.length?requests.map((r,i)=>`<div class="between"><span>${esc(r)}</span><button class="btn outline" data-remove-request="${i}">Remove</button></div>`).join(''):'<p class="muted">No requests yet. Create your first research request.</p>'}
document.querySelectorAll('[data-research-tab]').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('[data-research-tab]').forEach(x=>x.classList.toggle('selected',x===b));
 const req=b.dataset.researchTab==='requests';$('researchPartners').classList.toggle('hidden',req);$('researchRequests').classList.toggle('hidden',!req);if(req)renderRequests();
});
$('createRequest').onclick=()=>{let r=prompt('Describe your research project or partner requirements:');if(r===null)return;r=r.trim();if(!r){toast('Please enter a request.');return}requests.push(r);store('requests',requests);renderRequests();renderHome();toast('Research request saved locally.');};
document.addEventListener('click',e=>{const b=e.target.closest('[data-remove-request]');if(b){requests.splice(+b.dataset.removeRequest,1);store('requests',requests);renderRequests()}});
$('homeForm').onsubmit=e=>{e.preventDefault();let q=$('homePrompt').value.trim();if(!q){toast('Please enter a request.');return}$('researchSearch').value=q;researchSearched=true;showPage('research');renderPeople();};
function renderHacks(){let q=$('hackSearch').value.toLowerCase();let matches=hacks.filter(t=>(t.name+' '+t.detail+' '+t.tags.join(' ')).toLowerCase().includes(q));$('hackTeams').innerHTML=matches.length?matches.map(t=>`<article class="list-card"><div class="list-icon">♧</div><div class="list-copy"><h3>${esc(t.name)}</h3><p>${esc(t.detail)}</p></div>${t.tags.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}<button class="btn primary" data-join="${esc(t.name)}">Join Team →</button></article>`).join(''):'<div class="panel pad">No matching teams found.</div>';renderMine()}
function renderMine(){$('myTeams').innerHTML=teamsMine.length?teamsMine.map(t=>`<article class="list-card"><div class="list-icon">♧</div><div class="list-copy"><h3>${esc(t)}</h3><p>Saved demo team</p></div></article>`).join(''):'<div class="panel pad">You have not joined or created a team yet.</div>'}
$('hackSearch').oninput=renderHacks;
document.querySelectorAll('[data-hack-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-hack-tab]').forEach(x=>x.classList.toggle('selected',x===b));$('hackTeams').classList.toggle('hidden',b.dataset.hackTab==='mine');$('myTeams').classList.toggle('hidden',b.dataset.hackTab!=='mine');renderMine()});
$('createTeam').onclick=()=>{let name=prompt('Enter your demo team name:');if(name===null)return;name=name.trim();if(!name){toast('Please enter a team name.');return}if(!teamsMine.includes(name))teamsMine.push(name);store('teams',teamsMine);renderMine();toast('Demo team created.');};
document.addEventListener('click',e=>{const b=e.target.closest('[data-join]');if(b){let name=b.dataset.join;if(!teamsMine.includes(name))teamsMine.push(name);store('teams',teamsMine);toast('Joined '+name+' (demo).');renderMine()}});
let internFilter='All';function renderInternships(){const q=$('internSearch').value.toLowerCase();let list=internships.filter(j=>(internFilter==='All'||j.category===internFilter)&&(j.name+' '+j.company+' '+j.tags.join(' ')).toLowerCase().includes(q));$('internList').innerHTML=list.length?list.map(j=>`<article class="list-card"><div class="list-icon">${j.company==='Google'?'G':j.company==='NVIDIA'?'N':'O'}</div><div class="list-copy"><h3>${esc(j.company)}</h3><p class="intern-role">${esc(j.name)}</p><p>${esc(j.detail)}</p></div><span class="tag">${esc(j.category)}</span><button class="btn primary" data-apply="${esc(j.name)}">${applied.includes(j.name)?'Interested ✓':'Apply (Demo)'}</button></article>`).join(''):'<div class="panel pad">No matching internships found. Try a different filter.</div>'}
$('internSearch').oninput=renderInternships;
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{internFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderInternships()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-apply]');if(b){if(!applied.includes(b.dataset.apply))applied.push(b.dataset.apply);store('applied',applied);renderInternships();toast('Interest saved locally. No real application was sent.')}});
function fillProfile(){ $('profileName').value=profile.name;$('profileField').value=profile.field;$('profileSkills').value=profile.skills;$('profileInterests').value=profile.interests;$('profileHours').value=profile.hours;}
$('profileForm').onsubmit=e=>{e.preventDefault();profile={...profile,name:$('profileName').value.trim(),field:$('profileField').value.trim(),skills:$('profileSkills').value.trim(),interests:$('profileInterests').value.trim(),hours:Number($('profileHours').value)};store('profile',profile);renderHome();$('profileStatus').textContent='Profile saved successfully in this browser.';toast('Profile saved.');};
function renderChats(){
 const names=Object.keys(chats);if(!chats[activeChat])activeChat=names[0];
 $('conversationList').innerHTML=names.map(n=>`<button data-chat="${esc(n)}" class="${n===activeChat?'selected':''}"><strong>${esc(n)}</strong><small>${esc(chats[n].at(-1)?.text?.slice(0,45)||'Start a conversation')}</small></button>`).join('');
 $('chatTitle').textContent=activeChat+' · AI demo assistant';
 $('chatMessages').innerHTML=(chats[activeChat]||[]).map(m=>`<div class="chat-bubble ${m.from==='me'?'mine':''}">${esc(m.text)}</div>`).join('')||'<p class="muted">Type a message to start. Replies are generated locally by a demo assistant.</p>';
 $('chatMessages').scrollTop=$('chatMessages').scrollHeight;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-chat]');if(b){activeChat=b.dataset.chat;renderChats()}});
$('chatForm').onsubmit=e=>{
 e.preventDefault();const v=$('chatInput').value.trim();if(!v)return;
 const target=activeChat;chats[target].push({from:'me',text:v});
 $('chatInput').value='';renderChats();
 chatReplyTimer=setTimeout(()=>{
  chats[target].push({from:'them',text:replyFor(target,v)});
  if(activeChat===target&&!$('page-messages').classList.contains('hidden'))renderChats();
  chatReplyTimer=null;
 },650);
};
function fillSettings(){$('settingsName').value=profile.name;$('settingsEmail').value=profile.email;$('settingsRole').value=profile.role;$('autoNegotiation').checked=settings.autoNegotiation;$('notificationsOn').checked=settings.notificationsOn;}
document.querySelectorAll('[data-settings]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-settings]').forEach(x=>x.classList.toggle('selected',x===b));document.querySelectorAll('.settings-section').forEach(s=>s.classList.toggle('hidden',s.id!=='settings-'+b.dataset.settings));$('settingsStatus').textContent=''});
$('settingsProfileForm').onsubmit=e=>{e.preventDefault();profile.name=$('settingsName').value.trim();profile.email=$('settingsEmail').value.trim();profile.role=$('settingsRole').value;store('profile',profile);renderHome();$('settingsStatus').textContent='Profile settings saved.';toast('Settings saved.');};
document.querySelectorAll('.save-settings').forEach(b=>b.onclick=()=>{settings={autoNegotiation:$('autoNegotiation').checked,notificationsOn:$('notificationsOn').checked};store('settings',settings);$('settingsStatus').textContent='Preferences saved locally.';toast('Preferences saved.');});
const negotiationLines=[
 ['ALTER Agent','Hello! I represent a researcher interested in collaborating on an AI project.'],
 ['PARTNER','Hello! I am available to discuss the project scope and required skills.'],
 ['ALTER Agent','The project focuses on research and Python. Are you interested?'],
 ['PARTNER','Yes. I have relevant skills and can contribute to the research.'],
 ['ALTER Agent','Great. We can arrange a follow-up discussion to confirm availability.'],
 ['PARTNER','Agreed. Let us review the requirements together.']
];
$('startNegotiation').onclick=async()=>{
 if(running)return;if(!settings.autoNegotiation){toast('Enable simulated negotiations in Settings first.');return}
 running=true;$('startNegotiation').disabled=true;$('negMessages').innerHTML='';
 for(let i=0;i<negotiationLines.length;i++){
  if($('page-negotiation').classList.contains('hidden'))break;
  const [who,msg]=negotiationLines[i];let node=document.createElement('div');node.className='neg-msg'+(i%2?' alt':'');node.innerHTML=`<strong>${i%2?esc(partner)+' Agent':who}</strong>${esc(msg)}`;$('negMessages').append(node);await new Promise(r=>setTimeout(r,450));
 }
 negotiations++;store('negotiations',negotiations);running=false;$('startNegotiation').disabled=false;toast('Scripted negotiation demo finished.');
};
// The same fixed Bayesian demonstration used in the original project.
function bayesianDemo(){const prior=.60,likelihood=.90,falsePositive=.20;return Math.round(100*(likelihood*prior)/(likelihood*prior+falsePositive*(1-prior)))}
const note=document.createElement('div');note.className='panel pad bayes-note';note.innerHTML=`<strong>Matching explanation (Demo)</strong><p>The people cards above use fixed demo data. The Live AI Team Builder below calls the real backend (agents, CSP, Bayesian score). The demo cards use a fixed Bayesian example: 0.90 × 0.60 / (0.90 × 0.60 + 0.20 × 0.40) = <b>${bayesianDemo()}% Match (Demo)</b>. This is not a personalized score.</p>`;$('page-research').insertBefore(note,$('page-research').querySelector('.footnote'));
renderHome();renderPeople();renderHacks();renderInternships();

/* ===== Live backend integration =====
   Start the backend first:  py -m uvicorn backend.main:app --reload
   This panel calls POST /find-team and GET /agents on http://127.0.0.1:8000 */
const API_URL='http://127.0.0.1:8000';
(function buildLiveBuilder(){
 const page=$('page-research');
 const box=document.createElement('div');
 box.className='panel pad live-builder';
 const rows=[['Data Analyst','Python, Data Analysis',10],['Mobile Developer','Flutter',8],['','',8]];
 box.innerHTML=`<div class="lb-head"><div><h2>Live AI Team Builder</h2><p class="muted">Calls the real backend: personal agents answer, CSP assembles the team, a Bayesian score ranks candidates.</p></div><span class="lb-status" id="lbStatus">Backend: checking…</span></div>
 <div class="lb-grid lb-labels"><span>Role</span><span>Required skills (comma separated)</span><span>Hours / week</span></div>
 ${rows.map((r,i)=>`<div class="lb-grid"><input id="lbRole${i}" value="${esc(r[0])}" placeholder="Role ${i+1}"><input id="lbSkills${i}" value="${esc(r[1])}" placeholder="Python, SQL"><input id="lbHours${i}" type="number" min="1" value="${r[2]}"></div>`).join('')}
 <div class="lb-actions"><label>Max total hours (optional) <input id="lbMax" type="number" min="1" placeholder="e.g. 20"></label><button class="btn primary" id="lbRun" type="button">Find team</button></div>
 <div id="lbResult" class="lb-result"></div>`;
 page.insertBefore(box,page.querySelector('.footnote'));

 function setStatus(ok){const s=$('lbStatus');s.className='lb-status '+(ok?'ok':'off');s.textContent=ok?'Backend: connected':'Backend: offline'}
 async function checkBackend(){try{const r=await fetch(API_URL+'/health');setStatus(r.ok)}catch{setStatus(false)}}
 function errText(d){
  if(typeof d.detail==='string')return d.detail;
  if(Array.isArray(d.detail))return d.detail.map(x=>x.msg).join('; ');
  return 'The backend rejected the request.';
 }
 function renderResult(d,agents){
  const head=d.success?'<h3 class="lb-title ok">Team found</h3>':`<h3 class="lb-title bad">${esc(d.message||'No team found')}</h3>`;
  const cards=(d.team||[]).map(m=>{
   const a=agents[m.agent_id]||{};const pct=Math.round(m.score*100);
   const tags=Array.isArray(a.skills)?`<div class="tags">${a.skills.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:'';
   return `<article class="lb-card"><div class="lb-role">${esc(m.role)}</div><div class="lb-agent">Agent ${esc(m.agent_id)}</div><div class="lb-score"><strong>${pct}%</strong><span>Bayesian match</span><div class="match-track"><div class="match-fill" style="width:${pct}%"></div></div></div><p class="lb-line"><span class="lb-badge ${esc(m.action)}">${esc(m.action)}</span> ${esc(m.offered_hours)} h/week · ${esc(m.reason)}</p>${tags}<small class="muted">Public data only${a.domain?' ('+esc(a.domain)+')':''}: name and interests are never shared by agents.</small></article>`;
  }).join('');
  const steps=(d.steps||[]).map(esc).join('\n'),log=(d.log||[]).map(esc).join('\n');
  return head+`<div class="lb-cards">${cards}</div><p class="muted lb-meta">CSP search checked <b>${esc(d.nodes)}</b> candidates.</p><details><summary>CSP search steps</summary><pre>${steps||'—'}</pre></details><details><summary>Agent conversation log</summary><pre>${log||'—'}</pre></details>`;
 }
 async function run(){
  const out=$('lbResult'),roles=[];
  for(let i=0;i<3;i++){
   const role=$('lbRole'+i).value.trim();if(!role)continue;
   roles.push({role,required_skills:$('lbSkills'+i).value.split(',').map(s=>s.trim()).filter(Boolean),min_hours:parseInt($('lbHours'+i).value,10)||0});
  }
  const maxV=parseInt($('lbMax').value,10);
  $('lbRun').disabled=true;out.innerHTML='<p class="muted">Agents are negotiating…</p>';
  try{
   const res=await fetch(API_URL+'/find-team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roles,max_total_hours:maxV>0?maxV:null,excluded_ids:[]})});
   const data=await res.json().catch(()=>({}));
   setStatus(true);
   if(!res.ok){out.innerHTML=`<p class="lb-error">${esc(errText(data))}</p>`;return}
   const agents={};
   try{(await(await fetch(API_URL+'/agents')).json()).forEach(a=>{agents[a.id]=a})}catch{}
   out.innerHTML=renderResult(data,agents);
  }catch{
   setStatus(false);
   out.innerHTML='<p class="lb-error">Cannot reach the backend. Start it with <code>py -m uvicorn backend.main:app --reload</code> and try again.</p>';
  }finally{$('lbRun').disabled=false}
 }
 $('lbRun').addEventListener('click',run);
 checkBackend();
})();
