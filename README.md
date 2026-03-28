# 🚀 HireScan.ai

**HireScan** is an autonomous, AI-driven SaaS platform designed to help technical recruiters and engineering teams automate the tedious process of discovering and evaluating developer portfolios at scale. Powered by the [TinyFish Web Agent API](https://agent.tinyfish.ai/), the application deploys intelligent web agents that navigate websites, read content, and extract structured data just like a human would.

## ✨ Key Features (Tri-Modal Architecture)

1. **Discovery**: Programmatically searches the web to find relevant developer portfolios based on natural language role targeting (e.g., "Next.js Engineers in NY").
2. **Evaluation (Batch CSV)**: Deep-scans individual portfolio URLs to extract key insights—such as the developer's name, their primary tech stack, links to their top projects, and a concise summary of what they build.
3. **End-to-End Orchestration**: Seamlessly combines both discovery and evaluation into a single autonomous pipeline.

## 🛠️ Built With
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, TypeScript
- **Agent Intelligence**: TinyFish API SDK (`@tiny-fish/sdk`)

## 🚦 Getting Started

### 1. Install Dependencies
Install dependencies for both the base orchestrator and the web app:
```bash
npm install
cd web && npm install
```

### 2. Configure Environment Variables
Create your own `.env` configuration file and insert your TinyFish API key:
```bash
cp .env.example .env
# Open .env and add: TINYFISH_API_KEY=your_api_key_here
```

### 3. Run the Dashboard
Start the Next.js development server from the `web` directory:
```bash
cd web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the HireScan Control Console.

## 💻 How It Works
Under the hood, HireScan provisions a headless browser session on the TinyFish infrastructure. Based on your queries, it streams progress and live UI representations (via a streaming URL) directly to your Control Console. When evaluation is complete, the platform shapes the unstructured web data into a strictly typed, CRM-ready `.csv` output matrix for instant download. No manual scraping or rigid CSS selectors required!
