from pathlib import Path

path = Path(__file__).with_name('build_spec.py')
s = path.read_text(encoding='utf-8')
s = s.replace('from docx.enum.text import WD_ALIGN_PARAGRAPH', 'from docx.enum.text import WD_ALIGN_PARAGRAPH\nfrom docx.enum.section import WD_SECTION_START')
start = s.index("center('Дисциплина")
end = s.index("h('1 Введение')", start)
s = s[:start] + '''
code = 'SEC-BARMEN.01 ТЗ'
center('Организация ______________________________', size=12)
q=p('УТВЕРЖДАЮ\\nРуководитель учебного проекта\\n____________ / __________________\\n«____» ______________ 2026 г.')
q.alignment=WD_ALIGN_PARAGRAPH.RIGHT
q.paragraph_format.first_line_indent=Cm(0)
q.paragraph_format.space_before=Pt(26)
center('ВЕБ-ПРИЛОЖЕНИЕ BARMIXHUB\\nДЛЯ ПРЕДСТАВЛЕНИЯ БАРНОГО ИНТЕНСИВА\\nИ ОФОРМЛЕНИЯ ЗАЯВОК', size=16, bold=True, before=40, style='Title')
center('Техническое задание', before=16)
center('ЛИСТ УТВЕРЖДЕНИЯ', bold=True, before=10)
center(code + '-ЛУ\\nЭлектронный документ', size=12)
q=p('Разработчик\\n____________ / __________________\\nГруппа _________________________\\n«____» ______________ 2026 г.\\n\\nНормоконтролер\\n____________ / __________________\\n«____» ______________ 2026 г.')
q.alignment=WD_ALIGN_PARAGRAPH.RIGHT
q.paragraph_format.first_line_indent=Cm(0)
q.paragraph_format.space_before=Pt(30)
center('2026', before=20)

# Лист утверждения не включается в нумерацию самого ТЗ.
sec = doc.add_section(WD_SECTION_START.NEW_PAGE)
sec.header.is_linked_to_previous = False
sec.different_first_page_header_footer = True
pg = OxmlElement('w:pgNumType'); pg.set(qn('w:start'), '1'); sec._sectPr.append(pg)
head=sec.header.paragraphs[0]
head.alignment=WD_ALIGN_PARAGRAPH.CENTER
head.paragraph_format.first_line_indent=Cm(0)
field=OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); head._p.append(field)
q=p('УТВЕРЖДЕН\\n' + code + '-ЛУ')
q.alignment=WD_ALIGN_PARAGRAPH.LEFT
q.paragraph_format.first_line_indent=Cm(0)
center('ВЕБ-ПРИЛОЖЕНИЕ BARMIXHUB\\nДЛЯ ПРЕДСТАВЛЕНИЯ БАРНОГО ИНТЕНСИВА\\nИ ОФОРМЛЕНИЯ ЗАЯВОК', size=16, bold=True, before=130, style='Title')
center('Техническое задание', size=16, before=24)
center(code + '\\nЭлектронный документ', size=12, before=12)
center('Листов 6', size=12, before=12)
center('Дисциплина\\nТестирование и верификация программного обеспечения', size=12, before=54)
center('2026', before=110)
page()
''' + s[end:]
# Текст идёт непрерывно, чтобы сохранить объём с отдельным листом утверждения.
s = s.replace("\npage()\nh('4", "\nh('4").replace("\npage()\nh('7", "\nh('7")
needle="h('4.1.2 Информация об интенсиве', 3)"
s=s.replace(needle, "p('Кнопка «Войти в систему» должна открывать в новой вкладке доступную страницу авторизации внешней системы. Исходная страница сайта должна оставаться открытой. Сама авторизация, регистрация и личный кабинет внешней системы в состав поставки не входят. При приёмке проверяется успешное открытие страницы авторизации, без ввода учётных данных.')\n" + needle)
old="p('Документы перед оформлением должны открываться по ссылкам с понятными названиями: политика конфиденциальности, оферта и согласия. Открытие документа в новой вкладке не должно очищать заполненную форму. Тексты страниц должны отображаться на русском языке.')"
new="p('Должны быть доступны пять документов: политика конфиденциальности (/privacy); договор оферты (/offer); согласие на обработку персональных данных (/consent); согласие на распространение данных (/distribution-consent); согласие на рассылку (/mailing-consent). Каждая ссылка должна открывать страницу с названием и полным текстом соответствующего документа на русском языке. Пустая страница не является допустимым результатом. Открытие документа в новой вкладке не должно очищать заполненную форму.')"
assert old in s
s=s.replace(old,new)
s=s.replace('Минимальная конфигурация: двухъядерный', 'Плановая конфигурация для приёмки: двухъядерный')
s=s.replace('памяти, 2 Гбайт свободного места, клавиатура', 'памяти, 2 Гбайт свободного места, клавиатура')
s=s.replace('Для локального сервера должен быть свободен порт 4242, для режима разработки — также порт 5173.', 'Для локального сервера должен быть свободен порт 4242, для режима разработки — также порт 5173. Фактическую конфигурацию фиксируют перед испытаниями; указанные параметры не являются результатом измерения минимальных ресурсов.')
s=s.replace('календарные даты устанавливаются руководителем.', 'календарные даты и плановую длительность утверждает руководитель при согласовании ТЗ.')
s=s.replace('раскрытие FAQ, мобильное меню, совпадение стоимости и открытие документов.', 'раскрытие FAQ, мобильное меню, совпадение стоимости, открытие всех пяти документов с полным текстом и переход по кнопке «Войти в систему» к внешней странице авторизации.')
s=s.replace('дата обращения 07.09.2026', 'дата обращения 13.09.2026')
path.write_text(s, encoding='utf-8')
