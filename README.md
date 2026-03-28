# LeadFish: Autonomous B2B Lead Generation Agent

LeadFish is a command-line application that automates the tedious process of B2B prospecting. It utilizes the [TinyFish Web Agent API](https://agent.tinyfish.ai/) to navigate company directories, extract target companies based on specific criteria, and scrape their individual websites for contact information and key decision-makers.

## Features

- **Autonomous Navigation**: Provide a query, and LeadFish's agent navigates 'ycombinator.com/companies' to find matching startups.
- **Deep Scraping**: Visits each startup's actual website.
- **Data Extraction**: Extracts the company name, website URL, potential contact emails, founder names from the "About" page, and careers links.
- **CSV Export**: Outputs all gathered intelligence into a clean, CRM-ready CSV file.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   Copy `.env.example` to `.env` and insert your TinyFish API key.
   ```bash
   cp .env.example .env
   # Edit .env and supply your TINYFISH_API_KEY
   ```

3. **Run the tool**
   ```bash
   npm run start -- org-search --query "AI Healthcare" --limit 3
   ```

## Example Usage

```bash
$ npm run start -- org-search --query "Developer Tools" --limit 5

🐟 LeadFish Agent Initialized
Targeting: Developer Tools (Limit: 5)
⠦ Initializing TinyFish Web Agent...
⠧ Processing step... (Extracting company URLs)
⠏ Live View: https://example.com/streaming-url-from-tinyfish
✔ Successfully extracted 5 leads!

Saved output to leads.csv
```

## How It Works

Under the hood, LeadFish uses `@tiny-fish/sdk` to construct a multi-step goal for an autonomous web agent. The agent natively comprehends the instruction, navigates the web pages using a headless browser on TinyFish infrastructure, clicks links, and shapes the returned data into the strictly typed JSON format we enforce. No rigid CSS selectors needed!

### Built With:
- TypeScript / Node.js
- `@tiny-fish/sdk`
- Commander
- json2csv
