-- Ujednolicenie opisów HBOT w seedowanych rozdziałach e-booka
UPDATE public.ebook_chapters
   SET body_md = replace(body_md, '1,5–2,0 ATA', '1,5–3,0 ATA')
 WHERE body_md LIKE '%1,5–2,0 ATA%';

UPDATE public.ebook_chapters
   SET title     = replace(title, 'Dzień 0', 'Doba „Zero"'),
       day_label = replace(day_label, 'Dzień 0', 'Doba „Zero"'),
       body_md   = replace(body_md, 'Dzień 0', 'Doba „Zero"')
 WHERE slug = 'dzien-0';