import {templates,samples,createDraft,transition,actions,statuses,demoSigner,demoReviewer,demoStorageKey,imagePdf} from './meidan-admin-handover-demo.mjs';
const byId=id=>document.getElementById(id);
let records=[];
try{const saved=JSON.parse(localStorage.getItem(demoStorageKey)||'[]');if(Array.isArray(saved))records=saved;}catch{/* empty local demo */}
let selected=records.at(-1)?.reference;
const at=()=>new Date().toISOString();
const date=value=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(value));
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function button(label,fn,primary=false){const node=el('button',label,primary?'primary':'');node.type='button';node.addEventListener('click',fn);return node;}
function persist(){try{localStorage.setItem(demoStorageKey,JSON.stringify(records));}catch{byId('feedback').textContent='تعذر حفظ العرض في المتصفح.';}}
function current(){return records.find(item=>item.reference===selected);}
function update(action){const row=current();if(!row)return;try{const updated=transition(row,action,at());records=records.map(item=>item.reference===selected?updated:item);persist();render();byId('feedback').textContent=actions[action]+' — تم في المختبر.';}catch{byId('feedback').textContent='هذا الإجراء غير متاح في الحالة الحالية.';}}
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function sampleAttachment(key){const canvas=document.createElement('canvas');canvas.width=800;canvas.height=500;const ctx=canvas.getContext('2d');ctx.fillStyle='#eef5f7';ctx.fillRect(0,0,800,500);ctx.fillStyle='#007d83';ctx.fillRect(50,50,700,80);ctx.fillStyle='white';ctx.textAlign='center';ctx.direction='rtl';ctx.font='bold 30px Tahoma, sans-serif';ctx.fillText(samples[key],400,100);ctx.fillStyle='#153650';ctx.font='25px Tahoma, sans-serif';ctx.fillText('مثال توضيحي — بيانات افتراضية',400,245);canvas.toBlob(blob=>{if(blob)download(blob,`demo-${key}.png`);},'image/png');}
async function exportPdf(row){
    const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;const ctx=canvas.getContext('2d');
    ctx.fillStyle='white';ctx.fillRect(0,0,1190,1684);ctx.fillStyle='#153650';ctx.fillRect(0,0,1190,180);ctx.textAlign='right';ctx.direction='rtl';ctx.fillStyle='white';ctx.font='bold 42px Tahoma, sans-serif';ctx.fillText('محضر تسليم مستندات إدارية — تجريبي',1120,90);ctx.font='24px Tahoma, sans-serif';ctx.fillText('لا يمثل مستندًا رسميًا أو اعتمادًا حقيقيًا',1120,135);
    let y=245;function line(value,bold=false){ctx.fillStyle='#153650';ctx.font=`${bold?'bold ':''}30px Tahoma, sans-serif`;ctx.fillText(value,1100,y,1000);y+=52;}
    line('رقم المحضر: '+row.reference,true);line('نوع النموذج: '+templates[row.template]);line('الحالة: '+statuses[row.status]);line('المرفقات الافتراضية:',true);for(const key of row.attachments)line('• '+samples[key]);if(!row.attachments.length)line('لا يوجد مرفق');y+=20;line('سجل الإجراءات والإقرارات:',true);for(const event of row.events){line(actions[event.action]+' — '+event.actor);line(date(event.at));}
    const jpegBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));if(!jpegBlob){byId('feedback').textContent='تعذر إنشاء PDF.';return;}
    const bytes=imagePdf(new Uint8Array(await jpegBlob.arrayBuffer()),canvas.width,canvas.height);download(new Blob([bytes],{type:'application/pdf'}),`${row.reference}.pdf`);byId('feedback').textContent='تم إعداد تقرير PDF التجريبي.';
}
function render(){
    const metrics=byId('metrics');metrics.replaceChildren();for(const [label,count] of [['المحاضر',records.length],['بانتظار الاعتماد',records.filter(r=>r.status==='signed').length],['المعتمدة',records.filter(r=>r.status==='approved').length]]){const item=el('div',undefined,'metric');item.append(el('small',label),el('strong',String(count)));metrics.append(item);}
    byId('record-count').textContent=String(records.length)+' محضر';const list=byId('records');list.replaceChildren();if(!records.length)list.append(el('p','لا توجد محاضر تجريبية.'));
    for(const row of [...records].reverse()){const item=el('div',undefined,'item');item.dataset.selected=String(row.reference===selected);let info=el('div',undefined,'stack');info.style.gap='4px';info.append(el('strong',templates[row.template]),el('small',row.reference+' · '+statuses[row.status]));item.append(info,button('عرض المحضر',()=>{selected=row.reference;render();}));list.append(item);}
    const detail=byId('detail'),row=current();detail.replaceChildren();if(!row){detail.append(el('p','اختر محضرًا من السجل أو أنشئ محضرًا جديدًا.'));return;}
    const heading=el('div',undefined,'sectionhead');heading.append(el('h2',templates[row.template]),el('span',statuses[row.status],'status'));detail.append(heading,el('p',row.reference));
    const attachmentBox=el('div',undefined,'stack');attachmentBox.append(el('h3','المرفقات'));for(const key of row.attachments){const item=el('div',undefined,'item');item.append(el('span',samples[key]),button('تنزيل العينة',()=>sampleAttachment(key)));attachmentBox.append(item);}if(!row.attachments.length)attachmentBox.append(el('p','لا يوجد مرفق.'));detail.append(attachmentBox);
    const controls=el('div',undefined,'stack');controls.append(el('h3','الإقرار والاعتماد التجريبي'));
    if(row.status==='draft'){const line=el('label',undefined,'sample'),check=el('input');check.type='checkbox';check.id='acknowledge';line.append(check,el('span','أقر باستلام المستندات الافتراضية بصفة '+demoSigner));const sign=button('تسجيل الإقرار التجريبي',()=>update('sign'),true);sign.disabled=true;check.addEventListener('change',()=>{sign.disabled=!check.checked;});controls.append(line,sign);}
    if(row.status==='signed'){controls.append(el('p','محاكاة المراجع: '+demoReviewer));const group=el('div',undefined,'row');group.append(button('اعتماد تجريبي',()=>update('approve'),true),button('إعادة للمراجعة',()=>update('return')));controls.append(group);}
    if(['approved','returned'].includes(row.status))controls.append(el('p','انتهت المحاكاة؛ تم حفظ الإجراء في سجل التجربة.'));
    detail.append(controls);const history=el('div',undefined,'stack'),timeline=el('ol',undefined,'timeline');history.append(el('h3','سجل الإجراءات'));for(const event of row.events){const item=el('li');item.append(el('strong',actions[event.action]),el('p',event.actor+' · '+date(event.at)));timeline.append(item);}history.append(timeline);detail.append(history,button('تصدير PDF تجريبي',()=>void exportPdf(row)));
}
byId('create').addEventListener('submit',event=>{event.preventDefault();const attachments=[...document.querySelectorAll('input[name="attachment"]:checked')].map(input=>input.value);const reference='DEMO-'+String(records.length+1).padStart(4,'0');records.push(createDraft(reference,byId('template').value,attachments,at()));selected=reference;persist();render();byId('feedback').textContent='تم حفظ المحضر التجريبي في المتصفح.';});
render();
