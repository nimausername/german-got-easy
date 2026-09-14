# Image attribution

Vocabulary illustrations come from **[Wikimedia Commons](https://commons.wikimedia.org)**. Media licenses are **separate** from the CC BY 4.0 license that covers lesson and word-bank **text** in [`LICENSE-CONTENT`](../LICENSE-CONTENT).

## Policy

1. Prefer **Public domain** or **CC0**.
2. Allow **CC BY** and **CC BY-SA** when a clear free image is needed; always store and display credit.
3. Never use NC, ND, or unclear “all rights reserved” media.
4. Skip PEOPLE portraits and abstract lemmas — images are for concrete nouns (food, home objects, vehicles, places).
5. Store a **direct** `upload.wikimedia.org` (or `thumb.wikimedia.org`) image URL that returns `image/jpeg` (HTTP 200). Do **not** use `Special:FilePath` redirects — they break in-app image loading.

## Wordbank shape

Optional nested object on a word entry in `backend/content/wordbank/*.json`:

```json
"image": {
  "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/960px-Red_Apple.jpg",
  "credit": "Abhijit Tembhekar",
  "license": "CC BY 2.0",
  "sourceUrl": "https://commons.wikimedia.org/wiki/File:Red_Apple.jpg"
}
```

Seed maps these to `Word.imageUrl`, `imageCredit`, `imageLicense`, and `imageSourceUrl`.

## How to add an image

1. Find a file on Commons and open the file page.
2. Confirm the license badge (CC0 / PD / CC BY / CC BY-SA).
3. Copy author credit from the file page.
4. Add the `image` object to the word JSON.
5. Run `pnpm --dir backend prisma:seed`.
6. Check `/vocabulary/[wordId]` shows the photo and attribution caption.

## In-app display

The vocabulary detail page shows the image (when present) and a caption:

`Photo: {credit} · {license} · Wikimedia Commons` (link to `sourceUrl`).
