# Portfolio: file guide

| File | What it is | Edit it when |
|---|---|---|
| `index.html` | All the text and structure. Every section has a comment banner such as `<!-- NEWS -->`. | You change wording, add a paper, add news, update dates. |
| `style.css` | Colours, fonts, spacing. The first 15 lines (`:root`) hold the palette. | You want a different look. |
| `script.js` | Three small effects: hero tree-detection picture, number count-up, active nav link. | Rarely. The site works without it. |
| `assets/photo.jpg` | Your headshot (square, about 400x400). Until it exists the page shows "MF". | You add or change your photo. |
| `assets/Farhan_CV.pdf` | The CV behind the "CV" button. | You update the CV (keep the same file name). |

## Common edits (all in `index.html`)
- **Add news:** copy one `<li>...</li>` inside `<section id="news">`, put the newest on top.
- **Add a paper:** copy one `<article class="pub">...</article>` under the right year heading. Change title, authors, tags, TL;DR and the DOI link.
- **Change the tagline or status:** search for `class="tagline"` or `class="status"`.
- **Update numbers:** the four boxes under `class="stats"`. For counting boxes, change `data-count` and the visible text.
- **After convocation:** search for "convocation" and replace the wording with the conferred degree.
- **Footer date:** search for "Last updated".

## Editing on GitHub
GitHub is the master copy once the repo exists. Open a file, click the pencil, edit, press "Commit changes". The site updates within a minute or two. To add files, use Add file, then Upload files. Do not edit a separate local copy as well, or the two will drift apart.
