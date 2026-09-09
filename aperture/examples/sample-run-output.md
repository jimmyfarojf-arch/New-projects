# Sample run output

Real output from an actual (offline / mock-LLM) run of the pipeline, topic: **garden fence installation**. Included so the shape of a run is reviewable without having to execute anything.

## 1. Research

```json
{
  "topic": "garden fence installation",
  "longTailQuestions": [
    {
      "question": "What is garden fence installation?",
      "demandSignal": "high"
    },
    {
      "question": "How much does garden fence installation cost?",
      "demandSignal": "high"
    },
    {
      "question": "Is garden fence installation worth it?",
      "demandSignal": "medium"
    },
    {
      "question": "Best garden fence installation for beginners",
      "demandSignal": "medium"
    },
    {
      "question": "garden fence installation vs alternatives",
      "demandSignal": "low"
    }
  ],
  "competitorThemes": [
    "Pricing and cost breakdowns",
    "Step-by-step how-to guides",
    "Comparison / vs. pages"
  ],
  "suggestedSubtopics": [
    "Definition and context",
    "Cost factors",
    "Common mistakes",
    "Frequently asked questions"
  ]
}
```

## 2. Content brief

```json
{
  "workingTitle": "Garden fence installation: The Complete Guide",
  "targetAudience": "People actively researching garden fence installation",
  "searchIntent": "informational",
  "outline": [
    "Introduction and direct answer",
    "What \"garden fence installation\" actually means",
    "Key factors to consider",
    "Common mistakes",
    "FAQ"
  ],
  "mustAnswerQuestions": [
    "What is garden fence installation?",
    "How much does garden fence installation typically cost?",
    "Is garden fence installation worth it?"
  ],
  "metaDescription": "A practical, up-to-date guide to garden fence installation -- what it is, what it costs, and how to get it right."
}
```

## 3. Draft

# Garden fence installation: The Complete Guide

Garden fence installation is a common question for anyone weighing their options, and the short answer depends on a few concrete factors covered below.

## What is garden fence installation?
Garden fence installation refers to the process and decisions involved in getting this right for your situation.

## Key factors to consider
- Budget and timeline
- Your specific requirements
- Long-term maintenance

## Common mistakes
Skipping research on this step is the single most common mistake people make.

## FAQ
### What is garden fence installation?
In short, it's the set of choices covered in this guide.
### How much does garden fence installation typically cost?
Costs vary, but budgeting with a clear range in mind avoids surprises.
### Is garden fence installation worth it?
For most people weighing the trade-offs above, yes.

---

**Meta description:** A practical, up-to-date guide to garden fence installation -- what it is, what it costs, and how to get it right.

**Word count:** 130

## 4. Score

```json
{
  "seo": {
    "total": 80,
    "issues": [
      {
        "severity": "warning",
        "message": "Meta description is 113 chars -- under the 120-158 sweet spot."
      },
      {
        "severity": "warning",
        "message": "Keyword density is 5.4% -- likely reads as keyword-stuffed."
      }
    ],
    "breakdown": {
      "headingStructure": 100,
      "metaDescription": 60,
      "keywordUsage": 50,
      "readability": 100
    }
  },
  "geo": {
    "total": 100,
    "issues": [],
    "breakdown": {
      "directAnswerOpening": 100,
      "faqCoverage": 100,
      "longTailCoverage": 100,
      "structuredDataReadiness": 100
    }
  },
  "combined": 91
}
```

## 5. Publish decision

```json
{
  "published": true,
  "target": "mock://local-preview",
  "publishedAt": "2026-09-09T12:59:42.350Z"
}
```
