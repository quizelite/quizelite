# QuizElite 🤖

Free computer hardware quiz website built with plain HTML/CSS/JavaScript. No build step, no frameworks.

**Features**

- 6 categories: CPU, RAM, Storage, GPU, Motherboard & Power, Peripherals
- 4 difficulty levels (Easy / Medium / Hard / Mixed)
- 40+ questions with instant scoring and explanations
- Fully responsive, works on mobile
- AdSense-ready: includes About, Privacy Policy and Contact pages

## Run locally

Just open `index.html` in your browser, or serve it:

```bash
python -m http.server 8000
# or
npx serve .
```

Then visit http://localhost:8000

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `hardwarequiz`).
2. Push this folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hardwarequiz.git
git push -u origin main
```

3. In the repo: **Settings → Pages → Source: Deploy from a branch → `main` / root → Save**.
4. Your site will be live at `https://YOUR_USERNAME.github.io/hardwarequiz/`

## Custom domain

1. Buy a domain (Namecheap, Cloudflare, GoDaddy, etc.).
2. In GitHub: **Settings → Pages → Custom domain** → enter `yourdomain.com`.
3. At your domain provider, add DNS records:
   - **A records** pointing to:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or a **CNAME record**: `www` → `YOUR_USERNAME.github.io`
4. Wait for DNS propagation, then enable **Enforce HTTPS** in GitHub Pages settings.
5. Add a `CNAME` file in the repo root containing just your domain (GitHub does this automatically if set via UI).

## Google AdSense checklist

- [x] Original content (quiz questions)
- [x] Privacy Policy page (with cookie/ads disclosure)
- [x] About page
- [x] Contact page
- [ ] Site live on a custom domain for at least a few days
- [ ] Apply at https://adsense.google.com
- [ ] After approval, paste the ad code snippet into pages
- [ ] Create `ads.txt` in the root with your publisher ID line: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`

## Adding questions

Edit `questions.js`. Each question:

```js
{ category: "CPU", difficulty: "easy", question: "...", answers: ["A","B","C","D"], correct: 0 }
```

More questions = better content depth for AdSense approval.
