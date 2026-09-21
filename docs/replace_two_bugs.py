from pathlib import Path
from docx import Document

root=Path(__file__).parent
rows={}
for line in (root/'BUGS.md').read_text(encoding='utf-8').splitlines():
    if line.startswith('| BUG-'):
        row=[x.strip().replace('`','') for x in line.split('|')[1:-1]]
        rows[row[0]]=row
path=root/'Описание_внесённых_ошибок_BarMixHub.docx'
doc=Document(path)
note='Для проверки BUG-01 сначала заполните email, затем телефон и имя, чтобы BUG-04 не мешал отправке. BUG-04 проверяется без отправки формы. BUG-02 проверяется без платежа. BUG-08 открывается ссылкой «Согласие на рассылку». Список охватывает намеренные изменения и не гарантирует отсутствие иных дефектов.'
for para in doc.paragraphs:
    for key in ['BUG-04','BUG-06']:
        if para.text.startswith(key+'.'):
            i,t,steps,actual,expected=rows[key]
            para.text=f'{i}. Тип: {t}. Шаги: {steps}. Фактическое поведение: {actual}. Ожидаемое поведение: {expected}.'
    if para.text.startswith('BUG-01 и BUG-04'):
        para.text=note
doc.save(path)
builder=root/'build_documents.py'
s=builder.read_text(encoding='utf-8')
s=s.replace('BUG-01 и BUG-04 могут проявляться совместно. Для отдельной проверки BUG-04 использовать пустое имя. BUG-02 проверяется без платежа. BUG-08 открывается ссылкой «Согласие на рассылку». Список охватывает намеренные изменения и не гарантирует отсутствие иных дефектов.',note)
builder.write_text(s,encoding='utf-8')
