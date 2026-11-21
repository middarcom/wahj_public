// Isolated demonstration: no tenant records, network calls, real identities or operational data.
export const templates = {catalog:'تسليم كتالوج تدريبي',brochure:'تسليم نشرة تعريفية',guide:'تسليم دليل إداري'};
export const samples = {cover:'غلاف تدريبي افتراضي',checklist:'قائمة محتويات افتراضية'};
export const demoSigner='مُعدّ المستند التجريبي';
export const demoReviewer='المراجع التجريبي';
export const demoStorageKey='meidan.admin-document-demo.v1';

export function createDraft(reference, template, attachments, at) {
    if (!templates[template] || !Array.isArray(attachments) || attachments.some(item=>!samples[item])) throw new Error('Invalid demo form');
    return {reference,template,attachments:[...new Set(attachments)], status:'draft', events:[{action:'created',actor:demoSigner,at}]};
}
export function transition(record, action, at) {
    const allowed={draft:['sign'],signed:['approve','return'],approved:[],returned:[]};
    if (!allowed[record.status]?.includes(action)) throw new Error('Invalid demo transition');
    const status={sign:'signed',approve:'approved',return:'returned'}[action];
    return {...record,status,events:[...record.events,{action,actor:action==='sign'?demoSigner:demoReviewer,at}]};
}
export const statuses={draft:'مسودة',signed:'بانتظار الاعتماد',approved:'معتمَد',returned:'معاد للمراجعة'};
export const actions={created:'إنشاء المحضر',sign:'إقرار بالتسليم',approve:'اعتماد المحضر',return:'إعادة للمراجعة'};

// A single-page image PDF for the sample receipt; Arabic lettering is drawn by the browser.
export function imagePdf(jpeg, width, height) {
    const enc=new TextEncoder(), parts=[], offsets=[0]; let length=0;
    function append(value){const bytes=typeof value==='string'?enc.encode(value):value;parts.push(bytes);length+=bytes.length;}
    function object(id,head,stream){offsets[id]=length;append(`${id} 0 obj\n${head}`);if(stream){append('\nstream\n');append(stream);append('\nendstream');}append('\nendobj\n');}
    append('%PDF-1.4\n');
    object(1,'<< /Type /Catalog /Pages 2 0 R >>');
    object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    object(4,`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
    const draw=enc.encode('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n');
    object(5,`<< /Length ${draw.length} >>`,draw);
    const start=length;
    append(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
    const bytes=new Uint8Array(length);let cursor=0;
    for(const part of parts){bytes.set(part,cursor);cursor+=part.length;}
    return bytes;
}
