import type { Guide } from "@/types";

/**
 * How-to guides. Static content for now; shaped by the `Guide` type so it can
 * later move to a CMS without touching page components.
 */
export const guideList: Guide[] = [
  /* ---------------------------------------------------------------- */
  /* 1. Writing effective prompts                                      */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-write-effective-ai-prompts",
    title: "How to Write Effective AI Prompts: A Practical Framework",
    excerpt:
      "Learn a repeatable prompt structure (role, context, task, format and constraints) plus a simple iteration loop for getting useful answers from AI tools.",
    intro:
      "By the end of this guide you will have a reusable five-part structure for writing prompts that works across chat assistants such as ChatGPT, Claude and Gemini. You will learn what each part does, see how a vague request becomes a precise one, and practice a simple iteration loop for improving weak answers without rewriting your whole prompt each time.",
    category: "getting-started",
    difficulty: "Beginner",
    prerequisites: [
      "Access to any AI chat assistant (a free account is enough)",
      "A real task you want help with, such as an email, summary or plan",
      "10–15 minutes to test prompts and compare the results",
    ],
    sections: [
      {
        id: "why-structure-matters",
        heading: "Why structure beats clever wording",
        blocks: [
          {
            type: "p",
            text: "Most disappointing AI answers come from missing information, not from the model. A language model only knows what it learned in training and what you put in the conversation. If you ask it to \"write a product update\", it has to guess the audience, the length, the tone and what the product even is. A prompt structure is simply a checklist that stops you leaving those gaps.",
          },
          {
            type: "p",
            text: "The framework in this guide has five parts: **role**, **context**, **task**, **format** and **constraints**. You will not need all five for every request (a quick factual question needs none of them), but for anything you plan to reuse, publish or send, working through the list takes a minute and saves several rounds of corrections.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Works across tools",
            text: "The pattern is model-agnostic. It applies equally to [ChatGPT](/tools/chatgpt), [Claude](/tools/claude) and other assistants, because it is about giving clear instructions rather than exploiting the quirks of one product.",
          },
        ],
      },
      {
        id: "step-1-role-and-context",
        heading: "Step 1: Set the role and context",
        blocks: [
          {
            type: "p",
            text: "The **role** tells the model which perspective and expertise to adopt. The **context** gives it the facts it cannot know: who the audience is, what has already happened and why the task matters. Of the two, context does most of the work. A role without context produces generic text in a confident voice.",
          },
          {
            type: "code",
            language: "text",
            code: [
              "Role: You are an experienced customer success manager at a B2B software company.",
              "",
              "Context: We are changing our support hours from 24/7 to 8am-8pm Eastern Time,",
              "Monday to Friday. Most customers are small marketing agencies in the US and Canada.",
              "Some have complained about slow responses in the past.",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "tip",
            title: "Paste, don't describe",
            text: "If the model needs to work with a document, data or a previous email, paste the relevant part into the prompt rather than summarizing it from memory. Remove anything confidential first, and follow your organization's rules about what can be shared with AI tools.",
          },
        ],
      },
      {
        id: "step-2-task",
        heading: "Step 2: State the task in one clear sentence",
        blocks: [
          {
            type: "p",
            text: "The **task** is the instruction itself. Start it with a specific verb (draft, summarize, compare, rewrite, classify, outline) and name the deliverable. \"Help with an email\" is a topic; \"Draft an email announcing the new support hours\" is a task.",
          },
          {
            type: "p",
            text: "If the job has several parts, number them. Models follow an explicit sequence more reliably than a paragraph that mixes several instructions together.",
          },
          {
            type: "code",
            language: "text",
            code: [
              "Task: Draft an email to all customers that:",
              "1. Announces the new support hours and the date they start.",
              "2. Explains the reason in one or two sentences.",
              "3. Tells customers how to get urgent help outside those hours.",
            ].join("\n"),
          },
        ],
      },
      {
        id: "step-3-format",
        heading: "Step 3: Specify the output format",
        blocks: [
          {
            type: "p",
            text: "**Format** describes what the answer should look like. Without it, you usually get the model's default, which is often longer and more heavily formatted than you need. Be concrete about:",
          },
          {
            type: "list",
            items: [
              "**Length:** \"under 150 words\" or \"three bullet points\" is clearer than \"short\".",
              "**Structure:** a subject line plus body, a table with named columns, or JSON with specific keys.",
              "**Tone:** plain and friendly, formal, or matched to an example you paste in.",
              "**Reading level:** for example, \"suitable for non-technical readers\".",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Ask for structured data when another tool will use it",
            text: "If the output feeds a spreadsheet or an automation, request JSON or CSV with exact field names, and validate it before use. Models occasionally add commentary or break the syntax.",
          },
        ],
      },
      {
        id: "step-4-constraints-and-examples",
        heading: "Step 4: Add constraints and examples",
        blocks: [
          {
            type: "p",
            text: "**Constraints** are the rules the answer must respect: things to include, things to avoid and facts that must not change. They are where you prevent the most common problems, such as invented details, the wrong terminology or promises you cannot keep.",
          },
          {
            type: "code",
            language: "text",
            code: [
              "Constraints:",
              "- Do not apologize or imply the change is negative.",
              "- Do not mention staffing or costs.",
              "- Use \"support team\", never \"helpdesk\".",
              "- If you need information that is not provided above, ask me instead of guessing.",
            ].join("\n"),
          },
          {
            type: "p",
            text: "Examples are the most effective constraint of all. If you have a past email whose tone you liked, paste it and say \"match the tone and length of this example, but not its content\". One good example usually communicates style better than a paragraph of adjectives.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Let the model admit uncertainty",
            text: "Telling the model it may ask a question or say it does not know reduces invented facts, but it does not eliminate them. Always check names, numbers, dates and links before you publish or send anything.",
          },
        ],
      },
      {
        id: "step-5-iterate",
        heading: "Step 5: Iterate on the answer, not from scratch",
        blocks: [
          {
            type: "p",
            text: "Treat the first response as a draft. Rather than rewriting your prompt, tell the model specifically what to change. Targeted feedback keeps everything that already works.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Read the response and identify the single biggest problem: wrong tone, a missing point, too long.",
              "Give one or two specific corrections, such as \"cut the second paragraph and keep the subject line under 50 characters\".",
              "Ask for alternatives when you are unsure what you want, for example \"give me three different subject lines\".",
              "Once the output is right, copy the improved instructions back into your saved prompt so the next run starts from the better version.",
            ],
          },
          {
            type: "p",
            text: "If a conversation has gone through many revisions and the model starts mixing up instructions, open a new chat and paste in your refined prompt. Long threads tend to drift.",
          },
        ],
      },
      {
        id: "complete-example",
        heading: "Putting it together: a complete prompt",
        blocks: [
          {
            type: "p",
            text: "Here is the full prompt assembled from the steps above. Save prompts like this in a shared document so your team can reuse them with small edits.",
          },
          {
            type: "code",
            language: "text",
            code: [
              "Role: You are an experienced customer success manager at a B2B software company.",
              "",
              "Context: We are changing our support hours from 24/7 to 8am-8pm Eastern Time,",
              "Monday to Friday, starting December 1. Most customers are small marketing agencies",
              "in the US and Canada. Urgent issues can still be reported through our status page.",
              "",
              "Task: Draft an email to all customers that:",
              "1. Announces the new support hours and the start date.",
              "2. Explains the reason in one or two sentences (we are focusing the team on",
              "   faster, more thorough responses during working hours).",
              "3. Tells customers how to get urgent help outside those hours.",
              "",
              "Format: A subject line, then a plain-text email under 150 words.",
              "Friendly, direct tone. No bullet points.",
              "",
              "Constraints:",
              "- Do not apologize or imply the change is negative.",
              "- Use \"support team\", never \"helpdesk\".",
              "- If anything above is unclear, ask me before drafting.",
            ].join("\n"),
          },
          {
            type: "p",
            text: "If you would rather not assemble this by hand, our [prompt generator](/free-ai-tools/prompt-generator) builds a structured starting point from a few form fields. The same pattern works for other jobs too: our guide to [summarizing meetings with AI](/guides/how-to-summarize-meetings-with-ai) includes a ready-made summary template built the same way.",
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting common prompt problems",
        blocks: [
          {
            type: "list",
            items: [
              "**The answer is generic.** Add context: the audience, the situation and what makes your case different. Pasting a real example helps most.",
              "**It ignores an instruction.** Move the instruction nearer the end of the prompt, make it a numbered requirement, or repeat it in your follow-up message.",
              "**It is too long.** Set a hard limit in words, sentences or bullet points rather than asking for something \"concise\".",
              "**It invents facts.** Supply the facts yourself, tell it to ask when information is missing, and verify anything you will publish.",
              "**Results vary between runs.** That is normal. Save the prompt version that works and compare outputs side by side before choosing one.",
            ],
          },
          {
            type: "p",
            text: "The fastest way to improve is to keep a small library of prompts that have worked for you, with a note on what you changed and why.",
          },
        ],
      },
    ],
    authorId: "editorial-team",
    publishedAt: "2026-10-26",
    tags: ["Prompt engineering", "ChatGPT", "Claude", "Beginners"],
    relatedTools: ["chatgpt", "claude", "google-gemini"],
    featured: true,
  },

  /* ---------------------------------------------------------------- */
  /* 2. Choosing the right AI tool                                     */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-choose-the-right-ai-tool",
    title: "How to Choose the Right AI Tool for Your Work",
    excerpt:
      "A practical framework for choosing an AI tool: define the job, check data sensitivity, integrations and pricing, then run a structured, side-by-side trial.",
    intro:
      "This guide gives you a five-step framework for picking an AI tool you will still be happy with in six months. You will define the job you need done, rule out tools that cannot handle your data safely, check how each candidate fits the software you already use, understand how it charges, and finish with a short, structured trial that produces a clear, documented decision instead of a vague impression.",
    category: "getting-started",
    difficulty: "Beginner",
    prerequisites: [
      "A specific task or workflow you want AI to help with",
      "A rough idea of who will use the tool and how often",
      "Your organization's IT or data policy, if one exists",
    ],
    sections: [
      {
        id: "step-1-define-the-job",
        heading: "Step 1: Define the job, not the tool",
        blocks: [
          {
            type: "p",
            text: "Start with the work, not the product category. \"We need an AI writing tool\" leads to endless feature comparisons; \"we need first drafts of product descriptions from a spreadsheet of specs, about 200 a month, in our brand voice\" leads to a decision. Write a one-paragraph job description that covers:",
          },
          {
            type: "list",
            items: [
              "**Input:** what goes in, such as documents, audio, a spreadsheet, a codebase or a short brief.",
              "**Output:** what must come out, and in what format.",
              "**Volume and frequency:** a few times a week, or thousands of items a month.",
              "**Users:** one specialist, a whole team, or your customers.",
              "**Quality bar:** what \"good enough\" looks like, and who checks it.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "A general assistant may be enough",
            text: "Many tasks, including drafting, summarizing, brainstorming and rewriting, are handled well by general assistants such as ChatGPT, Claude or Gemini. Reach for a specialist tool when you need a specific integration, a workflow the assistant cannot handle, or output a general model does poorly.",
          },
        ],
      },
      {
        id: "step-2-data-sensitivity",
        heading: "Step 2: Classify your data sensitivity",
        blocks: [
          {
            type: "p",
            text: "Before comparing features, decide what data the tool will touch. This step rules out more options than any other, and it is far easier to do now than after a team has adopted a tool informally.",
          },
          {
            type: "list",
            items: [
              "**Public:** published content, marketing copy, open-source code. Most tools are acceptable.",
              "**Internal:** plans, internal documents, routine meeting notes. Prefer business plans with clear data-handling terms.",
              "**Confidential or regulated:** customer personal data, health or financial records, unreleased results, code under NDA. Requires a formal review before any use.",
            ],
          },
          {
            type: "p",
            text: "For anything above public, check the vendor's documentation for whether your inputs are used to train models and how to opt out, how long data is retained, where it is stored and processed, admin controls such as single sign-on and audit logs, and security reports such as SOC 2 or ISO 27001. Terms often differ between the free, individual and business plans of the same product, so read the terms for the plan you will actually buy.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Involve IT early",
            text: "If your organization has an approved-tools list or a data protection officer, talk to them before a trial, not after. Our guide to [responsible AI use at work](/blog/responsible-ai-use-at-work) covers the policy questions worth raising.",
          },
        ],
      },
      {
        id: "step-3-integrations",
        heading: "Step 3: Check integrations and workflow fit",
        blocks: [
          {
            type: "p",
            text: "A tool that produces great output but forces people to copy and paste between windows tends to be abandoned. List the systems the work already lives in (email, documents, CRM, project management, code repositories) and check how each candidate connects to them.",
          },
          {
            type: "list",
            items: [
              "**Native integrations:** built-in connections to your existing apps, such as an assistant inside your office suite or code editor.",
              "**Automation platforms:** whether the tool can be connected through Zapier, Make or n8n for workflows it does not support natively.",
              "**API access:** important if developers will build on it. Check whether API usage is billed separately from seats.",
              "**Export:** whether you can get your data, prompts and outputs out if you switch tools later.",
            ],
          },
          {
            type: "p",
            text: "If you expect to connect several apps, read [what AI workflow automation is](/blog/what-is-ai-workflow-automation) before deciding. It may change which tool should sit at the center of your process.",
          },
        ],
      },
      {
        id: "step-4-pricing-model",
        heading: "Step 4: Understand the pricing model",
        blocks: [
          {
            type: "p",
            text: "AI tools use several pricing structures, and the cheapest-looking plan is not always the cheapest in practice. Identify which model each candidate uses:",
          },
          {
            type: "list",
            items: [
              "**Per seat:** a fixed fee per user. Predictable, but costly if many people use it only occasionally.",
              "**Usage or credit-based:** you pay for what you consume, such as messages, images, minutes of audio or automation runs. Flexible, but harder to forecast.",
              "**Freemium:** a free tier with limits on usage or features. Useful for trials, but check whether the free tier's data terms meet your needs.",
              "**Hybrid:** a seat fee that includes a usage allowance, with extra charges or reduced service above it.",
            ],
          },
          {
            type: "p",
            text: "Estimate cost from the job description you wrote in Step 1: multiply expected volume by the unit price, then add a margin for experimentation. Find out what happens when you hit a limit (whether usage stops, slows down or is billed automatically) and whether business features require an annual commitment.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Prices change often",
            text: "Vendors adjust plans and limits frequently. Check the pricing page on the day you decide and save a copy with your decision notes. Our [AI tools directory](/tools) describes each tool's pricing structure without quoting figures that may already be out of date.",
          },
        ],
      },
      {
        id: "step-5-run-a-trial",
        heading: "Step 5: Run a structured trial",
        blocks: [
          {
            type: "p",
            text: "Shortlist two or three tools and test them on the same real tasks. A structured trial turns opinions into evidence you can explain to others.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Pick three to five representative tasks from your actual work, including at least one difficult case.",
              "Write the prompts or instructions once and use them unchanged in every tool. Our guide to [writing effective AI prompts](/guides/how-to-write-effective-ai-prompts) helps you make them clear and fair.",
              "Use only public or dummy data until the tool has passed your Step 2 review.",
              "Score each output on the same simple scale, such as 1 to 5 for accuracy, usefulness and editing effort.",
              "Involve at least two people who will use the tool day to day, not only the person running the evaluation.",
              "Record setup friction: sign-in, admin settings, integrations and anything that needed vendor support.",
              "Make the decision, write down the reason, and set a date to review it.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Measure editing time",
            text: "Often the most useful single measure is how long it takes a person to turn the AI output into something they would send or publish. A tool with slightly weaker drafts but much less cleanup can be the better choice.",
          },
        ],
      },
      {
        id: "trial-checklist",
        heading: "Trial checklist",
        blocks: [
          {
            type: "p",
            text: "Copy this checklist into your decision notes and complete it for each shortlisted tool.",
          },
          {
            type: "code",
            language: "text",
            code: [
              "Tool:",
              "Plan evaluated:",
              "",
              "[ ] Job fit: handles all trial tasks to the agreed quality bar",
              "[ ] Data: training use, retention and storage location documented",
              "[ ] Admin: SSO, user management and audit logs (if required)",
              "[ ] Integrations: connects to our apps, natively or via automation",
              "[ ] Export: data and outputs can be exported",
              "[ ] Pricing: model understood, monthly cost estimated at expected volume",
              "[ ] Limits: behavior at usage limits understood",
              "[ ] People: at least two real users tested it and scored it",
              "[ ] Decision, reason and review date recorded",
            ].join("\n"),
          },
        ],
      },
      {
        id: "next-steps",
        heading: "Next steps",
        blocks: [
          {
            type: "p",
            text: "Once you have chosen, roll the tool out to a small group first, write down the approved use cases, and share the prompts that worked during the trial. Revisit the decision after a few months. AI products change quickly, and a tool that came second in your trial may since have added the feature you needed.",
          },
          {
            type: "list",
            items: [
              "Write two or three approved, reusable prompts for the main use case.",
              "Agree what must always be checked by a person before AI output is used.",
              "Note what would trigger a switch, such as a pricing change or a missing integration.",
            ],
          },
        ],
      },
    ],
    authorId: "research-desk",
    publishedAt: "2026-10-12",
    tags: ["AI tools", "Buying guide", "Data privacy", "Beginners"],
    relatedTools: ["chatgpt", "claude", "microsoft-copilot", "google-gemini"],
  },

  /* ---------------------------------------------------------------- */
  /* 3. Email follow-ups with Zapier                                   */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-automate-email-follow-ups-with-zapier",
    title: "How to Automate Email Follow-Ups with Zapier and AI",
    excerpt:
      "Build a Zapier workflow that sends a personalized follow-up email when a form is submitted or a row is added, with an optional AI step to draft the text.",
    intro:
      "In this guide you will build a Zap, Zapier's name for an automated workflow, that follows up by email whenever someone submits a form or a new row appears in a spreadsheet. You will add an optional AI step that drafts a personalized message, decide whether emails are sent automatically or saved as drafts for review, test each step with realistic sample data, and switch the workflow on with confidence.",
    category: "automation-workflows",
    difficulty: "Beginner",
    prerequisites: [
      "A Zapier account (multi-step Zaps may depend on your plan)",
      "A form tool or spreadsheet that collects contact details, such as Google Forms, Typeform or Google Sheets",
      "A Gmail or Microsoft Outlook account to send from",
      "A short follow-up message you would be happy to send manually",
    ],
    sections: [
      {
        id: "how-it-works",
        heading: "How the workflow fits together",
        blocks: [
          {
            type: "p",
            text: "Every Zap is made of a **trigger**, the event that starts it, and one or more **actions**, the things Zapier does in response. The workflow in this guide has three parts:",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "**Trigger:** a new form submission or a new spreadsheet row.",
              "**Optional AI step:** draft a personalized email from the submitted details.",
              "**Action:** create a draft or send the email through Gmail or Outlook.",
            ],
          },
          {
            type: "p",
            text: "You can add filters and delays later. Start with this simple version and get it working end to end. If you are still deciding on a platform, our [Zapier vs Make vs n8n comparison](/blog/zapier-vs-make-vs-n8n) explains the trade-offs.",
          },
        ],
      },
      {
        id: "step-1-trigger",
        heading: "Step 1: Add the trigger",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Create a new Zap and add a trigger step.",
              "Choose the app that holds your contacts, such as your form tool or Google Sheets, and the event that represents a new entry, such as a new form response or a new spreadsheet row.",
              "Connect your account when prompted, then select the specific form, spreadsheet or worksheet.",
              "Test the trigger. Zapier pulls in a recent sample record; check that it contains the fields you need, such as first name, email address and the reason the person got in touch.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Use a realistic test entry",
            text: "Submit your own form or add a test row with realistic values before testing the trigger. Mapping fields is much easier when the sample looks like real data, and you will spot missing fields early.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "New rows versus updated rows",
            text: "Some apps offer separate events for new and updated records. Pick the one that matches how data arrives, and avoid editing rows that have already been processed, or the same person may receive the email twice.",
          },
        ],
      },
      {
        id: "step-2-ai-draft",
        heading: "Step 2 (optional): Draft the email with AI",
        blocks: [
          {
            type: "p",
            text: "A template email with the person's first name is often enough. If submissions vary a lot, with different products, questions or budgets, an AI step can write a more relevant reply. Zapier offers built-in AI steps as well as integrations with AI providers such as OpenAI and Anthropic, and the setup is similar for each.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Add an action step after the trigger, then choose your AI app and a text-generation event.",
              "Write a prompt that combines fixed instructions with fields mapped from the trigger, as in the example below.",
              "Test the step and read the output carefully. Adjust the prompt and test again until several different sample entries all produce emails you would happily send.",
            ],
          },
          {
            type: "code",
            language: "text",
            code: [
              "You are writing a short follow-up email on behalf of Sam at Brightline Studio.",
              "",
              "The person below submitted our contact form. Write a friendly, professional",
              "reply under 120 words that:",
              "1. Thanks them by first name.",
              "2. Responds specifically to their message.",
              "3. Suggests a 20-minute call and asks for two times that suit them.",
              "",
              "Do not mention prices, discounts or delivery dates.",
              "Do not invent details about our services.",
              "Return only the email body, with no subject line.",
              "",
              "First name: [first name field]",
              "Message: [message field]",
            ].join("\n"),
          },
          {
            type: "p",
            text: "In the Zap editor, replace the bracketed placeholders by inserting the matching fields from the trigger step, rather than typing them as text.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Treat form text as untrusted",
            text: "Whatever someone types into your form goes straight into the prompt. Keep your instructions explicit, limit the AI step to drafting text, and never let AI output trigger payments, account changes or other irreversible actions without a person checking it first.",
          },
        ],
      },
      {
        id: "step-3-email-action",
        heading: "Step 3: Create or send the email",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Add another action step and choose Gmail or Microsoft Outlook, depending on the account you send from.",
              "Choose the event. If your email app offers an event that creates a draft, start with that instead of sending immediately.",
              "Map the recipient to the email address from the trigger, write a subject line (you can include mapped fields such as the person's name), and map the body to the AI step's output, or write a template body if you skipped Step 2.",
              "Set the sender name and, if replies should go to a shared inbox, a reply-to address.",
              "Test the step and open the draft or email it creates.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Start with drafts and human review",
            text: "We recommend that a person reviews AI-drafted emails before they are sent, at least for the first few weeks. Drafts let someone check tone and accuracy in seconds. Once you trust the output, you can consider sending automatically for low-risk messages.",
          },
          {
            type: "p",
            text: "Want to experiment with tone before automating anything? Try our [AI email writer](/free-ai-tools/ai-email-writer) to compare a few versions of your follow-up first.",
          },
        ],
      },
      {
        id: "step-4-test-and-turn-on",
        heading: "Step 4: Test end to end and turn it on",
        blocks: [
          {
            type: "p",
            text: "Testing each step on its own is not the same as testing the whole Zap. Before you rely on it:",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Review every step for unmapped required fields or warnings.",
              "Turn the Zap on, then submit a fresh entry through the real form, or add a row exactly as a real user or teammate would.",
              "Check the Zap's run history to confirm each step succeeded, then open the resulting email or draft.",
              "Delete test drafts and test rows so they do not confuse your team later.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Keep an eye on usage",
            text: "Zapier plans include a usage allowance, and actions that run count toward it. Check your account's usage after the first week so a busy form does not take you by surprise.",
          },
        ],
      },
      {
        id: "optional-improvements",
        heading: "Optional improvements",
        blocks: [
          {
            type: "list",
            items: [
              "**Filter step:** continue only when a condition is met, for example when the email field is not empty or the enquiry type is \"Sales\".",
              "**Delay step:** wait before sending, so the follow-up does not land seconds after someone submits the form.",
              "**Formatter step:** tidy data before it reaches the email, such as capitalizing first names.",
              "**Logging step:** write the date and outcome back to your spreadsheet so you can see who was contacted.",
            ],
          },
          {
            type: "p",
            text: "If your follow-ups need branching logic, with different messages for different types of lead, see our guide to [building a lead routing workflow with Make](/guides/how-to-build-a-lead-routing-workflow-with-make). The same ideas apply in Zapier.",
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        blocks: [
          {
            type: "list",
            items: [
              "**The Zap did not run.** Confirm it is switched on. Some triggers are instant, while others check for new data on a schedule, so new entries can take several minutes to appear depending on the app and your plan.",
              "**Fields are blank in the email.** The field was probably empty in the sample record or mapped from the wrong step. Re-test the trigger with a complete entry and map it again.",
              "**Duplicate emails.** Look for edits to old rows, repeated form submissions, or a second Zap doing the same job.",
              "**The AI output is inconsistent.** Tighten the prompt with a word limit and explicit rules, and keep the input structure the same every time.",
              "**Emails land in spam.** Send from an established, authenticated mailbox rather than a brand-new address, keep formatting simple, and avoid sending large batches at once.",
            ],
          },
          {
            type: "p",
            text: "Our [Zapier profile](/tools/zapier) summarizes its strengths, pricing structure and alternatives if you are weighing it against other platforms.",
          },
        ],
      },
    ],
    authorId: "editorial-team",
    publishedAt: "2026-10-19",
    tags: ["Zapier", "Email automation", "No-code", "AI workflows"],
    relatedTools: ["zapier", "chatgpt", "claude"],
  },

  /* ---------------------------------------------------------------- */
  /* 4. Lead routing with Make                                         */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-build-a-lead-routing-workflow-with-make",
    title: "How to Build a Lead Routing Workflow with Make",
    excerpt:
      "Build a Make scenario that receives leads by webhook, routes them with filters, updates your CRM, alerts the right Slack channel and handles errors.",
    intro:
      "In this guide you will build a Make scenario that receives new leads from a website form, sends each one down the right path based on rules you define, creates or updates the contact in your CRM, alerts the right team in Slack, and recovers gracefully when something fails. Along the way you will learn how Make's building blocks (modules, routers, filters and error handlers) fit together, and how to keep the scenario's operation usage under control.",
    category: "automation-workflows",
    difficulty: "Intermediate",
    prerequisites: [
      "A Make account",
      "A form or website that can send data to a webhook URL",
      "Access to your CRM (for example HubSpot, Pipedrive or Salesforce) and a Slack workspace",
      "Agreed routing rules, such as which region or company size goes to which team",
    ],
    sections: [
      {
        id: "make-concepts",
        heading: "Make concepts you will use",
        blocks: [
          {
            type: "list",
            items: [
              "**Scenario:** the automated workflow as a whole, built visually on a canvas.",
              "**Module:** a single step, such as receiving a webhook, searching a CRM or posting to Slack. Data moves between modules in units Make calls **bundles**.",
              "**Router:** a module that splits the flow into several routes, so different leads can follow different paths.",
              "**Filter:** a condition set on the link between two modules. Only bundles that match continue past it.",
              "**Operation:** one run of a module. Make measures usage against your plan in operations, so the design of a scenario affects its running cost.",
            ],
          },
          {
            type: "p",
            text: "The scenario in this guide has three routes: enterprise leads go to the enterprise sales team, smaller leads from EMEA go to the regional team, and everything else goes to a general queue.",
          },
        ],
      },
      {
        id: "step-1-webhook-trigger",
        heading: "Step 1: Create the webhook trigger",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Create a new scenario and add the Webhooks app's custom webhook module as the first module.",
              "Create a new webhook, give it a descriptive name such as \"Website leads\", and copy the URL Make generates.",
              "Paste the URL into your form tool's webhook or integration settings.",
              "While Make is waiting for data, submit a realistic test lead. Make uses this sample to determine the data structure, which makes the fields available to later modules.",
            ],
          },
          {
            type: "p",
            text: "A typical payload from a lead form looks like this:",
          },
          {
            type: "code",
            language: "json",
            code: [
              "{",
              "  \"first_name\": \"Priya\",",
              "  \"last_name\": \"Shah\",",
              "  \"email\": \"priya.shah@example.com\",",
              "  \"company\": \"Northwind Logistics\",",
              "  \"company_size\": 350,",
              "  \"region\": \"EMEA\",",
              "  \"message\": \"Looking for a demo for our operations team.\"",
              "}",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "tip",
            title: "Inspect payloads before mapping",
            text: "If a form sends nested or messy JSON, paste a sample into our [JSON formatter](/free-ai-tools/json-formatter) to see its structure clearly before you map fields. Use example.com addresses in tests so no real person is contacted. If your form tool has its own Make app, its trigger works just as well as a webhook.",
          },
        ],
      },
      {
        id: "step-2-router-and-filters",
        heading: "Step 2: Add a router and filters",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Add a router after the webhook module and create three routes.",
              "On the first route, add a filter labeled \"Enterprise\": company size greater than or equal to 200. Use a numeric operator, not a text one.",
              "On the second route, add a filter labeled \"EMEA, under 200\": region equal to EMEA **and** company size less than 200.",
              "Set the third route as the fallback route, so it receives any lead that matched no other filter.",
              "Give every route a clear label so the scenario is readable to whoever maintains it next.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Keep filters mutually exclusive",
            text: "A router sends a bundle down **every** route whose filter it passes, not just the first one. That is why the EMEA route also checks company size: without it, a large EMEA company would follow two routes and trigger duplicate records and notifications.",
          },
          {
            type: "p",
            text: "Filters compare values exactly, so inconsistent input causes misses. If one form sends \"emea\" and another \"EMEA\", choose a case-insensitive operator or clean the value with Make's text functions, such as `trim` and `lower`, before comparing.",
          },
        ],
      },
      {
        id: "step-3-crm-record",
        heading: "Step 3: Create or update the CRM record",
        blocks: [
          {
            type: "p",
            text: "On each route, add your CRM's module. Most popular CRMs have Make apps; if yours does not, Make's HTTP module can call its API directly.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "If your CRM's app offers a module that creates or updates a contact by email address, use it. It prevents duplicates in a single step.",
              "Otherwise, add a search module that looks up the contact by email, then update the match or create a new record.",
              "Map the webhook fields to CRM properties, and set the owner or pipeline for that route. This is where the routing decision becomes visible to your sales team.",
              "Run the module with test data and confirm the record in the CRM itself.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Empty search results stop the path",
            text: "In Make, a search that finds nothing outputs no bundles, so the modules after it on that path do not run. Test the \"new contact\" case explicitly and check how your search module handles empty results.",
          },
        ],
      },
      {
        id: "step-4-slack-notification",
        heading: "Step 4: Notify the right Slack channel",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "After the CRM module on each route, add Slack's module for posting a message and connect your workspace.",
              "Choose the channel for that route, for example `#sales-enterprise`, `#sales-emea` and `#sales-general`.",
              "Write a short message with the lead's name, company, size and a link to the CRM record, so the team can act without searching.",
            ],
          },
          {
            type: "code",
            language: "text",
            code: [
              "New enterprise lead: [first name] [last name], [company] ([company size] employees)",
              "Message: [message]",
              "CRM record: [record URL]",
            ].join("\n"),
          },
          {
            type: "p",
            text: "The bracketed placeholders stand for fields you map from earlier modules in Make's mapping panel. Keep notifications short, with one lead per message and the most important detail first.",
          },
        ],
      },
      {
        id: "step-5-error-handling",
        heading: "Step 5: Add error handling",
        blocks: [
          {
            type: "p",
            text: "External services fail occasionally: a CRM rate limit, an expired connection, a required field left blank. Without error handling, the run stops and the lead can fall out of the workflow. Make lets you attach an error handler route to any module.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "In the scenario settings, enable storing of incomplete executions.",
              "Add an error handler to the CRM module on each route.",
              "For temporary failures, use the **Break** directive. Make stores the failed run as an incomplete execution so it can be retried automatically or resolved manually.",
              "For problems a retry will not fix, add a Slack or email module on the error route that alerts an owner with the lead details and the error message, followed by the **Ignore** directive so the run finishes cleanly.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Keep a copy of every lead",
            text: "Consider writing each incoming lead to a Google Sheet or a Make data store immediately after the webhook. If anything downstream fails, you still have the raw data to recover from. It costs one extra operation per lead.",
          },
        ],
      },
      {
        id: "step-6-test-and-activate",
        heading: "Step 6: Test and activate",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Run the scenario once manually and send test leads that cover each route: an enterprise lead, a smaller EMEA lead and one from another region.",
              "Inspect each module's output after the run to confirm which bundles passed each filter and what data they carried.",
              "Send one deliberately broken lead, for example without an email address, to confirm the error route works.",
              "Delete test records from the CRM, then activate the scenario. Webhook-triggered scenarios process data as soon as it arrives.",
            ],
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        blocks: [
          {
            type: "list",
            items: [
              "**The webhook receives nothing.** Check the URL in your form settings, confirm the scenario is active, and look at the webhook's queue for data that arrived while it was off.",
              "**A lead went down two routes.** Your filters overlap. Make them mutually exclusive or rely on the fallback route.",
              "**Fields are missing in later modules.** The data structure was determined from an incomplete sample. Redetermine it with a complete test submission.",
              "**Slack posting fails for a private channel.** Make sure the connected Slack app or user has been added to that channel.",
              "**Operations are higher than expected.** Check for search modules returning several results, which makes every later module run once per result, and remove steps that do not need to run for every lead.",
            ],
          },
          {
            type: "p",
            text: "Still choosing a platform? Our [Zapier vs Make vs n8n](/blog/zapier-vs-make-vs-n8n) comparison explains how Make's model differs, and our guide to [automating email follow-ups with Zapier](/guides/how-to-automate-email-follow-ups-with-zapier) pairs well with this routing logic. Our [Make profile](/tools/make) covers pricing structure and alternatives.",
          },
        ],
      },
    ],
    authorId: "research-desk",
    publishedAt: "2026-09-28",
    tags: ["Make", "Lead routing", "CRM automation", "Webhooks", "Slack"],
    relatedTools: ["make", "zapier", "n8n"],
  },

  /* ---------------------------------------------------------------- */
  /* 5. Self-hosting n8n with Docker                                   */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-self-host-n8n-with-docker",
    title: "How to Self-Host n8n with Docker and Docker Compose",
    excerpt:
      "Run n8n on your own server with the official Docker image: a quick docker run test, a Compose setup, HTTPS behind a reverse proxy, backups and updates.",
    intro:
      "This guide takes you from a fresh server to a working, self-hosted n8n instance. You will start n8n with a single `docker run` command to confirm everything works, move to a Docker Compose file you can keep under version control, put n8n behind a reverse proxy with HTTPS for production use, and set up backups so your workflows and credentials survive a failed disk or a bad upgrade.",
    category: "developer-guides",
    difficulty: "Intermediate",
    prerequisites: [
      "A Linux server or local machine with Docker Engine and the Docker Compose plugin installed",
      "Comfort running commands in a terminal",
      "For production: a domain or subdomain you can point at the server",
    ],
    sections: [
      {
        id: "before-you-start",
        heading: "Before you start: what self-hosting involves",
        blocks: [
          {
            type: "p",
            text: "Self-hosting n8n gives you full control over where your workflows and data live, but you also take on the work a hosted service would do: updates, security, uptime and backups. n8n also offers a hosted cloud service if that trade-off does not suit you, and our [comparison of Zapier, Make and n8n](/blog/zapier-vs-make-vs-n8n) covers the wider choice.",
          },
          {
            type: "p",
            text: "n8n keeps its data in `/home/node/.n8n` inside the container, including a SQLite database (the default) with your workflows, credentials and execution history, plus the encryption key that protects stored credentials. The most important rule of self-hosting n8n is to keep that folder on persistent storage, which is why every example below uses a named Docker volume.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Check the official docs for environment variables",
            text: "n8n's configuration options change between releases. The commands here are a minimal, conservative starting point. Consult n8n's official documentation for the current list of environment variables before relying on anything beyond these basics.",
          },
        ],
      },
      {
        id: "step-1-docker-run",
        heading: "Step 1: Test n8n with docker run",
        blocks: [
          {
            type: "p",
            text: "Create a named volume, then start a temporary container from the official image. Replace `Europe/London` with your own time zone name, such as `America/New_York`.",
          },
          {
            type: "code",
            language: "bash",
            code: [
              "docker volume create n8n_data",
              "",
              "docker run -it --rm \\",
              "  --name n8n \\",
              "  -p 5678:5678 \\",
              "  -e GENERIC_TIMEZONE=\"Europe/London\" \\",
              "  -e TZ=\"Europe/London\" \\",
              "  -v n8n_data:/home/node/.n8n \\",
              "  docker.n8n.io/n8nio/n8n",
            ].join("\n"),
          },
          {
            type: "p",
            text: "Open `http://localhost:5678` in a browser and create the owner account. `GENERIC_TIMEZONE` sets the time zone n8n uses for scheduled workflows, while `TZ` sets the system time zone inside the container. Setting both avoids schedules that run hours early or late.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "--rm removes the container, not your data",
            text: "Stopping this container with Ctrl+C deletes it because of `--rm`, but your data is safe in the `n8n_data` volume. Never run n8n without a volume: anything stored only inside the container is lost when it is removed.",
          },
        ],
      },
      {
        id: "step-2-docker-compose",
        heading: "Step 2: Move to Docker Compose",
        blocks: [
          {
            type: "p",
            text: "For an instance you plan to keep running, a Compose file is easier to maintain than a long command. Create a directory such as `~/n8n` and add a `compose.yaml` file:",
          },
          {
            type: "code",
            language: "yaml",
            code: [
              "services:",
              "  n8n:",
              "    image: docker.n8n.io/n8nio/n8n",
              "    restart: unless-stopped",
              "    ports:",
              "      - \"127.0.0.1:5678:5678\"",
              "    environment:",
              "      - GENERIC_TIMEZONE=Europe/London",
              "      - TZ=Europe/London",
              "    volumes:",
              "      - n8n_data:/home/node/.n8n",
              "",
              "volumes:",
              "  n8n_data:",
              "    external: true",
            ].join("\n"),
          },
          {
            type: "p",
            text: "`external: true` tells Compose to reuse the `n8n_data` volume you created in Step 1, so anything you set up during the test carries over. If you skipped Step 1, run `docker volume create n8n_data` first. Binding the port to `127.0.0.1` means n8n is reachable only from the server itself; the reverse proxy in Step 3 will handle public traffic. Start the stack and follow the logs:",
          },
          {
            type: "code",
            language: "bash",
            code: ["cd ~/n8n", "docker compose up -d", "docker compose logs -f n8n"].join("\n"),
          },
          {
            type: "callout",
            tone: "tip",
            title: "Pin a version in production",
            text: "The example uses the image's default tag for simplicity. In production, pin a specific version tag in the `image` line so upgrades happen only when you choose, after reading n8n's release notes.",
          },
        ],
      },
      {
        id: "step-3-reverse-proxy-https",
        heading: "Step 3: Add a reverse proxy with HTTPS",
        blocks: [
          {
            type: "p",
            text: "Do not expose port 5678 directly to the internet. Put a reverse proxy in front of n8n to handle HTTPS. Caddy is a straightforward option because it obtains and renews TLS certificates automatically; Nginx and Traefik work too. Point a DNS record such as `n8n.example.com` at your server, install Caddy on the host, and use a Caddyfile like this:",
          },
          {
            type: "code",
            language: "text",
            code: ["n8n.example.com {", "    reverse_proxy localhost:5678", "}"].join("\n"),
          },
          {
            type: "p",
            text: "Then tell n8n its public address so it generates correct webhook URLs. Add these lines to the `environment` section of your Compose file and run `docker compose up -d` again:",
          },
          {
            type: "code",
            language: "yaml",
            code: [
              "      - N8N_HOST=n8n.example.com",
              "      - N8N_PROTOCOL=https",
              "      - WEBHOOK_URL=https://n8n.example.com/",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "warning",
            title: "Let WebSocket connections through",
            text: "The n8n editor keeps a live connection to the server for updates. Caddy forwards this automatically; with Nginx you must pass the `Upgrade` and `Connection` headers, or the editor will keep reporting a lost connection. Depending on your version, n8n may also need proxy-related settings such as `N8N_PROXY_HOPS`, so check the docs.",
          },
          {
            type: "p",
            text: "Finally, configure your firewall to allow only SSH and ports 80 and 443.",
          },
        ],
      },
      {
        id: "step-4-backups",
        heading: "Step 4: Back up your data",
        blocks: [
          {
            type: "p",
            text: "Back up the whole volume, not just your workflows. It contains the encryption key: without it, credentials in a restored database cannot be decrypted. Stop n8n briefly so the database is not written to mid-backup, archive the volume with a throwaway container, then start n8n again:",
          },
          {
            type: "code",
            language: "bash",
            code: [
              "docker compose stop n8n",
              "docker run --rm \\",
              "  -v n8n_data:/data:ro \\",
              "  -v \"$(pwd)\":/backup \\",
              "  alpine tar czf /backup/n8n-backup-$(date +%F).tar.gz -C /data .",
              "docker compose start n8n",
            ].join("\n"),
          },
          {
            type: "p",
            text: "Copy the archive off the server, because a backup on the same disk does not protect you from losing that disk. Schedule the job with cron and test a restore on another machine from time to time. For a portable, readable copy of your workflows, n8n's command-line interface can also export them as JSON:",
          },
          {
            type: "code",
            language: "bash",
            code: [
              "docker compose exec n8n n8n export:workflow --all --output=/home/node/.n8n/workflows-backup.json",
              "docker compose cp n8n:/home/node/.n8n/workflows-backup.json ./",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "tip",
            title: "Consider setting your own encryption key",
            text: "You can supply the key yourself with `N8N_ENCRYPTION_KEY` and store it in a password manager, which simplifies restores and migrations. Set it on a new instance before adding credentials, or to the exact value already stored in the volume; a mismatched key stops n8n from reading existing credentials.",
          },
        ],
      },
      {
        id: "step-5-updates-and-security",
        heading: "Step 5: Update and secure your instance",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Read the release notes for breaking changes, especially across major versions.",
              "Take a backup as described above.",
              "Pull the new image and recreate the container with `docker compose pull` followed by `docker compose up -d`.",
              "Check the logs and run a few critical workflows to confirm they still behave as expected.",
            ],
          },
          {
            type: "p",
            text: "Beyond updates, use a strong owner password and two-factor authentication, keep the host operating system and Docker patched, and store API keys only in n8n's credentials system rather than in Code nodes or workflow notes. If your team works from known locations, restricting access to the editor with a VPN or IP allow-list adds another layer.",
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        blocks: [
          {
            type: "list",
            items: [
              "**Permission denied errors on startup.** Usually caused by mounting a host directory instead of a named volume. The container runs as the `node` user (UID 1000), so a bind-mounted directory must be writable by that user.",
              "**A secure cookie warning when opening the editor over plain HTTP.** n8n expects HTTPS when accessed from anywhere other than localhost. Set up the reverse proxy from Step 3; `N8N_SECURE_COOKIE=false` exists but is only appropriate for local testing.",
              "**Webhook URLs show localhost instead of your domain.** Set `WEBHOOK_URL` and recreate the container.",
              "**Schedules run at the wrong time.** Check `GENERIC_TIMEZONE` and `TZ`, and the time zone in each workflow's settings.",
              "**Workflows disappeared after recreating the container.** The volume was not mounted at `/home/node/.n8n`, or a different volume was used. Run `docker volume ls` and check the mount in your Compose file.",
            ],
          },
          {
            type: "p",
            text: "Once n8n is running, browse our [automation ideas](/automation) for workflows to build first, or read our [n8n profile](/tools/n8n) for an overview of its features.",
          },
        ],
      },
    ],
    authorId: "editorial-team",
    publishedAt: "2026-10-05",
    tags: ["n8n", "Docker", "Self-hosting", "Automation", "DevOps"],
    relatedTools: ["n8n", "make", "zapier"],
  },

  /* ---------------------------------------------------------------- */
  /* 6. GitHub Copilot in VS Code                                      */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-use-github-copilot-in-vs-code",
    title: "How to Use GitHub Copilot in VS Code: A Beginner's Guide",
    excerpt:
      "Set up GitHub Copilot in VS Code, accept inline suggestions, use chat, give better context, review the output carefully and adjust your privacy settings.",
    intro:
      "This guide walks you through installing GitHub Copilot in Visual Studio Code, signing in, and using its two main features: inline code suggestions as you type, and a chat panel for questions, explanations and larger edits. You will also learn how to give Copilot better context, how to review what it produces, how to use it to write tests, and which settings control privacy and where suggestions appear.",
    category: "developer-guides",
    difficulty: "Beginner",
    prerequisites: [
      "Visual Studio Code installed and up to date",
      "A GitHub account with access to a Copilot plan (GitHub offers a free tier as well as paid plans)",
      "A project in a language you know well, so you can judge the suggestions",
    ],
    sections: [
      {
        id: "step-1-install-and-sign-in",
        heading: "Step 1: Install the extension and sign in",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Open the Extensions view in VS Code (`Ctrl+Shift+X` on Windows and Linux, `Cmd+Shift+X` on macOS).",
              "Search for **GitHub Copilot**, check that the publisher is GitHub, and install it. Recent versions of VS Code may instead offer a Copilot setup prompt that installs everything you need in one step; either route works.",
              "When prompted, sign in with your GitHub account and authorize VS Code in the browser window that opens.",
              "Confirm Copilot is active: its icon appears in the status bar, and clicking it shows the current status and quick settings.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Plans and access",
            text: "Copilot is available through individual plans, including a limited free tier, and through organization plans managed by an administrator. If you have access through work, your organization's policies may turn some features on or off. Check GitHub's Copilot pages for current plan details.",
          },
        ],
      },
      {
        id: "step-2-inline-suggestions",
        heading: "Step 2: Accept and steer inline suggestions",
        blocks: [
          {
            type: "p",
            text: "As you type, Copilot shows suggestions as dimmed \"ghost text\" after your cursor. A suggestion can be a single line or a whole function.",
          },
          {
            type: "list",
            items: [
              "Press **Tab** to accept a suggestion.",
              "Press **Esc** to dismiss it, or simply keep typing.",
              "Press **Alt+]** or **Alt+[** (**Option+]** or **Option+[** on macOS) to cycle through alternatives when more than one is available.",
              "Hover over a suggestion to see a small toolbar with the same options.",
            ],
          },
          {
            type: "p",
            text: "Suggestions are shaped by the code around your cursor and by other open files. The quickest way to improve them is to state your intent clearly before you start typing the implementation:",
          },
          {
            type: "code",
            language: "typescript",
            code: [
              "// Parse a duration string such as \"1h30m\" or \"45s\" into total seconds.",
              "// Supported units: h, m, s. Return null for empty or invalid input.",
              "export function parseDuration(input: string): number | null {",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "tip",
            title: "Context that helps",
            text: "Descriptive function and variable names, a comment stating inputs, outputs and edge cases, type annotations, and keeping related files open all improve suggestions. Close unrelated files that could mislead it.",
          },
        ],
      },
      {
        id: "step-3-copilot-chat",
        heading: "Step 3: Use the chat panel",
        blocks: [
          {
            type: "p",
            text: "Open the Chat view from the Copilot icon in VS Code, or search for \"chat\" in the Command Palette to find it and its keyboard shortcut. For a quick edit in place, select some code and press `Ctrl+I` (`Cmd+I` on macOS) to open inline chat.",
          },
          {
            type: "list",
            items: [
              "**Ask questions** about your code: select a function and ask what it does or why it might fail.",
              "**Use slash commands** such as `/explain`, `/fix` and `/tests`. Type `/` in the chat box to see what your version supports.",
              "**Add context** by attaching files or symbols. Type `#` to see the references available, so answers are based on your code rather than generic examples.",
              "**Request multi-file changes** using the chat's editing or agent modes, then review each proposed change before keeping it.",
            ],
          },
          {
            type: "p",
            text: "The principles in our guide to [writing effective AI prompts](/guides/how-to-write-effective-ai-prompts) apply here too: say what you want, give constraints, and show an example of the style you expect.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Read before you approve",
            text: "When Copilot proposes running terminal commands or editing many files, read each step before approving it. Review its changes as you would review a pull request from a colleague.",
          },
        ],
      },
      {
        id: "step-4-review-suggestions",
        heading: "Step 4: Review every suggestion",
        blocks: [
          {
            type: "p",
            text: "Copilot's output is often correct and sometimes subtly wrong. It can call functions that do not exist, use outdated APIs, miss edge cases, or introduce security problems such as unvalidated input. You remain responsible for every line you commit.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Read each suggestion in full before accepting it. Avoid accepting long blocks you have only skimmed.",
              "Check that library functions and parameters exist in the version your project actually uses.",
              "Run the code, your linter and your existing tests.",
              "Look closely at authentication, input validation, database queries, file paths and anything involving secrets.",
              "For larger changes, review the diff in source control before committing.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Decide on suggestions that match public code",
            text: "Your Copilot settings on GitHub let you choose whether to allow suggestions that match public code. Blocking them reduces the chance of reproducing existing code verbatim. Organization administrators may control this setting for you.",
          },
        ],
      },
      {
        id: "step-5-write-tests",
        heading: "Step 5: Use Copilot to write tests",
        blocks: [
          {
            type: "p",
            text: "Tests are one of the most productive uses of Copilot, because the expected behavior is usually clear and the output is easy to verify.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Open the file under test and an existing test file, so Copilot can see your testing framework and conventions.",
              "Ask chat to generate tests for a selected function, or use `/tests`, and list the edge cases you care about, such as empty input, invalid formats and boundary values.",
              "Run the tests. Then deliberately break the function to confirm at least one test fails; a test that can never fail proves nothing.",
              "Delete tests that merely restate the implementation and keep the ones that check real behavior.",
            ],
          },
        ],
      },
      {
        id: "step-6-privacy-and-settings",
        heading: "Step 6: Adjust privacy and editor settings",
        blocks: [
          {
            type: "p",
            text: "Review two sets of settings: your Copilot settings on GitHub, which cover policies such as public code matching and, on individual plans, data-sharing preferences; and your VS Code settings, which control where suggestions appear. To turn inline suggestions off for specific languages, add an entry like this to your user `settings.json`:",
          },
          {
            type: "code",
            language: "json",
            code: [
              "{",
              "  \"github.copilot.enable\": {",
              "    \"*\": true,",
              "    \"markdown\": false,",
              "    \"plaintext\": false",
              "  }",
              "}",
            ].join("\n"),
          },
          {
            type: "callout",
            tone: "warning",
            title: "Keep secrets out of prompts",
            text: "Do not paste API keys, passwords or customer data into chat. On business and enterprise plans, administrators can configure content exclusions so that specified files are not used as context; ask your admin what applies to your repositories. Our overview of [AI coding assistants](/blog/ai-coding-assistants-for-developers) covers team policies in more depth.",
          },
        ],
      },
      {
        id: "troubleshooting-and-next-steps",
        heading: "Troubleshooting and next steps",
        blocks: [
          {
            type: "list",
            items: [
              "**No suggestions appear.** Check the status bar icon for sign-in or plan messages, confirm Copilot is enabled for the current language, and check whether you have reached a usage limit.",
              "**Sign-in fails or loops.** Sign out of GitHub from the Accounts menu in VS Code and sign in again. On corporate networks, proxy settings may need configuring.",
              "**Suggestions are irrelevant.** Add a comment describing what you want and open the related files.",
            ],
          },
          {
            type: "p",
            text: "Use Copilot daily for a week on low-risk work such as boilerplate, tests and documentation comments before relying on it for core logic. Notice where it saves time and where you spend longer fixing its output than writing the code yourself. To compare it with an editor built around AI, see our profiles of [GitHub Copilot](/tools/github-copilot) and [Cursor](/tools/cursor).",
          },
        ],
      },
    ],
    authorId: "research-desk",
    publishedAt: "2026-09-21",
    tags: ["GitHub Copilot", "VS Code", "AI coding", "Developer tools"],
    relatedTools: ["github-copilot", "cursor", "replit"],
  },

  /* ---------------------------------------------------------------- */
  /* 7. Blog images with AI                                            */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-create-blog-images-with-ai",
    title: "How to Create Blog Images with AI: A Practical Workflow",
    excerpt:
      "A step-by-step workflow for creating blog images with AI: choose a tool, write structured prompts, check licensing, add alt text and export to WebP.",
    intro:
      "This guide gives you a repeatable workflow for producing featured images and in-article illustrations with AI image generators. You will choose a tool that suits your licensing needs, write prompts that specify subject, style, lighting, composition and aspect ratio, refine the results, and prepare the final files for the web with descriptive alt text and efficient WebP compression.",
    category: "content-creation",
    difficulty: "Beginner",
    prerequisites: [
      "An account with at least one AI image tool, such as Adobe Firefly, Midjourney, Canva or Leonardo AI",
      "The article the image is for, or at least its headline and main point",
      "Your site's preferred image dimensions",
    ],
    sections: [
      {
        id: "step-1-choose-a-tool",
        heading: "Step 1: Choose the right tool for the job",
        blocks: [
          {
            type: "p",
            text: "Most popular image generators can produce a usable blog image. The differences that matter for a publication are licensing terms, editing features and how well the tool fits your existing workflow.",
          },
          {
            type: "list",
            items: [
              "**Adobe Firefly:** integrated with Adobe's apps and positioned by Adobe for commercial use. A natural fit if your team already works in Photoshop or Adobe Express.",
              "**Midjourney:** known for strong aesthetics and stylized imagery. Commercial use terms depend on your subscription, so check them for your plan.",
              "**Canva Magic Studio:** generates images inside Canva designs, which is convenient when you also add text overlays or brand templates.",
              "**Leonardo AI:** offers a choice of models and style presets, plus editing tools for refining results.",
            ],
          },
          {
            type: "p",
            text: "Our directory profiles of [Adobe Firefly](/tools/adobe-firefly) and [Midjourney](/tools/midjourney) compare features and pricing structures in more detail.",
          },
          {
            type: "callout",
            tone: "warning",
            title: "Check each tool's terms",
            text: "Licensing and commercial-use rights differ between tools and between free and paid plans, and they change over time. Read the current terms for the plan you use before publishing, and note which tool and plan produced each image.",
          },
        ],
      },
      {
        id: "step-2-write-the-prompt",
        heading: "Step 2: Write a structured prompt",
        blocks: [
          {
            type: "p",
            text: "Vague prompts produce generic, stock-photo images. Build each prompt from five parts:",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "**Subject:** what is in the image, described concretely: who or what, doing what, and where.",
              "**Style:** editorial photograph, flat vector illustration, 3D render, watercolor, isometric diagram.",
              "**Lighting:** soft natural light, golden hour, studio lighting, high contrast.",
              "**Composition:** close-up or wide shot, viewpoint, and where to leave empty space for a headline.",
              "**Aspect ratio:** match where the image will appear, such as 16:9 for a wide header or 1:1 for a square thumbnail.",
            ],
          },
          {
            type: "code",
            language: "text",
            code: [
              "Subject: a small team reviewing an automation workflow diagram on a large monitor",
              "in a bright office",
              "Style: editorial photograph, realistic, muted color palette",
              "Lighting: soft natural daylight from a window on the right",
              "Composition: medium-wide shot, people seen from behind, empty space on the left",
              "for a headline",
              "Aspect ratio: 16:9",
            ].join("\n"),
          },
          {
            type: "p",
            text: "Most tools accept this as a single descriptive sentence or a comma-separated list. Aspect ratio is usually a setting rather than part of the prompt; in Midjourney it is a parameter such as `--ar 16:9`. For help turning a rough idea into structured wording, try our [prompt generator](/free-ai-tools/prompt-generator).",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Avoid text, logos and real people",
            text: "Image generators can garble text, so add headlines and labels afterwards in a design tool. Avoid prompting for trademarks, logos, real people or the style of a named living artist; these raise legal and ethical issues, and many tools restrict them.",
          },
        ],
      },
      {
        id: "step-3-generate-and-refine",
        heading: "Step 3: Generate, select and refine",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Generate several variations and pick the one that best serves the article, not just the most striking one.",
              "Zoom in and check for common artifacts: distorted hands and faces, warped objects, impossible reflections and nonsense text in the background.",
              "Use the tool's editing features, such as regenerating a selected area or extending the canvas, to fix small problems instead of starting again.",
              "Add headline text, branding or overlays in a design tool, where you have full control of fonts and spelling.",
              "Upscale only if you need a larger size than the tool produced, and check the result closely, since upscaling can introduce its own artifacts.",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Be honest with readers",
            text: "Do not use AI images in a way that suggests they document real events, products or people. If your publication has a disclosure policy, follow it; a short caption or credit line noting that the image was generated with AI is common practice.",
          },
        ],
      },
      {
        id: "step-4-licensing-and-records",
        heading: "Step 4: Check licensing and keep records",
        blocks: [
          {
            type: "p",
            text: "Before an image goes live, confirm you are allowed to use it the way you intend. Ask these questions for each tool and plan:",
          },
          {
            type: "list",
            items: [
              "Does the plan permit commercial use, including on a site that earns money from ads or affiliate links?",
              "Are there conditions based on your organization's size or revenue?",
              "Are images created on this plan public by default, and can others reuse them?",
              "Does the vendor offer any IP indemnity, and on which plans?",
            ],
          },
          {
            type: "p",
            text: "Copyright in AI-generated images is still an unsettled area. In some jurisdictions, including the United States, images generated entirely by AI without meaningful human authorship may not qualify for copyright protection, which can limit your ability to stop others reusing them. For high-stakes uses such as a brand mascot or a book cover, get legal advice.",
          },
          {
            type: "p",
            text: "Keep a simple log for each image: tool, plan, date, prompt and the article it appears in. It takes seconds and answers most questions that come up later.",
          },
        ],
      },
      {
        id: "step-5-alt-text",
        heading: "Step 5: Write useful alt text",
        blocks: [
          {
            type: "p",
            text: "Alt text describes the image for people using screen readers and for situations where the image fails to load. It also helps search engines understand the image, but write it for people first.",
          },
          {
            type: "list",
            items: [
              "Describe what the image shows and why it is there, in one short sentence.",
              "Skip phrases like \"image of\"; screen readers already announce that it is an image.",
              "Do not stuff keywords. Mention the topic only where it describes the image naturally.",
              "If an image is purely decorative, use an empty alt attribute so screen readers skip it.",
            ],
          },
          {
            type: "code",
            language: "html",
            code: [
              "<img",
              "  src=\"/images/workflow-review.webp\"",
              "  alt=\"Three colleagues reviewing an automation workflow diagram on a large office monitor\"",
              "  width=\"1600\"",
              "  height=\"900\"",
              "/>",
            ].join("\n"),
          },
        ],
      },
      {
        id: "step-6-compress-to-webp",
        heading: "Step 6: Resize and compress to WebP",
        blocks: [
          {
            type: "p",
            text: "AI tools often export large PNG files. Resize each image to the largest size your layout actually displays, then convert it to WebP, a format supported by all modern browsers that is usually much smaller than an equivalent PNG or JPEG.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Resize to your target width, such as the maximum width of your content column or your platform's recommended social sharing size.",
              "Convert to WebP at a moderate quality setting and compare it with the original at full size.",
              "Lower the quality step by step while you cannot see a difference, then stop.",
              "Set `width` and `height` attributes, or use your framework's image component, so the page does not shift as images load.",
            ],
          },
          {
            type: "p",
            text: "Browser-based tools such as Squoosh work well for one-off images. For batches, Google's `cwebp` command-line encoder is a reliable option:",
          },
          {
            type: "code",
            language: "bash",
            code: "cwebp -q 80 featured-image.png -o featured-image.webp",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Let your framework help",
            text: "If your site runs on Next.js, the built-in Image component can resize images and serve modern formats automatically. It still pays to upload a sensibly sized source file.",
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        blocks: [
          {
            type: "list",
            items: [
              "**Images look generic.** Add specific details to the subject and composition, and name a concrete style rather than asking for \"high quality\".",
              "**Faces or hands look wrong.** Regenerate that area, change the composition so they are smaller or out of frame, or choose another variation.",
              "**Text in the image is garbled.** Remove text from the prompt and add it afterwards in a design tool.",
              "**The style is inconsistent across posts.** Save a base prompt with your chosen style, lighting and palette, and change only the subject each time.",
              "**WebP files look blurry.** Raise the quality setting, and check that you did not enlarge a small image.",
            ],
          },
        ],
      },
    ],
    authorId: "editorial-team",
    publishedAt: "2026-09-14",
    tags: ["AI image generation", "Blogging", "Content creation", "Image SEO"],
    relatedTools: ["adobe-firefly", "midjourney", "canva-magic-studio", "leonardo-ai"],
  },

  /* ---------------------------------------------------------------- */
  /* 8. Summarizing meetings with AI                                   */
  /* ---------------------------------------------------------------- */
  {
    slug: "how-to-summarize-meetings-with-ai",
    title: "How to Summarize Meetings with AI: A Responsible Workflow",
    excerpt:
      "Get consent, capture a transcript with Otter.ai, Fireflies.ai or a chat assistant, use a reliable summary prompt, and verify every action item before sharing.",
    intro:
      "This guide shows you how to turn meetings into accurate, useful summaries with AI, without surprising your colleagues or trusting the output blindly. You will handle consent and disclosure first, choose between a dedicated meeting assistant and pasting a transcript into a general AI chat tool, use a tested prompt template to produce consistent summaries, and verify decisions and action items before anything is shared.",
    category: "productivity",
    difficulty: "Beginner",
    prerequisites: [
      "Permission to record or transcribe the meetings you want to summarize",
      "A meeting assistant account (such as Otter.ai or Fireflies.ai) or access to a general assistant such as ChatGPT or Claude",
      "Your organization's policy on recording and AI tools, if it has one",
    ],
    sections: [
      {
        id: "step-1-consent-and-disclosure",
        heading: "Step 1: Get consent and disclose AI use",
        blocks: [
          {
            type: "p",
            text: "Recording and transcribing a conversation has legal and trust implications. Laws differ between countries and, in some places, between states or regions, and some require everyone on a call to consent to recording. Even where the rules are relaxed, an unannounced AI notetaker damages trust quickly.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Check your organization's policy and, for external calls, any requirements in client contracts.",
              "State in the meeting invitation that the call will be recorded or transcribed and summarized with AI.",
              "Announce it again at the start of the meeting and give people a genuine chance to object.",
              "Pause recording for sensitive segments, such as HR, legal or personal matters, whenever someone asks.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "This is not legal advice",
            text: "If you record customers, job candidates or people in other countries, confirm the rules that apply with your legal or compliance team. Our guide to [responsible AI use at work](/blog/responsible-ai-use-at-work) covers the wider policy questions.",
          },
        ],
      },
      {
        id: "step-2-choose-capture-method",
        heading: "Step 2: Choose how to capture the transcript",
        blocks: [
          {
            type: "p",
            text: "There are two practical approaches, and many teams use both.",
          },
          {
            type: "h3",
            text: "Option A: A dedicated meeting assistant",
          },
          {
            type: "p",
            text: "Tools such as [Otter.ai](/tools/otter-ai) and [Fireflies.ai](/tools/fireflies-ai) can join scheduled video calls as a notetaker participant, transcribe the conversation, label speakers and generate summaries automatically. Both also accept uploaded recordings. This is the most convenient option for recurring meetings, but the assistant's presence should always be visible and explained to attendees.",
          },
          {
            type: "h3",
            text: "Option B: Paste a transcript into a general AI assistant",
          },
          {
            type: "p",
            text: "If your video platform already produces transcripts, you can paste one into ChatGPT or Claude with a structured prompt. This gives you more control over the format and works well for one-off meetings, but you are responsible for what you share and where.",
          },
          {
            type: "callout",
            tone: "info",
            title: "Check the data terms first",
            text: "Before pasting transcripts into any AI tool, confirm how your plan handles data: whether inputs may be used for training, how long they are retained, and whether your organization has approved the tool. Business plans often have stricter privacy defaults than personal accounts.",
          },
        ],
      },
      {
        id: "step-3-prepare-the-transcript",
        heading: "Step 3: Prepare the transcript",
        blocks: [
          {
            type: "p",
            text: "Summary quality depends heavily on transcript quality. A few minutes of cleanup prevents most errors.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Check speaker labels and fix any that are wrong or generic, such as \"Speaker 2\".",
              "Correct obvious mistranscriptions of names, product names and technical terms.",
              "Remove sections that should not be shared, such as off-topic personal conversation.",
              "Add the meeting's purpose, date and attendees at the top, so the summary has context.",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            title: "Improve accuracy at the source",
            text: "Decent microphones, one person speaking at a time, and adding custom vocabulary where your tool supports it all reduce transcription errors before they reach the summary.",
          },
        ],
      },
      {
        id: "step-4-summary-prompt",
        heading: "Step 4: Use a structured summary prompt",
        blocks: [
          {
            type: "p",
            text: "Whether you use a meeting assistant's custom prompt feature or a general chat assistant, a consistent prompt gives you summaries in the same shape every time. Copy this template and adjust the sections to suit your team:",
          },
          {
            type: "code",
            language: "text",
            code: [
              "You are summarizing an internal meeting for attendees and for colleagues",
              "who could not attend.",
              "",
              "Meeting: [title]",
              "Date: [date]",
              "Attendees: [names and roles]",
              "",
              "Using only the transcript below, produce:",
              "",
              "1. Summary: 3-5 sentences on the purpose and outcome.",
              "2. Decisions: a bulleted list of decisions that were explicitly agreed.",
              "   If there were none, write \"No decisions recorded.\"",
              "3. Action items: a table with the columns Task, Owner and Due date.",
              "   Use only owners and dates stated in the meeting; otherwise write",
              "   \"Not specified\".",
              "4. Open questions: issues raised but not resolved.",
              "",
              "Rules:",
              "- Do not add information that is not in the transcript.",
              "- If something is ambiguous, list it under Open questions instead of guessing.",
              "- Spell names exactly as they appear in the transcript.",
              "- Keep the whole summary under 300 words.",
              "",
              "Transcript:",
              "[paste transcript]",
            ].join("\n"),
          },
          {
            type: "p",
            text: "For short notes rather than full transcripts, our [text summarizer](/free-ai-tools/text-summarizer) is a lightweight alternative.",
          },
          {
            type: "callout",
            tone: "tip",
            title: "Handling long meetings",
            text: "If a transcript is too long for one message, split it into parts, summarize each with the same prompt, then ask for a combined summary. Check that decisions from the earlier parts survive the merge.",
          },
        ],
      },
      {
        id: "step-5-verify-action-items",
        heading: "Step 5: Verify decisions and action items",
        blocks: [
          {
            type: "p",
            text: "AI summaries read fluently and are sometimes wrong. Typical errors include assigning a task to the wrong person, turning a suggestion into a decision, inventing a due date, and missing a point raised briefly at the end. These are exactly the errors that cause problems later, so check for them every time.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Compare each decision with the transcript. Was it agreed, or only discussed?",
              "Confirm every action item has the right owner, and that the owner actually accepted it.",
              "Remove or flag any due date that nobody stated.",
              "Reread the final minutes of the transcript, where action items are often agreed in a hurry.",
              "Ask the meeting lead to approve the summary before it goes out.",
            ],
          },
          {
            type: "callout",
            tone: "warning",
            title: "Never send unreviewed summaries outside your team",
            text: "A summary sent to a client becomes a record of what was agreed. Have someone who attended read it in full before it leaves your organization.",
          },
        ],
      },
      {
        id: "step-6-share-and-store",
        heading: "Step 6: Share and store summaries responsibly",
        blocks: [
          {
            type: "list",
            items: [
              "Send the summary to attendees promptly and invite corrections by a set time.",
              "Copy action items into your task tool so they are tracked, not just read.",
              "Store summaries where the team can find them, with the same access controls as the meeting itself.",
              "Delete recordings and transcripts according to your retention policy; the summary is often all you need to keep.",
            ],
          },
        ],
      },
      {
        id: "troubleshooting",
        heading: "Troubleshooting",
        blocks: [
          {
            type: "list",
            items: [
              "**Speakers are mixed up.** Fix speaker labels before summarizing, and ask attendees to introduce themselves on calls with new participants.",
              "**The summary is too generic.** State the meeting's purpose in the prompt and ask for specific outcomes rather than themes.",
              "**Action items have no owners.** That often reflects the meeting itself. Treat each \"Not specified\" entry as a prompt to follow up, and agree owners explicitly in future meetings.",
              "**The notetaker joined a meeting it should not have.** Review the assistant's calendar settings so it joins only the meetings you choose, rather than every event automatically.",
              "**People are uncomfortable being recorded.** Offer a no-recording option and take manual notes for those meetings.",
            ],
          },
        ],
      },
    ],
    authorId: "research-desk",
    publishedAt: "2026-09-07",
    tags: ["Meeting notes", "AI summaries", "Productivity", "Transcription"],
    relatedTools: ["otter-ai", "fireflies-ai", "chatgpt", "claude"],
  },
];
