const $=s=>document.querySelector(s),KEY='infralab-v1',OUS=['Sales','HR','Finance','IT','Operations'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),slug=s=>s.toLowerCase().replace(/[^a-z0-9.-]/g,'');
const mk=(n,o,g,x={})=>({sam:slug(n.replace(/ /g,'.')),name:n,ou:o,en:true,locked:false,groups:['All-Staff',...g],mfa:true,lic:true,blocked:false,...x});
const seed=()=>({users:[mk('Neha Verma','Sales',['Sales-Team']),mk('Rohit Singh','Sales',['Sales-Team']),mk('Priya Nair','HR',['HR-Team'],{locked:true}),
 mk('Karan Mehta','IT',['IT-Support']),mk('Rahul Gupta','Finance',['Finance-Team']),mk('Sneha Kapoor','HR',['HR-Team']),mk('Aman Joshi','Operations',[]),mk('Divya Rao','Finance',['Finance-Team'],{lic:false})],
 groups:['Sales-Team','HR-Team','IT-Support','Finance-Team','All-Staff'],
 shared:[{name:'finance@corp.local',full:['rahul.gupta','divya.rao']},{name:'hr@corp.local',full:['priya.nair']}],
 dls:[{name:'all-staff@corp.local',members:['neha.verma','rohit.singh','priya.nair','karan.mehta','rahul.gupta']},{name:'it-team@corp.local',members:['karan.mehta']}],
 devices:[{name:'LT-NEHA-01',owner:'neha.verma',os:'Windows 11 23H2',patch:true,sync:'2h ago',apps:[],lock:false},{name:'LT-ROHIT-02',owner:'rohit.singh',os:'Windows 11 22H2',patch:false,sync:'3d ago',apps:[],lock:false},
 {name:'LT-RAHUL-03',owner:'rahul.gupta',os:'Windows 11 23H2',patch:true,sync:'1h ago',apps:['Teams'],lock:false}],ca:true,log:[],signins:[],flags:{}});
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch{}S=S||seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}};
const U=s=>S.users.find(u=>u.sam===s),sams=()=>S.users.map(u=>u.sam),now=()=>new Date().toLocaleTimeString();
const log=m=>{S.log.unshift({t:now(),m});S.log=S.log.slice(0,100)};
let tab='home',q='',out=['Windows PowerShell (InfraLab). Type help to see supported commands.'],hist=[],hi=0,hints={};
function T(m,err){const e=$('#toast');e.textContent=m;e.className='show'+(err?' err':'');clearTimeout(T.h);T.h=setTimeout(()=>e.className='',3200)}
function go(fn){try{T(fn())}catch(e){T(e.message,1)}save();render()}
const need=s=>{if(!s)throw Error('Missing -Identity');const u=U(s);if(!u)throw Error(`Cannot find user '${s}'`);return u};
const C={unlock(s){need(s).locked=false;log('Unlocked '+s);return s+' unlocked'},
 toggle(s,on){need(s).en=on;log((on?'Enabled ':'Disabled ')+s);return `${s} ${on?'enabled':'disabled'}`},
 reset(s){const u=need(s),p='Tmp@'+Math.random().toString(36).slice(2,8);u.locked=false;u.pwReset=true;log('Password reset for '+s);return `Temporary password for ${s}: ${p} (must change at next sign-in)`},
 create(n,ou){const sam=slug((n||'').trim().replace(/\s+/g,'.'));if(!sam)throw Error('Name is required');if(U(sam))throw Error(sam+' already exists');if(!OUS.includes(ou))throw Error('Unknown OU. Use: '+OUS.join(', '));
  S.users.push(mk(n.trim(),ou,[],{mfa:false,lic:false}));log(`Created ${sam} in ${ou}`);return `Created ${sam} in OU=${ou}`},
 group(g,s){const u=need(s);if(!S.groups.includes(g))throw Error(`Group '${g}' not found`);if(u.groups.includes(g))throw Error(`${s} is already in ${g}`);u.groups.push(g);log(`Added ${s} to ${g}`);return `Added ${s} to ${g}`}};
function ask(title,fields,cb){const d=$('#dlg');d.innerHTML=`<form method="dialog"><h3>${title}</h3>${fields.map(f=>`<label>${f.l}${f.o?`<select name="${f.k}">${f.o.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input name="${f.k}" required autocomplete="off">`}</label>`).join('')}<div class="bar"><button value="ok">Confirm</button><button class="g" value="x" formnovalidate>Cancel</button></div></form>`;
 d.onclose=()=>{if(d.returnValue==='ok')cb(Object.fromEntries(new FormData(d.querySelector('form'))))};d.returnValue='';d.showModal()}
const bd=(t,c)=>`<span class="b ${c}">${t}</span>`,tbl=(h,r)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.join('')}</table>`;

// ---- Active Directory ----
const status=u=>!u.en?bd('Disabled','off'):u.locked?bd('Locked','warn'):bd('Active','ok');
function ad(){const l=S.users.filter(u=>(u.name+u.sam+u.ou).toLowerCase().includes(q));
 return `<h2>Active Directory Users and Computers</h2><div class="bar"><input id="sq" placeholder="Search users" value="${esc(q)}" oninput="q=this.value.toLowerCase();render();const i=$('#sq');i.focus();i.setSelectionRange(99,99)"><button onclick="newUser()">New user</button></div>`+
 tbl(['User','OU','Status','Groups','Actions'],l.map(u=>`<tr><td><b>${esc(u.name)}</b><br><small>${u.sam}</small></td><td>${u.ou}</td><td>${status(u)}</td><td>${u.groups.join(', ')}</td><td>
 <button class="g" onclick="go(()=>C.reset('${u.sam}'))">Reset password</button>${u.locked?`<button class="g" onclick="go(()=>C.unlock('${u.sam}'))">Unlock</button>`:''}
 <button class="g" onclick="go(()=>C.toggle('${u.sam}',${!u.en}))">${u.en?'Disable':'Enable'}</button><button class="g" onclick="addGrp('${u.sam}')">Add to group</button><button class="g" onclick="moveOu('${u.sam}')">Move OU</button></td></tr>`))}
const newUser=()=>ask('New user',[{k:'n',l:'Full name'},{k:'o',l:'OU',o:OUS}],v=>go(()=>C.create(v.n,v.o)));
const addGrp=s=>ask('Add to group',[{k:'g',l:'Group',o:S.groups}],v=>go(()=>C.group(v.g,s)));
const moveOu=s=>ask('Move to OU',[{k:'o',l:'OU',o:OUS}],v=>go(()=>{need(s).ou=v.o;log(`Moved ${s} to ${v.o}`);return `Moved ${s} to OU=${v.o}`}));

// ---- Microsoft 365 ----
function m365(){const used=S.users.filter(u=>u.lic).length;
 return `<h2>Microsoft 365 admin</h2><div class="cols"><div class="card"><h3>Shared mailboxes</h3><button onclick="newShared()">New shared mailbox</button>${S.shared.map((m,i)=>`<div class="row"><div><b>${m.name}</b><br><small>Access: ${m.full.join(', ')||'nobody'}</small></div><div><button class="g" onclick="grant(${i})">Grant</button><button class="g" onclick="revoke(${i})">Revoke</button></div></div>`).join('')}</div>
 <div class="card"><h3>Distribution lists</h3><button onclick="newDl()">New list</button>${S.dls.map((m,i)=>`<div class="row"><div><b>${m.name}</b><br><small>${m.members.length} members: ${m.members.join(', ')||'none'}</small></div><div><button class="g" onclick="addDl(${i})">Add</button><button class="g" onclick="rmDl(${i})">Remove</button></div></div>`).join('')}</div>
 <div class="card"><h3>Licences (${used} of 10 used)</h3>${S.users.map(u=>`<div class="row"><span>${esc(u.name)} ${u.lic?bd('M365 E3','ok'):bd('None','off')}</span><button class="g" onclick="lic('${u.sam}')">${u.lic?'Remove':'Assign'}</button></div>`).join('')}</div></div>`}
const newShared=()=>ask('New shared mailbox',[{k:'n',l:'Mailbox name, e.g. support'}],v=>go(()=>{const n=slug(v.n)+'@corp.local';if(S.shared.some(m=>m.name===n))throw Error(n+' already exists');S.shared.push({name:n,full:[]});log('Created shared mailbox '+n);return 'Created '+n}));
const grant=i=>ask('Grant Full Access and Send As',[{k:'u',l:'User',o:sams()}],v=>go(()=>{const m=S.shared[i];if(m.full.includes(v.u))throw Error(v.u+' already has access');m.full.push(v.u);log(`Granted ${v.u} access to ${m.name}`);return `${v.u} can open and send as ${m.name}`}));
const revoke=i=>{const m=S.shared[i];if(!m.full.length)return T('Nobody has access yet',1);ask('Revoke access',[{k:'u',l:'User',o:m.full}],v=>go(()=>{m.full=m.full.filter(x=>x!==v.u);log(`Revoked ${v.u} from ${m.name}`);return `Removed ${v.u} from ${m.name}`}))};
const newDl=()=>ask('New distribution list',[{k:'n',l:'List name, e.g. sales-team'}],v=>go(()=>{const n=slug(v.n)+'@corp.local';if(S.dls.some(m=>m.name===n))throw Error(n+' already exists');S.dls.push({name:n,members:[]});log('Created list '+n);return 'Created '+n}));
const addDl=i=>ask('Add member',[{k:'u',l:'User',o:sams()}],v=>go(()=>{const m=S.dls[i];if(m.members.includes(v.u))throw Error('Already a member');m.members.push(v.u);log(`Added ${v.u} to ${m.name}`);return `Added ${v.u} to ${m.name}`}));
const rmDl=i=>{const m=S.dls[i];if(!m.members.length)return T('List is empty',1);ask('Remove member',[{k:'u',l:'User',o:m.members}],v=>go(()=>{m.members=m.members.filter(x=>x!==v.u);log(`Removed ${v.u} from ${m.name}`);return `Removed ${v.u}`}))};
const lic=s=>go(()=>{const u=need(s);if(!u.lic&&S.users.filter(x=>x.lic).length>=10)throw Error('No licences left. Remove one first');u.lic=!u.lic;log(`${u.lic?'Assigned':'Removed'} licence for ${s}`);return `${u.lic?'Assigned':'Removed'} M365 E3 licence for ${s}`});

// ---- Entra ID ----
function entra(){return `<h2>Entra ID and MFA</h2><div class="card row"><div><b>Conditional Access: require MFA for all sign-ins</b><br><small>When on, users without MFA registered cannot sign in.</small></div><button onclick="S.ca=!S.ca;log('Conditional Access '+(S.ca?'enabled':'disabled'));save();render()">${S.ca?'Turn off':'Turn on'}</button></div>`+
 tbl(['User','MFA','Sign-in','Actions'],S.users.map(u=>`<tr><td><b>${esc(u.name)}</b><br><small>${u.sam}</small></td><td>${u.mfa?bd('Registered','ok'):bd('Not registered','warn')}</td><td>${u.blocked?bd('Blocked','bad'):bd('Allowed','ok')}</td><td>
 <button class="g" onclick="signin('${u.sam}')">Test sign-in</button><button class="g" onclick="mfa('${u.sam}')">${u.mfa?'Require MFA re-register':'Complete MFA registration'}</button><button class="g" onclick="blk('${u.sam}')">${u.blocked?'Unblock':'Block sign-in'}</button></td></tr>`))+
 `<h3 style="margin-top:18px">Sign-in logs</h3>`+(S.signins.length?tbl(['Time','User','Result'],S.signins.map(s=>`<tr><td>${s.t}</td><td>${s.u}</td><td>${bd(s.ok?'Success':'Failed',s.ok?'ok':'bad')} ${s.r}</td></tr>`)):'<p class="mute">Run a test sign-in to see results here.</p>')}
function signin(s){const u=need(s);let r,ok=0;if(!u.en)r='Account is disabled';else if(u.blocked)r='Sign-in blocked by admin';else if(u.locked)r='Account is locked out';else if(S.ca&&!u.mfa)r='MFA registration required (Conditional Access)';else{r='Signed in';ok=1}
 S.signins.unshift({t:now(),u:s,r,ok});S.signins=S.signins.slice(0,10);log(`Sign-in test ${s}: ${r}`);T(`${s}: ${r}`,!ok);save();render()}
const mfa=s=>go(()=>{const u=need(s);u.mfa=!u.mfa;log(`MFA ${u.mfa?'registered':'reset'} for ${s}`);return u.mfa?'MFA registered':`${s} must re-register MFA at next sign-in`});
const blk=s=>go(()=>{const u=need(s);u.blocked=!u.blocked;log(`${u.blocked?'Blocked':'Unblocked'} sign-in for ${s}`);return `${s} ${u.blocked?'blocked':'unblocked'}`});

// ---- Devices ----
function dev(){return `<h2>Devices (Intune and SCCM style)</h2><div class="bar"><button onclick="enroll()">Enrol device</button></div>`+
 tbl(['Device','Owner','Compliance','Apps','Actions'],S.devices.map((d,i)=>`<tr><td><b>${esc(d.name)}</b><br><small>${d.os} · synced ${d.sync}</small></td><td>${d.owner}</td><td>${d.lock?bd('Locked','warn'):d.patch?bd('Compliant','ok'):bd('Not compliant: updates missing','bad')}</td><td>${d.apps.join(', ')||'-'}</td><td>
 <button class="g" onclick="dv(${i},'sync')">Sync</button><button class="g" onclick="dv(${i},'upd')">Install updates</button><button class="g" onclick="dv(${i},'app')">Deploy app</button><button class="g" onclick="dv(${i},'lock')">${d.lock?'Unlock':'Remote lock'}</button><button class="g" onclick="dv(${i},'ret')">Retire</button></td></tr>`))}
const enroll=()=>ask('Enrol device',[{k:'n',l:'Device name'},{k:'o',l:'Owner',o:sams()}],v=>go(()=>{S.devices.push({name:v.n.toUpperCase().replace(/[^A-Z0-9-]/g,''),owner:v.o,os:'Windows 11 23H2',patch:false,sync:'just now',apps:[],lock:false});log(`Enrolled ${v.n} for ${v.o}`);return 'Device enrolled. It needs updates before it is compliant'}));
function dv(i,a){const d=S.devices[i];if(a==='app')return ask('Deploy app',[{k:'a',l:'Application',o:['Chrome','7-Zip','Teams','Zoom']}],v=>go(()=>{if(d.apps.includes(v.a))throw Error(v.a+' already installed');d.apps.push(v.a);log(`Deployed ${v.a} to ${d.name}`);return `${v.a} deployed to ${d.name}`}));
 go(()=>{if(a==='sync'){d.sync='just now';log('Synced '+d.name);return d.name+' synced'}if(a==='upd'){if(d.patch)throw Error('Already up to date');d.patch=true;d.sync='just now';log('Updates installed on '+d.name);return 'Updates installed. '+d.name+' is compliant'}
  if(a==='lock'){d.lock=!d.lock;log((d.lock?'Locked ':'Unlocked ')+d.name);return d.name+(d.lock?' locked':' unlocked')}S.devices.splice(i,1);log('Retired '+d.name);return d.name+' retired'})}

// ---- PowerShell ----
function ps(c){const t=c.match(/"[^"]*"|\S+/g),cmd=t[0].toLowerCase(),p={};for(let i=1;i<t.length;i++)if(t[i][0]==='-'){p[t[i].slice(1).toLowerCase()]=(t[i+1]||'').replace(/"/g,'');i++}
 const id=p.identity,row=u=>`${u.sam.padEnd(16)}${u.ou.padEnd(12)}${(u.en?'True':'False').padEnd(9)}${u.locked}`;
 switch(cmd){case 'help':return ['Get-ADUser -Filter *   or   -Identity <sam>','New-ADUser -Name "First Last" -Path <OU>','Unlock-ADAccount -Identity <sam>','Disable-ADAccount | Enable-ADAccount -Identity <sam>','Set-ADAccountPassword -Identity <sam>','Add-ADGroupMember -Identity <group> -Members <sam>','Get-ADGroupMember -Identity <group>','Get-Mailbox | ipconfig | whoami | cls'];
 case 'get-aduser':S.flags.psList=1;return ['SamAccountName   OU          Enabled  Locked',...(id?[need(id)]:S.users).map(row)];
 case 'new-aduser':return [C.create(p.name,p.path||'Sales')];case 'unlock-adaccount':return [C.unlock(id)];case 'disable-adaccount':return [C.toggle(id,false)];case 'enable-adaccount':return [C.toggle(id,true)];
 case 'set-adaccountpassword':return [C.reset(id)];case 'add-adgroupmember':return [C.group(id,p.members)];
 case 'get-adgroupmember':{if(!S.groups.includes(id))throw Error(`Group '${id}' not found`);const m=S.users.filter(u=>u.groups.includes(id));return m.length?m.map(u=>u.name):['(no members)']}
 case 'get-mailbox':return [...S.shared.map(m=>m.name+'  Shared'),...S.users.map(u=>u.sam+'@corp.local  User')];
 case 'ipconfig':return ['Ethernet adapter Ethernet0:','   IPv4 Address. . . : 192.168.1.25','   Subnet Mask . . . : 255.255.255.0','   Default Gateway . : 192.168.1.1'];
 case 'whoami':return ['corp\\helpdesk.admin'];case 'cls':case 'clear':out=[];return [];
 default:throw Error(`'${t[0]}' is not recognized as a cmdlet. Type help`)}}
function key(e){const i=e.target;if(e.key==='Enter'){const c=i.value.trim();if(!c)return;hist.push(c);hi=hist.length;out.push('PS C:\\> '+c);try{out.push(...ps(c))}catch(x){out.push('ERROR: '+x.message)}save();render()}
 else if(e.key==='ArrowUp'&&hi>0)i.value=hist[--hi];else if(e.key==='ArrowDown')i.value=hist[++hi]||''}
const psView=()=>`<h2>PowerShell console</h2><p class="mute">Commands change the same lab data as the buttons. Use the up arrow for history.</p><div id="term">${esc(out.join('\n'))}</div><input id="pin" placeholder="Type a command, e.g. Get-ADUser -Filter *" onkeydown="key(event)" autocomplete="off" aria-label="PowerShell command">`;

// ---- Missions ----
const MIS=[['Priya Nair is locked out. Unlock her account.','Active Directory tab, Unlock.',()=>!U('priya.nair')?.locked],
 ['Onboard a new joiner: create "Arjun Rao" in the Sales OU.','New user in Active Directory, or New-ADUser in PowerShell.',()=>U('arjun.rao')?.ou==='Sales'],
 ['Rohit Singh forgot his password. Reset it.','Active Directory, Reset password.',()=>U('rohit.singh')?.pwReset],
 ['Add Neha Verma to the IT-Support group.','Add to group on her row.',()=>U('neha.verma')?.groups.includes('IT-Support')],
 ['Create the shared mailbox support@corp.local and give Neha access.','Microsoft 365 tab: New shared mailbox, then Grant.',()=>S.shared.some(m=>m.name==='support@corp.local'&&m.full.includes('neha.verma'))],
 ['Karan Mehta has left. Disable his account and remove his licence.','Disable in Active Directory, Remove in Licences.',()=>U('karan.mehta')&&!U('karan.mehta').en&&!U('karan.mehta').lic],
 ['Rahul Gupta got a new phone. Make him re-register MFA.','Entra ID tab, Require MFA re-register.',()=>U('rahul.gupta')?.mfa===false],
 ['LT-ROHIT-02 is not compliant. Fix it.','Devices tab, Install updates.',()=>S.devices.find(d=>d.name==='LT-ROHIT-02')?.patch],
 ['In PowerShell, list every user with Get-ADUser.','Type Get-ADUser -Filter *',()=>S.flags.psList]];
function mis(){const n=MIS.filter(m=>m[2]()).length;return `<h2>Missions</h2><p>${n} of ${MIS.length} complete</p><div class="prog"><i style="width:${n/MIS.length*100}%"></i></div>`+
 MIS.map((m,i)=>`<div class="card row"><div><b>${m[2]()?'✓ ':''}${m[0]}</b>${hints[i]?`<br><small>Hint: ${m[1]}</small>`:''}</div><div><button class="g" onclick="hints[${i}]=!hints[${i}];render()">Hint</button><button class="g" onclick="T(MIS[${i}][2]()?'Done. Nice work':'Not done yet',!MIS[${i}][2]())">Check</button></div></div>`).join('')}

// ---- Overview ----
function home(){const n=MIS.filter(m=>m[2]()).length;return `<h2>InfraLab: IT infrastructure home lab</h2><p class="mute">A safe practice environment that simulates the daily work of an IT Ops helpdesk: Active Directory, Microsoft 365, Entra ID, Intune and PowerShell.</p><div class="grid">`+
 [['Users',S.users.length],['Locked',S.users.filter(u=>u.locked).length],['Disabled',S.users.filter(u=>!u.en).length],['Licences used',S.users.filter(u=>u.lic).length+'/10'],['Non-compliant devices',S.devices.filter(d=>!d.patch).length],['Missions done',n+'/'+MIS.length]].map(([l,v])=>`<div class="card stat"><b>${v}</b><span>${l}</span></div>`).join('')+
 `</div><div class="bar"><button onclick="tab='mis';render()">Start missions</button><button class="g" onclick="exportLog()">Export activity log</button><button class="d" onclick="if(confirm('Reset all lab data?')){S=seed();out=['Lab reset.'];save();render();T('Lab reset')}">Reset lab</button></div>
 <div class="card"><h3>Activity log</h3>${S.log.length?S.log.slice(0,12).map(l=>`<div class="row"><span>${esc(l.m)}</span><small>${l.t}</small></div>`).join(''):'<p class="mute">No activity yet. Try a mission.</p>'}</div>`}
function exportLog(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.log.map(l=>`${l.t}  ${l.m}`).join('\n')||'No activity'],{type:'text/plain'}));a.download='infralab-activity.txt';a.click()}

const TABS=[['home','Overview'],['ad','Active Directory'],['m365','Microsoft 365'],['entra','Entra ID and MFA'],['dev','Devices'],['ps','PowerShell'],['mis','Missions']],VIEWS={home,ad,m365,entra,dev,ps:psView,mis};
function render(){$('#nav').innerHTML='<h1>InfraLab</h1><p>IT infrastructure home lab</p>'+TABS.map(([k,l])=>`<button class="${tab===k?'on':''}" onclick="tab='${k}';q='';render()">${l}</button>`).join('');
 $('#main').innerHTML=VIEWS[tab]();if(tab==='ps'){const t=$('#term');t.scrollTop=t.scrollHeight;$('#pin').focus()}}
render();
