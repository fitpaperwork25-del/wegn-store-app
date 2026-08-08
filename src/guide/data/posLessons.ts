// WEGN Store Academy — Phase 3 curriculum. Each entry is a plain
// LessonContent value rendered through the shared LessonLayout
// template (see lesson/LessonLayout.tsx); nothing here knows how to
// render itself. New lessons are added the same way: a new key here,
// a stub in data/navigation.ts, and (if it should award one) a badge
// in data/badges.ts. GuideApp routes any lessonId found in this map
// straight to PosLessonPage.

import type { LessonContent } from "../lesson/types";

export const POS_LESSONS: Record<string, LessonContent> = {
  "opening-cash-drawer": {
    id: "opening-cash-drawer",
    sectionId: "getting-started",
    title: "Opening the Cash Drawer",
    minutes: 3,
    badgeId: "drawer-opener",
    overview: {
      objectives: [
        "Open the drawer safely from the POS",
        "Count and confirm your starting float",
        "Know when not to use the manual key",
      ],
      summary:
        "Before any sale, you open the cash drawer and confirm how much cash you're starting your shift with.",
      whyItMatters:
        "A wrong starting count throws off every cash reconciliation for the rest of the shift.",
    },
    walkthrough: {
      screenLabel: "POS home screen",
      callouts: [
        { label: "1", title: "Open Drawer button", description: "Opens the drawer electronically — always use this, never force it." },
        { label: "2", title: "Starting float field", description: "Enter the exact cash amount you're starting the drawer with." },
        { label: "3", title: "Confirm & Start Shift", description: "Locks in your starting count and begins tracking sales against it." },
      ],
    },
    practice: {
      intro: "Try it: enter a starting float and confirm the shift.",
      steps: [
        { title: "Open the drawer", description: "Use the Open Drawer button on the POS home screen." },
        { title: "Enter your starting float", description: "Type in the cash amount you counted." },
        { title: "Confirm and start your shift", description: "Locks in the count and begins tracking." },
      ],
    },
    tips: {
      good: [
        { text: "Count the float twice before confirming." },
        { text: "Open the drawer from the POS, not the manual key, whenever possible." },
      ],
      watchOutFor: [
        { text: "Starting a shift without counting cash first." },
        { text: "Leaving the drawer open between sales." },
      ],
    },
    quiz: [
      {
        question: "What should you do before confirming your starting float?",
        options: [
          { text: "Count the cash twice", correct: true },
          { text: "Skip counting — it's tracked automatically", correct: false },
          { text: "Ask a customer to count it", correct: false },
        ],
        explanation: "Counting twice catches mistakes before they become the day's starting number.",
      },
      {
        question: "When should you use the manual key to open the drawer?",
        options: [
          { text: "Only when the electronic open fails", correct: true },
          { text: "Every time — it's faster", correct: false },
          { text: "Never — it's disabled", correct: false },
        ],
        explanation: "The manual key is a backup, not the default way to open the drawer.",
      },
      {
        question: "Why does an accurate starting float matter?",
        options: [
          { text: "It's what every later reconciliation is compared against", correct: true },
          { text: "It doesn't affect anything", correct: false },
          { text: "Only reports care about it", correct: false },
        ],
        explanation: "Every count at close-out is compared back to this starting number.",
      },
    ],
    nextLesson: { lessonId: "sample-first-sale", sectionId: "getting-started", title: "Ringing up your first sale" },
  },

  "barcode-scanning": {
    id: "barcode-scanning",
    sectionId: "getting-started",
    title: "Barcode Scanning",
    minutes: 3,
    badgeId: "scan-master",
    overview: {
      objectives: [
        "Scan an item into the cart",
        "Add more of the same item by rescanning",
        "Resolve a barcode that isn't in your catalog yet",
      ],
      summary:
        "Scanning is the fastest, most accurate way to add items — this lesson covers the scan flow and exactly what happens when a barcode doesn't match anything.",
      whyItMatters: "Fewer manual lookups means shorter lines and fewer pricing mistakes.",
    },
    walkthrough: {
      screenLabel: "Scan field on the POS",
      callouts: [
        { label: "1", title: "Scan field", description: "Focused when the POS screen first loads — just scan. If you've clicked into another field, click back into the scan field first." },
        { label: "2", title: "Rescan to add another", description: "There's no on-screen +/- stepper — scanning the same barcode again is how you add one more to that line." },
        { label: "3", title: "Unmatched barcode banner", description: "If a scan doesn't match your catalog, a banner appears with two choices: Add New Product or Link to Existing Product — not a manual search." },
      ],
    },
    practice: {
      intro: "Try scanning a few items and triggering the unmatched-barcode banner.",
      steps: [
        { title: "Scan an item", description: "Add it to the cart with a single scan." },
        { title: "Scan the same item twice", description: "Watch the quantity bump instead of a duplicate line." },
        { title: "Trigger the unmatched-barcode banner", description: "Scan a code that isn't in your catalog and see the two resolution options." },
      ],
    },
    tips: {
      good: [
        { text: "Hold the barcode flat and steady, a few inches from the scanner." },
        { text: "Re-scan instead of typing the code by hand — it's faster and avoids typos." },
      ],
      watchOutFor: [
        { text: "Scanning through a phone screen or crumpled label — it often misreads." },
        { text: "Ignoring the unmatched-barcode banner instead of resolving it with one of its two buttons." },
      ],
    },
    quiz: [
      {
        question: "What's the fastest way to add the same item twice?",
        options: [
          { text: "Scan it again", correct: true },
          { text: "Type the SKU manually", correct: false },
          { text: "Search the catalog", correct: false },
        ],
        explanation: "A second scan just bumps the quantity — no extra steps needed.",
      },
      {
        question: "What happens when you scan a barcode that isn't in your catalog?",
        options: [
          { text: "A banner appears with Add New Product and Link to Existing Product options", correct: true },
          { text: "The scanner beeps and does nothing else", correct: false },
          { text: "It's added to the cart as an unknown item", correct: false },
        ],
        explanation: "WEGN Store tells you directly and gives you two ways to resolve it — there's no manual-search fallback.",
      },
      {
        question: "Why avoid typing barcodes by hand?",
        options: [
          { text: "It's slower and typo-prone", correct: true },
          { text: "It's against policy", correct: false },
          { text: "It doesn't work at all", correct: false },
        ],
        explanation: "A mistyped digit can ring up the wrong product entirely.",
      },
    ],
    nextLesson: { lessonId: "product-search", sectionId: "getting-started", title: "Product Search" },
  },

  "product-search": {
    id: "product-search",
    sectionId: "getting-started",
    title: "Finding a Product Without a Barcode",
    minutes: 3,
    badgeId: "search-pro",
    overview: {
      objectives: [
        "Add a product at checkout when there's no barcode to scan",
        "Understand why POS uses a simple picker, not a search bar",
        "Know where real name/SKU/category search lives when you need it",
      ],
      summary:
        "Not everything has a scannable barcode in hand. POS keeps this simple on purpose: a product picker, not a search bar.",
      whyItMatters: "Expecting a search box that isn't there wastes time at the register — knowing the real tool (and where full search actually lives) keeps the line moving.",
    },
    walkthrough: {
      screenLabel: "Product picker (POS)",
      callouts: [
        { label: "1", title: "Product picker", description: "A dropdown listing every active product with stock on hand — there's no free-text search box at checkout." },
        { label: "2", title: "One at a time", description: "Selecting a product adds one to the cart; scan or reselect it to add more." },
        { label: "3", title: "Need to search by name, SKU, or category?", description: "That lives on the Inventory tab's Products & Stock table — a different screen from checkout." },
      ],
    },
    practice: {
      intro: "Open the picker, add a product, and note where real search lives.",
      steps: [
        { title: "Open the product picker", description: "Find it on the POS screen." },
        { title: "Select a product to add it", description: "It adds one unit to the cart." },
        { title: "Remember where full search lives", description: "Name/SKU/category search is on the Inventory tab, not at checkout." },
      ],
    },
    tips: {
      good: [
        { text: "Keep frequently-sold no-barcode items easy to recognize by name in the picker." },
        { text: "If you need to search or filter by category, that's the Inventory tab's job, not checkout's." },
      ],
      watchOutFor: [
        { text: "Expecting a search box at checkout — POS only offers the picker." },
        { text: "Picking the wrong item from a long dropdown — double-check before adding." },
      ],
    },
    quiz: [
      {
        question: "How do you add a product at POS when it has no barcode to scan?",
        options: [
          { text: "Select it from the product picker", correct: true },
          { text: "Type its name into a checkout search bar", correct: false },
          { text: "It can't be added without a barcode", correct: false },
        ],
        explanation: "POS checkout has a product picker dropdown, not a search bar.",
      },
      {
        question: "Where does real product search (by name, SKU, or category) live?",
        options: [
          { text: "The Inventory tab", correct: true },
          { text: "The POS checkout screen", correct: false },
          { text: "It doesn't exist anywhere in WEGN Store", correct: false },
        ],
        explanation: "Full search and category filtering is a Products & Stock feature on the Inventory tab.",
      },
      {
        question: "What happens if you select the same product again in the picker?",
        options: [
          { text: "It adds one more to the cart", correct: true },
          { text: "It removes it from the cart", correct: false },
          { text: "Nothing happens", correct: false },
        ],
        explanation: "Each selection adds one unit, the same as a rescan would.",
      },
    ],
    nextLesson: { lessonId: "applying-discounts", sectionId: "getting-started", title: "Applying Discounts" },
  },

  "applying-discounts": {
    id: "applying-discounts",
    sectionId: "getting-started",
    title: "Applying Discounts",
    minutes: 4,
    badgeId: "discount-decider",
    overview: {
      objectives: [
        "Use Negotiate to manually reprice one item (when your store's Selling Policy allows it)",
        "Apply a cart-wide % or $ off",
        "Clear a cart-wide discount you applied by mistake",
      ],
      summary:
        "WEGN Store doesn't have one generic \"discount button.\" Per-item pricing flexibility comes from Negotiate; the whole order can get a separate cart-wide % or $ off.",
      whyItMatters: "Negotiate is gated by your store's Selling Policy and reason-tracked; the cart-wide discount hits the entire order. Mixing them up misprices a sale.",
    },
    walkthrough: {
      screenLabel: "Cart panel — pricing controls",
      callouts: [
        { label: "1", title: "Negotiate (per item)", description: "Only appears if your store's Selling Policy allows negotiated pricing. Opens a panel to type a new unit price and pick a reason (Bulk discount, Loyal customer, Price match, Damaged packaging, Clearance, or your own)." },
        { label: "2", title: "Cart-wide % or $ Off", description: "A dropdown lets you pick % Off or $ Off and type an amount — applies to the whole order total, not one line." },
        { label: "3", title: "Clear", description: "A text button, not an × icon, that removes a cart-wide discount you applied by mistake." },
      ],
    },
    practice: {
      intro: "Check whether Negotiate is available, apply a cart-wide discount, then clear it.",
      steps: [
        { title: "Check whether Negotiate is available", description: "It only appears when Selling Policy isn't Fixed Prices." },
        { title: "Apply a cart-wide % Off", description: "Pick a percentage and watch the total update." },
        { title: "Clear the discount", description: "Use the Clear button to remove it." },
      ],
    },
    tips: {
      good: [
        { text: "Always enter an honest reason when negotiating a price — it's logged with the sale." },
        { text: "Confirm with the customer whether they meant a % or a $ amount before applying a cart-wide discount." },
      ],
      watchOutFor: [
        { text: "Expecting a generic \"item discount\" button — the real per-item tool is Negotiate, and only under certain selling policies." },
        { text: "Forgetting a cart-wide discount applies to the whole order, not just the one item a customer asked about." },
      ],
    },
    quiz: [
      {
        question: "What lets you manually change one item's price at checkout?",
        options: [
          { text: "Negotiate", correct: true },
          { text: "An item discount button", correct: false },
          { text: "There's no way to do this", correct: false },
        ],
        explanation: "Negotiate opens a panel for a manual price plus a reason — there's no separate \"discount\" control per item.",
      },
      {
        question: "When does Negotiate appear at checkout?",
        options: [
          { text: "Only when your store's Selling Policy isn't Fixed Prices", correct: true },
          { text: "Always, on every sale", correct: false },
          { text: "Only on returns", correct: false },
        ],
        explanation: "Negotiate is hidden entirely under a Fixed Prices selling policy.",
      },
      {
        question: "How do you remove a cart-wide discount you applied by mistake?",
        options: [
          { text: "Click Clear", correct: true },
          { text: "Click an × icon", correct: false },
          { text: "Void the sale", correct: false },
        ],
        explanation: "The control is a text button labeled Clear, not an icon — and no void is needed.",
      },
    ],
    nextLesson: { lessonId: "payment-methods", sectionId: "getting-started", title: "Accepting Different Payment Methods" },
  },

  "payment-methods": {
    id: "payment-methods",
    sectionId: "getting-started",
    title: "Accepting Different Payment Methods",
    minutes: 4,
    badgeId: "payment-pro",
    overview: {
      objectives: [
        "Select the right payment method from WEGN Store's tender list",
        "Take a cash payment and read the change due",
        "Know that WEGN Store doesn't support splitting one sale across two payment methods",
      ],
      summary: "WEGN Store checkout uses one payment-method dropdown — Cash, Card, and several local mobile-money options — for a single tender per sale.",
      whyItMatters: "Knowing exactly what checkout does (and doesn't) support means never promising a customer something it can't do.",
    },
    walkthrough: {
      screenLabel: "Payment screen",
      callouts: [
        { label: "1", title: "Payment method dropdown", description: "Choose one: Cash, Card, Telebirr, CBE Birr, Chapa, M-Pesa/MTN Mobile Money, Airtel Money, or Other. Selecting Card just records that as the tender — there's no connected reader or approval step in the app." },
        { label: "2", title: "Cash → Amount tendered", description: "Selecting Cash reveals an Amount Tendered field; Change Due calculates automatically once it covers the total." },
        { label: "3", title: "One tender per sale", description: "There's no split-payment option — every sale is recorded against a single payment method." },
      ],
    },
    practice: {
      intro: "Select Cash, enter a tendered amount, then see what changes for a non-cash method.",
      steps: [
        { title: "Select Cash as the payment method", description: "See the Amount Tendered field appear." },
        { title: "Enter a tendered amount above the total", description: "Watch Change Due calculate." },
        { title: "Switch to another method", description: "See the tendered/change fields disappear." },
      ],
    },
    tips: {
      good: [
        { text: "Read the change amount back to the customer before handing it over." },
        { text: "If a customer wants to split a payment across two methods, tell them upfront WEGN Store can't do that on one sale." },
      ],
      watchOutFor: [
        { text: "Assuming Card triggers a reader/approval wait — it doesn't; it's just a record of the tender." },
        { text: "Promising a split payment — it isn't supported." },
      ],
    },
    quiz: [
      {
        question: "What happens when you select Card as the payment method?",
        options: [
          { text: "It's recorded as the tender — there's no reader or approval step in the app", correct: true },
          { text: "It prompts a connected card reader and waits for approval", correct: false },
          { text: "It automatically adds a card surcharge", correct: false },
        ],
        explanation: "Card is one option in the tender dropdown, not a hardware integration.",
      },
      {
        question: "What appears when you select Cash?",
        options: [
          { text: "An Amount Tendered field, with Change Due calculated automatically", correct: true },
          { text: "A discount menu", correct: false },
          { text: "Nothing different from other methods", correct: false },
        ],
        explanation: "Cash is the only method with a tendered/change calculation.",
      },
      {
        question: "Can a sale be split across two payment methods?",
        options: [
          { text: "No — one payment method per sale", correct: true },
          { text: "Yes, always", correct: false },
          { text: "Only for returns", correct: false },
        ],
        explanation: "WEGN Store has no split-payment feature; each sale stores a single tender.",
      },
    ],
    nextLesson: { lessonId: "printing-receipt", sectionId: "getting-started", title: "Printing a Receipt" },
  },

  "printing-receipt": {
    id: "printing-receipt",
    sectionId: "getting-started",
    title: "Printing a Receipt",
    minutes: 3,
    badgeId: "receipt-runner",
    overview: {
      objectives: [
        "Print a receipt to the connected printer",
        "Reprint a receipt for a past sale from Sales History",
        "Know that emailing a receipt isn't a feature yet",
      ],
      summary: "Every completed sale can be printed right away or reprinted later from Sales History — there's no email option today.",
      whyItMatters: "Customers need proof of purchase for returns — knowing exactly how to get them one (and that email isn't an option) avoids promising something checkout can't do.",
    },
    walkthrough: {
      screenLabel: "Receipt print modal",
      callouts: [
        { label: "1", title: "Print button", description: "Sends the receipt to your browser's print dialog / connected printer." },
        { label: "2", title: "Close", description: "Dismisses the receipt without printing — there's no separate \"no receipt\" control, Close is how you skip it." },
        { label: "3", title: "Reprint from Sales History", description: "Every past sale has its own Print button — nothing is lost if a customer wants a copy later." },
      ],
    },
    practice: {
      intro: "Print a receipt, close one without printing, then reprint from Sales History.",
      steps: [
        { title: "Print a receipt", description: "Send it to the printer." },
        { title: "Close without printing", description: "Practice skipping a receipt when a customer declines." },
        { title: "Reprint from Sales History", description: "Find a past sale and print it again." },
      ],
    },
    tips: {
      good: [
        { text: "If a customer asks to have it emailed, let them know WEGN Store doesn't support that yet — offer a reprint if they come back instead." },
        { text: "Confirm the printer has paper before the line builds up." },
      ],
      watchOutFor: [
        { text: "Promising to email a receipt — that feature doesn't exist." },
        { text: "Forgetting a declined receipt can still be printed later from Sales History." },
      ],
    },
    quiz: [
      {
        question: "What are the two options in the receipt print modal?",
        options: [
          { text: "Print and Close", correct: true },
          { text: "Print and Email", correct: false },
          { text: "Print, Email, and No Receipt", correct: false },
        ],
        explanation: "There is no email option anywhere in the receipt flow — only Print and Close.",
      },
      {
        question: "Where can you reprint a past receipt?",
        options: [
          { text: "Sales History", correct: true },
          { text: "Settings", correct: false },
          { text: "Employees", correct: false },
        ],
        explanation: "Sales History keeps every past sale, reprintable any time.",
      },
      {
        question: "What happens if a customer declines a receipt?",
        options: [
          { text: "Click Close — it can still be reprinted later from Sales History", correct: true },
          { text: "It's gone forever", correct: false },
          { text: "The sale is voided", correct: false },
        ],
        explanation: "Declining a receipt at checkout doesn't erase the sale record.",
      },
    ],
    nextLesson: { lessonId: "processing-return", sectionId: "getting-started", title: "Processing a Return" },
  },

  "processing-return": {
    id: "processing-return",
    sectionId: "getting-started",
    title: "Processing a Return",
    minutes: 5,
    badgeId: "return-specialist",
    overview: {
      objectives: [
        "Look up the original sale for a return",
        "Process a refund to the original payment method",
        "Restock a returned item correctly",
      ],
      summary:
        "Returns happen — this lesson covers finding the original sale, refunding correctly, and getting stock counts right again.",
      whyItMatters: "A mishandled return throws off both your cash reconciliation and your inventory counts.",
    },
    walkthrough: {
      screenLabel: "Sales History screen",
      callouts: [
        { label: "1", title: "Find sale", description: "Search by receipt number, date, or customer to locate the original sale." },
        { label: "2", title: "Return button", description: "Starts a refund against that specific sale." },
        { label: "3", title: "Restock toggle", description: "Controls whether the returned item goes back into sellable inventory." },
      ],
    },
    practice: {
      intro: "Find a past sale and process a return against it.",
      steps: [
        { title: "Find the original sale", description: "Search Sales History for the receipt." },
        { title: "Start a return", description: "Select the item to refund." },
        { title: "Choose whether to restock it", description: "Toggle restock based on the item's condition." },
      ],
    },
    tips: {
      good: [
        { text: "Always refund to the original payment method when possible." },
        { text: "Check the item's condition before toggling restock on." },
      ],
      watchOutFor: [
        { text: "Processing a return with no original sale on file." },
        { text: "Restocking a damaged item by mistake." },
      ],
    },
    quiz: [
      {
        question: "Where do you find the original sale for a return?",
        options: [
          { text: "Sales History", correct: true },
          { text: "Employees", correct: false },
          { text: "Settings", correct: false },
        ],
        explanation: "Sales History is where every past receipt lives, searchable by receipt, date, or customer.",
      },
      {
        question: "What payment method should a refund go back to?",
        options: [
          { text: "The original one, when possible", correct: true },
          { text: "Always cash", correct: false },
          { text: "Store credit only", correct: false },
        ],
        explanation: "Refunding to the original tender keeps reconciliation clean.",
      },
      {
        question: "What should you check before restocking a returned item?",
        options: [
          { text: "Its condition", correct: true },
          { text: "The customer's name", correct: false },
          { text: "The register number", correct: false },
        ],
        explanation: "A damaged item shouldn't go back into sellable inventory.",
      },
    ],
    nextLesson: { lessonId: "closing-cash-drawer", sectionId: "getting-started", title: "Closing the Cash Drawer" },
  },

  "closing-cash-drawer": {
    id: "closing-cash-drawer",
    sectionId: "getting-started",
    title: "Closing the Cash Drawer",
    minutes: 3,
    badgeId: "drawer-closer",
    overview: {
      objectives: [
        "Count the drawer at end of shift",
        "Compare counted cash to expected totals",
        "Close out and hand off the drawer",
      ],
      summary: "Closing out means counting the drawer, comparing it to what the system expects, and logging the result.",
      whyItMatters: "This is the check that catches counting mistakes, missed sales, or drawer discrepancies before they pile up.",
    },
    walkthrough: {
      screenLabel: "End of shift screen",
      callouts: [
        { label: "1", title: "Count drawer", description: "Enter what you actually counted in the drawer." },
        { label: "2", title: "Expected total", description: "What the system calculated based on sales during your shift." },
        { label: "3", title: "Variance", description: "The difference between counted and expected — should be close to zero." },
      ],
    },
    practice: {
      intro: "Count a drawer and compare it against the expected total.",
      steps: [
        { title: "Enter your counted cash total", description: "Type in what you actually counted." },
        { title: "Review the variance", description: "Compare against the expected total." },
        { title: "Close out the shift", description: "Log the result and hand off the drawer." },
      ],
    },
    tips: {
      good: [
        { text: "Count twice before entering your total." },
        { text: "Investigate any variance before closing out, not after." },
      ],
      watchOutFor: [
        { text: "Closing out without double-checking the variance." },
        { text: "Leaving cash in the drawer for the next shift without logging it." },
      ],
    },
    quiz: [
      {
        question: "What does \"variance\" mean at close-out?",
        options: [
          { text: "The difference between counted and expected cash", correct: true },
          { text: "The tax rate", correct: false },
          { text: "The discount total", correct: false },
        ],
        explanation: "Variance is the gap between what you counted and what the system expected.",
      },
      {
        question: "When should you investigate a variance?",
        options: [
          { text: "Before closing out", correct: true },
          { text: "Never — it's automatic", correct: false },
          { text: "After the next shift starts", correct: false },
        ],
        explanation: "Investigating before closing out is much easier than after the trail goes cold.",
      },
      {
        question: "What should you do before entering your counted total?",
        options: [
          { text: "Count twice", correct: true },
          { text: "Round to the nearest $10", correct: false },
          { text: "Ask a customer", correct: false },
        ],
        explanation: "A second count catches mistakes before they're logged as the official total.",
      },
    ],
    nextLesson: { lessonId: null, sectionId: "getting-started", title: "Inviting your first staff member" },
  },
};
