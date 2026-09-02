# Research agent prompts

Launch all four in one message so they run concurrently. Each gets a 15-minute budget, a word cap,
and "facts only with URLs, no filler". Substitute `{Company}`, `{url}`, `{industry}`, `{region}`.

## 1. Crawl to inventory (after scripts/crawl.sh has run)
> The site is crawled under `{project}/scrape/` (pages/*.md are readable text with links, forms, inputs, images). Write `inventory/features.md`: every page type and feature (forms with exact fields and placeholders, calculators with inputs/outputs, directories and their filters, portals and external links, embeds and which third party, cookie/chat/accessibility widgets, search). Write `inventory/nav-and-footer.md` (every nav item and href including dropdowns and the mobile menu; header CTAs; every footer link and the verbatim legal line; every external URL). Write `inventory/sitemap-summary.md` (counts per section, titles of collection pages). Extend `inventory/brand.md` with the logo description, imagery style, and the brand vocabulary they repeat. No design suggestions, no editorializing. 300-word summary of what you saved and what failed.

## 2. Evidence pass
> Do an evidence pass on {Company} ({url}) for a pitch mock-up. I need VERBATIM material: every headline, tagline, product description, CTA label, nav structure, footer legal text (licence numbers, seals, addresses, phones), numbers (years, customers, ratings, locations), tool and portal names. Brand: primary hex colors from CSS, fonts, logo, imagery. Founder/CEO: bio facts, public quotes about technology or customer experience with source URLs, leadership team, recent news, vendors and stack. Reviews: platform, rating, count, 3-4 verbatim sentences. Technical state of the site: platform, page weight, obvious mobile issues. Max 1200 words under those headings. Quote verbatim with the URL it came from. Flag anything unverified.

## 3. AI in this industry
> Research how {industry} companies use AI on their websites and apps as of {year}. Cover the leaders and the AI-native startups: for each, the feature, what it does for the customer, claimed results, URL. Then: the three biggest unsolved customer pain points with sources (surveys, complaint databases, forums). Then: the compliance constraints an AI feature on a {industry} site must respect, and how shipped features stay safe (disclosures, handoffs, what they refuse to do). Max 900 words: a table, five most impressive ideas, three pain points, a 6-8 bullet guardrail checklist, and one recommendation for a demo feature that would impress a {industry} CEO with three sentences of why.

## 4. Domain facts and demo data
> I am building an AI assistant demo for a {industry} company in {region}. I need accurate numbers so a deterministic engine gives correct answers: the limits, rates, prices, eligibility rules of thumb, and local market figures the assistant will need, each with a date and source URL, as compact tables. Then 5-8 UX patterns for interactive AI in consumer finance/insurance/services (what the interface looks like, what makes it impressive, what it hands to a human) with URLs. Max 1000 words. Flag anything unverified.
