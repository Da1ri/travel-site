# Travel-site — «Мандрівник»

Статичний сайт туристичної компанії, побудований у межах серії
лабораторних робіт з курсу «Веб-технології і веб-дизайн».

## CI/CD

Сайт автоматично публікується на GitHub Pages при кожному push у `main`
через workflow `.github/workflows/deploy.yml` (GitHub Actions).

Кроки для першого розгортання:

1. Створити публічний репозиторій `travel-site` на GitHub.
2. У `Settings → Pages` обрати **Source: GitHub Actions**.
3. Запушити код у `main` — workflow збере та опублікує сайт.
4. Сайт доступний за `https://<user>.github.io/travel-site/`.

## SEO

- `<title>`, `meta description`, `keywords`, `canonical`
- Open Graph + Twitter Cards
- Schema.org JSON-LD (`TravelAgency`)
- `robots.txt` + `sitemap.xml`

## Web Vitals

- `preload` критичного CSS — менший LCP
- System-fonts (без зовнішніх запитів) — менший FOIT/FOUT
- Резервування простору через `min-height` у hero — CLS близько до 0
