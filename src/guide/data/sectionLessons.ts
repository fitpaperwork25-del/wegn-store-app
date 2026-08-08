// Task-based lessons for every Academy section besides the Getting
// Started sequence (see posLessons.ts for that one). Same pattern:
// plain LessonContent values rendered through the shared LessonLayout
// template via TaskLessonPage — nothing here knows how to render
// itself. Every workflow described is grounded in a real screen in
// the host app (Inventory/Purchasing/Customers/Reports/Staff tabs,
// Sales History, and the POS unmatched-barcode flow) — see each
// lesson's walkthrough for the exact real UI it's teaching.

import type { LessonContent } from "../lesson/types";

export const SECTION_LESSONS: Record<string, LessonContent> = {
  // ── Daily Operations ──────────────────────────────────────────
  "do-1": {
    id: "do-1",
    sectionId: "daily-operations",
    title: "Looking Up a Past Sale",
    minutes: 3,
    badgeId: "sale-detective",
    overview: {
      objectives: [
        "Search Sales History by receipt, product, or customer",
        "Filter by date range and cashier",
        "Tell completed, voided, and returned sales apart",
      ],
      summary: "Every sale ever rung up lives in Sales History — this lesson covers finding the one you need, fast.",
      whyItMatters: "A customer dispute, a reprint request, or a reconciliation question all start with finding the right sale.",
    },
    walkthrough: {
      screenLabel: "Sales History panel",
      callouts: [
        { label: "1", title: "Search bar", description: "Search by receipt, product, barcode, or customer — any of them finds the sale." },
        { label: "2", title: "Date range", description: "Narrow results to Today, Last 7 Days, Last 30 Days, or All Time." },
        { label: "3", title: "Cashier filter", description: "See only the sales rung up by one specific employee." },
      ],
    },
    practice: {
      intro: "Search for a sale, then narrow it down with filters.",
      steps: [
        { title: "Search by a product name", description: "Type part of a product name into the search bar." },
        { title: "Switch the date range", description: "Change it to Last 7 Days." },
        { title: "Filter to a single cashier", description: "Pick one employee from the cashier filter." },
      ],
    },
    tips: {
      good: [
        { text: "Search by phone number or name to find a customer's sales fast." },
        { text: "Check the Status column before assuming a sale went through — voided and returned sales show differently." },
      ],
      watchOutFor: [
        { text: "Assuming a voided sale still counts toward the day's revenue." },
        { text: "Searching the wrong date range and concluding a sale is missing." },
      ],
    },
    quiz: [
      {
        question: "What can you search Sales History by?",
        options: [
          { text: "Receipt, product, barcode, or customer", correct: true },
          { text: "Only receipt number", correct: false },
          { text: "Only date", correct: false },
        ],
        explanation: "Search matches receipts, products, barcodes, and customers all at once.",
      },
      {
        question: "How do you see only one cashier's sales?",
        options: [
          { text: "Use the cashier filter", correct: true },
          { text: "Search their name in the product field", correct: false },
          { text: "You can't", correct: false },
        ],
        explanation: "The cashier filter narrows the list to one employee's sales.",
      },
      {
        question: "Why check the Status column?",
        options: [
          { text: "To tell completed, voided, and returned sales apart", correct: true },
          { text: "It shows the tax rate", correct: false },
          { text: "It's just decorative", correct: false },
        ],
        explanation: "Status is how you know at a glance whether a sale actually counts.",
      },
    ],
    nextLesson: { lessonId: "do-2", sectionId: "daily-operations", title: "Voiding a Sale" },
  },

  "do-2": {
    id: "do-2",
    sectionId: "daily-operations",
    title: "Voiding a Sale",
    minutes: 3,
    badgeId: "void-master",
    overview: {
      objectives: [
        "Void a completed sale",
        "Know when to void vs. process a return",
        "Understand what happens to a voided sale",
      ],
      summary: "Sometimes a sale needs to be undone entirely — ringing up the wrong cart, a training mistake, a duplicate charge. Voiding cancels it.",
      whyItMatters: "Voiding the wrong way — or using a return when you meant to void — makes your numbers and inventory harder to trust.",
    },
    walkthrough: {
      screenLabel: "Sales History row actions",
      callouts: [
        { label: "1", title: "Void button", description: "Appears only on completed sales — cancels the sale entirely." },
        { label: "2", title: "Status changes to Voided", description: "The row updates immediately so it's clear at a glance." },
        { label: "3", title: "Permission-gated", description: "Only staff with void permission see this button at all." },
      ],
    },
    practice: {
      intro: "Find a completed sale and void it.",
      steps: [
        { title: "Find a completed sale", description: "Locate it in Sales History." },
        { title: "Click Void", description: "Cancel the sale." },
        { title: "Confirm the status", description: "The row now shows Voided." },
      ],
    },
    tips: {
      good: [
        { text: "Void as soon as you catch the mistake — same shift, before it's reconciled." },
        { text: "Use a Return instead of a Void once the customer has already left with the goods." },
      ],
      watchOutFor: [
        { text: "Voiding a sale that's already been returned or reconciled." },
        { text: "Using Void as a substitute for a real customer return." },
      ],
    },
    quiz: [
      {
        question: "When should you void a sale instead of returning it?",
        options: [
          { text: "Right after ringing it up by mistake, before the customer leaves", correct: true },
          { text: "After the customer has used the product for a week", correct: false },
          { text: "Never — always use a return", correct: false },
        ],
        explanation: "Voiding is for catching a mistake immediately, not for after-the-fact returns.",
      },
      {
        question: "Who can void a sale?",
        options: [
          { text: "Only staff with void permission", correct: true },
          { text: "Any cashier, always", correct: false },
          { text: "Only the customer", correct: false },
        ],
        explanation: "Void is permission-gated, not available to everyone by default.",
      },
      {
        question: "What happens to the sale's status after voiding?",
        options: [
          { text: "It changes to Voided", correct: true },
          { text: "It disappears from history", correct: false },
          { text: "It becomes a return", correct: false },
        ],
        explanation: "A voided sale stays visible in history, just marked Voided.",
      },
    ],
    nextLesson: null,
  },

  // ── Inventory ─────────────────────────────────────────────────
  "inv-1": {
    id: "inv-1",
    sectionId: "inventory",
    title: "Adding your first product",
    minutes: 4,
    badgeId: "catalog-builder",
    overview: {
      objectives: [
        "Add a new product with pricing and stock",
        "Use barcode auto-lookup",
        "Assign a category and reorder level",
      ],
      summary: "Every item you sell starts here — the Add Product form on the Inventory tab.",
      whyItMatters: "Accurate names, prices, and starting stock keep the POS, reports, and reorder alerts all correct from day one.",
    },
    walkthrough: {
      screenLabel: "Add Product form (Inventory tab)",
      callouts: [
        { label: "1", title: "Product Name & Barcode", description: "Name is required; scanning or typing a barcode auto-fills details if it's already known." },
        { label: "2", title: "Cost Price & Selling Price", description: "Selling Price is required — this is what shows at checkout." },
        { label: "3", title: "Reorder Level & Initial Stock", description: "Reorder Level drives low-stock alerts; Initial Stock is what you're counting in today." },
      ],
    },
    practice: {
      intro: "Add a product with the required fields, then a category.",
      steps: [
        { title: "Enter a product name and selling price", description: "The two required fields." },
        { title: "Set a reorder level", description: "This decides when it shows up as low stock." },
        { title: "Choose a category and submit", description: "Adds the product to your catalog." },
      ],
    },
    tips: {
      good: [
        { text: "Set a realistic reorder level, not zero — zero means you find out you're out after you're already out." },
        { text: "Use the barcode field before typing everything by hand — it may already know the product." },
      ],
      watchOutFor: [
        { text: "Leaving Selling Price blank — it's required for the product to ring up correctly." },
        { text: "Forgetting Initial Stock, which leaves the product showing zero on hand." },
      ],
    },
    quiz: [
      {
        question: "Which fields are required to add a product?",
        options: [
          { text: "Product Name and Selling Price", correct: true },
          { text: "Only Product Name", correct: false },
          { text: "Barcode and SKU", correct: false },
        ],
        explanation: "Name and Selling Price are the two required fields; everything else is optional.",
      },
      {
        question: "What does the Reorder Level control?",
        options: [
          { text: "When the product shows up as low stock", correct: true },
          { text: "The selling price", correct: false },
          { text: "The product's category", correct: false },
        ],
        explanation: "Once stock falls to or below this number, it counts as low stock.",
      },
      {
        question: "What can barcode auto-lookup do?",
        options: [
          { text: "Auto-fill product details if the barcode is already known", correct: true },
          { text: "Automatically set the price", correct: false },
          { text: "Nothing — it's just a label", correct: false },
        ],
        explanation: "Typing or scanning a known barcode fills in details automatically.",
      },
    ],
    nextLesson: { lessonId: "inv-2", sectionId: "inventory", title: "Setting low-stock alerts" },
  },

  "inv-2": {
    id: "inv-2",
    sectionId: "inventory",
    title: "Setting low-stock alerts",
    minutes: 3,
    badgeId: "stock-watcher",
    overview: {
      objectives: [
        "Set or change a product's reorder level",
        "Find products that need ordering",
        "Understand how reorder level feeds Purchasing",
      ],
      summary: "A low-stock alert is really just a Reorder Level on each product — set it once and WEGN Store watches it for you.",
      whyItMatters: "Running out of a bestseller mid-shift is one of the easiest problems to prevent.",
    },
    walkthrough: {
      screenLabel: "Inventory summary + Needs Ordering panel",
      callouts: [
        { label: "1", title: "Low Stock Items card", description: "Counts every product at or below its reorder level, at a glance." },
        { label: "2", title: "Reorder Level field", description: "Edit any product to raise or lower its threshold." },
        { label: "3", title: "Needs Ordering Today", description: "Lists every low-stock product with a suggested order quantity and estimated cost." },
      ],
    },
    practice: {
      intro: "Set a reorder level, then find it in the low-stock list.",
      steps: [
        { title: "Edit a product's reorder level", description: "Raise or lower its threshold." },
        { title: "Check the Low Stock Items count", description: "See it reflected on the summary card." },
        { title: "Open Needs Ordering Today", description: "Review the suggested order quantities." },
      ],
    },
    tips: {
      good: [
        { text: "Set higher reorder levels for your fastest-selling items." },
        { text: "Review Needs Ordering Today before creating a purchase order — it's already done the math." },
      ],
      watchOutFor: [
        { text: "Setting every reorder level to the same number regardless of how fast an item sells." },
        { text: "Ignoring the low-stock count until a shelf is actually empty." },
      ],
    },
    quiz: [
      {
        question: "What triggers a product to appear as low stock?",
        options: [
          { text: "Its quantity on hand falls to or below its reorder level", correct: true },
          { text: "It hasn't sold in a week", correct: false },
          { text: "A manager marks it manually", correct: false },
        ],
        explanation: "Low stock is purely a comparison of quantity on hand to reorder level.",
      },
      {
        question: "Where can you see a suggested order quantity for a low-stock item?",
        options: [
          { text: "Needs Ordering Today", correct: true },
          { text: "The receipt printer", correct: false },
          { text: "Employee settings", correct: false },
        ],
        explanation: "Needs Ordering Today calculates a suggested quantity for every low-stock product.",
      },
      {
        question: "Should every product have the same reorder level?",
        options: [
          { text: "No — set it based on how fast each item sells", correct: true },
          { text: "Yes, always", correct: false },
          { text: "Only bestsellers need one", correct: false },
        ],
        explanation: "Fast sellers need higher thresholds than slow-moving items.",
      },
    ],
    nextLesson: { lessonId: "inv-3", sectionId: "inventory", title: "Running a stock count" },
  },

  "inv-3": {
    id: "inv-3",
    sectionId: "inventory",
    title: "Running a stock count",
    minutes: 8,
    badgeId: "count-champion",
    overview: {
      objectives: [
        "Start a stock count",
        "Enter counted quantities and read variances",
        "Confirm a count and review its history",
      ],
      summary: "A stock count compares what the system thinks you have to what's actually on the shelf.",
      whyItMatters: "Shrinkage, miscounts, and data-entry mistakes only surface when you count — and counting regularly keeps your reports trustworthy.",
    },
    walkthrough: {
      screenLabel: "Stock Count screen",
      callouts: [
        { label: "1", title: "Start Stock Count", description: "Loads every product with its current system quantity." },
        { label: "2", title: "Counted Qty field", description: "Type what you actually counted for each product; variance highlights automatically." },
        { label: "3", title: "Confirm Count", description: "Saves the count and adjusts stock to match what you counted." },
      ],
    },
    practice: {
      intro: "Start a count, enter a few quantities, and confirm.",
      steps: [
        { title: "Start a stock count", description: "Load the full product list." },
        { title: "Enter a counted quantity", description: "Try one that differs from the system quantity." },
        { title: "Confirm the count", description: "Save it and adjust stock." },
      ],
    },
    tips: {
      good: [
        { text: "Count in the same order as your shelves, not the same order as the product list." },
        { text: "Investigate any large variance before confirming, not after." },
      ],
      watchOutFor: [
        { text: "Confirming a count without reviewing which items had variances." },
        { text: "Starting a new count before finishing and confirming the current one." },
      ],
    },
    quiz: [
      {
        question: "What does a stock count compare?",
        options: [
          { text: "Counted quantity vs. system quantity", correct: true },
          { text: "This week's sales vs. last week's", correct: false },
          { text: "Cost price vs. selling price", correct: false },
        ],
        explanation: "A count is purely about physical reality vs. what the system has on record.",
      },
      {
        question: "What happens when you confirm a count?",
        options: [
          { text: "Stock is adjusted to match what you counted", correct: true },
          { text: "Nothing changes until a manager approves it separately", correct: false },
          { text: "All variances are deleted", correct: false },
        ],
        explanation: "Confirming immediately updates stock to the counted quantities.",
      },
      {
        question: "Where can you review past counts?",
        options: [
          { text: "Past Stock Counts history", correct: true },
          { text: "The receipt printer", correct: false },
          { text: "Employee settings", correct: false },
        ],
        explanation: "Every confirmed count is saved to a reviewable history.",
      },
    ],
    nextLesson: null,
  },

  // ── Purchasing ────────────────────────────────────────────────
  "pur-1": {
    id: "pur-1",
    sectionId: "purchasing",
    title: "Creating a purchase order",
    minutes: 5,
    badgeId: "po-creator",
    overview: {
      objectives: [
        "Create a draft purchase order for a supplier",
        "Add line items with quantity and cost",
        "Mark a PO as ordered",
      ],
      summary: "A purchase order tracks what you're buying from a supplier, at what cost, before it ever arrives.",
      whyItMatters: "A clear PO is what you check the shipment against when it shows up — and what your supplier gets billed against.",
    },
    walkthrough: {
      screenLabel: "Create Purchase Order",
      callouts: [
        { label: "1", title: "Select supplier", description: "Every PO belongs to one active supplier." },
        { label: "2", title: "Add Item", description: "Pick a product, quantity, and unit cost — repeat for every item on the order." },
        { label: "3", title: "Mark Ordered", description: "Moves the PO from draft to ordered once it's ready to send." },
      ],
    },
    practice: {
      intro: "Create a draft PO and add a couple of items.",
      steps: [
        { title: "Select a supplier and create a draft PO", description: "Starts a new purchase order." },
        { title: "Add an item", description: "Enter quantity and unit cost." },
        { title: "Mark the PO as Ordered", description: "Moves it out of draft." },
      ],
    },
    tips: {
      good: [
        { text: "Double-check unit cost against your supplier's actual invoice before marking ordered." },
        { text: "Use Needs Ordering Today (Inventory) to know what and how much to order." },
      ],
      watchOutFor: [
        { text: "Adding items after marking a PO ordered without double-checking totals." },
        { text: "Creating a new PO when an existing draft for the same supplier could be reused." },
      ],
    },
    quiz: [
      {
        question: "What does creating a PO require at minimum?",
        options: [
          { text: "A selected supplier", correct: true },
          { text: "A finalized invoice", correct: false },
          { text: "A completed shipment", correct: false },
        ],
        explanation: "A draft PO just needs a supplier to get started.",
      },
      {
        question: "Where do you add products to a PO?",
        options: [
          { text: "Inside the PO detail, via Add Item", correct: true },
          { text: "On the Inventory tab", correct: false },
          { text: "At checkout", correct: false },
        ],
        explanation: "Line items are added directly on the open PO's detail view.",
      },
      {
        question: "What does Mark Ordered do?",
        options: [
          { text: "Moves the PO from draft to ordered", correct: true },
          { text: "Deletes the draft", correct: false },
          { text: "Automatically receives the shipment", correct: false },
        ],
        explanation: "Marking ordered is a status change, not a receiving action.",
      },
    ],
    nextLesson: { lessonId: "pur-2", sectionId: "purchasing", title: "Receiving a supplier shipment" },
  },

  "pur-2": {
    id: "pur-2",
    sectionId: "purchasing",
    title: "Receiving a supplier shipment",
    minutes: 6,
    badgeId: "receiving-pro",
    overview: {
      objectives: [
        "Receive a shipment against an ordered PO",
        "Record damaged, expired, or rejected units separately",
        "Know when a PO is fully vs. partially received",
      ],
      summary: "When a shipment arrives, receiving it against the PO updates your stock and closes the loop with your supplier.",
      whyItMatters: "Receiving accurately is what keeps your stock counts and your supplier's invoice both honest.",
    },
    walkthrough: {
      screenLabel: "Receive Shipment screen",
      callouts: [
        { label: "1", title: "Received Qty per line", description: "Enter what actually arrived for each item — it may not match what was ordered." },
        { label: "2", title: "Damaged / Expired / Rejected", description: "Separate fields so bad units don't silently become sellable stock." },
        { label: "3", title: "Confirm Receive", description: "Saves the receipt and updates stock; the PO becomes partially received or received." },
      ],
    },
    practice: {
      intro: "Receive a shipment against an ordered PO.",
      steps: [
        { title: "Open an ordered PO", description: "Start the receiving flow." },
        { title: "Enter received quantity", description: "For each line item." },
        { title: "Confirm the receipt", description: "Updates stock and PO status." },
      ],
    },
    tips: {
      good: [
        { text: "Count the physical shipment before typing anything — don't just copy the ordered quantity." },
        { text: "Log damaged or expired units separately instead of quietly leaving them out." },
      ],
      watchOutFor: [
        { text: "Receiving the full ordered quantity when less actually arrived." },
        { text: "Forgetting a PO stays \"partially received\" until every line is fully accounted for." },
      ],
    },
    quiz: [
      {
        question: "What should you do before entering received quantities?",
        options: [
          { text: "Count the physical shipment", correct: true },
          { text: "Mark the PO received", correct: false },
          { text: "Contact the supplier", correct: false },
        ],
        explanation: "Always count first — the received quantity should reflect reality, not the order.",
      },
      {
        question: "Where do damaged units go on a receipt?",
        options: [
          { text: "A separate Damaged field, not the regular received quantity", correct: true },
          { text: "They're just not counted at all", correct: false },
          { text: "Into the regular received quantity", correct: false },
        ],
        explanation: "Damaged units are tracked separately so they don't become sellable stock by mistake.",
      },
      {
        question: "When does a PO status become \"received\" rather than \"partially received\"?",
        options: [
          { text: "Once every line is fully accounted for", correct: true },
          { text: "As soon as you open the receiving screen", correct: false },
          { text: "After 30 days automatically", correct: false },
        ],
        explanation: "Partial receiving stays open until every line item is fully resolved.",
      },
    ],
    nextLesson: null,
  },

  // ── Customers ─────────────────────────────────────────────────
  "cust-1": {
    id: "cust-1",
    sectionId: "customers",
    title: "Building your customer list",
    minutes: 4,
    badgeId: "customer-builder",
    overview: {
      objectives: [
        "Add a customer with name and phone",
        "Look up a customer at checkout",
        "See a customer's purchase history and visit count",
      ],
      summary: "A customer record is what turns a one-time sale into a relationship — purchase history, visits, and loyalty points all attach to it.",
      whyItMatters: "You can't build repeat business, loyalty rewards, or contact a customer about anything if they were never added.",
    },
    walkthrough: {
      screenLabel: "Customers tab",
      callouts: [
        { label: "1", title: "Add Customer", description: "Name and phone are required; email is optional." },
        { label: "2", title: "Customer row", description: "Shows visit count, total spend, last visit, and points balance at a glance." },
        { label: "3", title: "Lookup at POS", description: "Search by name or phone during checkout to attach a customer to a sale." },
      ],
    },
    practice: {
      intro: "Add a customer, then look them up as if at checkout.",
      steps: [
        { title: "Add a customer", description: "Enter name and phone." },
        { title: "Search for them by phone", description: "Confirm lookup finds them." },
        { title: "Open their profile", description: "See their purchase history." },
      ],
    },
    tips: {
      good: [
        { text: "Get the phone number right the first time — it's the fastest way to look someone up later." },
        { text: "Attach a customer to every sale you can, even small ones — it's what builds their history." },
      ],
      watchOutFor: [
        { text: "Creating duplicate customer records instead of searching first." },
        { text: "Skipping the phone number, which makes lookup much slower." },
      ],
    },
    quiz: [
      {
        question: "What's required to add a customer?",
        options: [
          { text: "Name and phone", correct: true },
          { text: "Name and email", correct: false },
          { text: "Just a name", correct: false },
        ],
        explanation: "Phone is required alongside name; email is optional.",
      },
      {
        question: "How do you attach a customer to a sale at POS?",
        options: [
          { text: "Search by name or phone and select them", correct: true },
          { text: "They must create their own account", correct: false },
          { text: "It happens automatically", correct: false },
        ],
        explanation: "Lookup at checkout is how a customer gets attached to a sale.",
      },
      {
        question: "What does a customer's row show?",
        options: [
          { text: "Visit count, total spend, last visit, and points", correct: true },
          { text: "Only their name", correct: false },
          { text: "Their employee role", correct: false },
        ],
        explanation: "The customer list summarizes activity at a glance.",
      },
    ],
    nextLesson: { lessonId: "cust-2", sectionId: "customers", title: "Loyalty Points at Checkout" },
  },

  "cust-2": {
    id: "cust-2",
    sectionId: "customers",
    title: "Loyalty Points at Checkout",
    minutes: 5,
    badgeId: "loyalty-pro",
    overview: {
      objectives: [
        "Understand how customers earn points automatically",
        "Redeem points at checkout",
        "Read a customer's points history",
      ],
      summary: "Loyalty points aren't something you configure — every sale attached to a customer earns points automatically, and points redeem for a discount at checkout.",
      whyItMatters: "Knowing the real conversion rate means you can explain it to a customer with confidence instead of guessing.",
    },
    walkthrough: {
      screenLabel: "Checkout — loyalty section",
      callouts: [
        { label: "1", title: "Automatic earning", description: "Attaching a customer to a sale earns them points automatically — about 1 point per $1 spent." },
        { label: "2", title: "Redeem Points field", description: "At checkout, enter how many points to redeem — 100 points = $1.00 off." },
        { label: "3", title: "Points History", description: "Every customer's profile shows a full earn/redeem history, tied to specific sales." },
      ],
    },
    practice: {
      intro: "Attach a customer to a sale and redeem some of their points.",
      steps: [
        { title: "Attach a customer to a sale", description: "Look them up at checkout." },
        { title: "Enter a points amount to redeem", description: "Watch the discount calculate." },
        { title: "Confirm the conversion", description: "100 points = $1.00 off." },
      ],
    },
    tips: {
      good: [
        { text: "Tell the customer their points balance before they ask — it's shown right at checkout." },
        { text: "Check Points History if a customer questions their balance." },
      ],
      watchOutFor: [
        { text: "Trying to redeem more points than the customer has available." },
        { text: "Assuming points need to be manually awarded — they're automatic on every sale." },
      ],
    },
    quiz: [
      {
        question: "How are loyalty points normally earned?",
        options: [
          { text: "Automatically, about 1 point per $1 spent", correct: true },
          { text: "A manager must award them manually", correct: false },
          { text: "Only on the customer's birthday", correct: false },
        ],
        explanation: "Points accrue automatically whenever a customer is attached to a sale.",
      },
      {
        question: "What's the redemption rate?",
        options: [
          { text: "100 points = $1.00", correct: true },
          { text: "1 point = $1.00", correct: false },
          { text: "10 points = $1.00", correct: false },
        ],
        explanation: "100 points redeem for exactly one dollar off.",
      },
      {
        question: "Where can you see a customer's points history?",
        options: [
          { text: "Their customer profile", correct: true },
          { text: "The receipt printer", correct: false },
          { text: "Employee settings", correct: false },
        ],
        explanation: "Every earn and redeem transaction is logged on the customer's profile.",
      },
    ],
    nextLesson: null,
  },

  // ── Reports ───────────────────────────────────────────────────
  "rep-1": {
    id: "rep-1",
    sectionId: "reports",
    title: "Reading your daily summary",
    minutes: 5,
    badgeId: "report-reader",
    overview: {
      objectives: [
        "Read the Sales Analytics KPI cards",
        "Compare payment method totals",
        "Switch between Today, 7-day, 30-day, and all-time views",
      ],
      summary: "Sales Analytics on the Reports tab is your at-a-glance view of how the business is doing over any time period.",
      whyItMatters: "Knowing where to look for revenue, transaction count, and payment mix turns raw sales data into a daily habit.",
    },
    walkthrough: {
      screenLabel: "Sales Analytics (Reports tab)",
      callouts: [
        { label: "1", title: "Period selector", description: "Switch between Today, Last 7 Days, Last 30 Days, and All Time." },
        { label: "2", title: "KPI cards", description: "Revenue, Transactions, Average Transaction, Items Sold, Discounts Given, Tax Collected." },
        { label: "3", title: "Payment split", description: "Cash vs. card vs. other, both in dollars and as a percentage of revenue." },
      ],
    },
    practice: {
      intro: "Switch time ranges and read the KPI cards.",
      steps: [
        { title: "View Today's KPI cards", description: "See the current day's numbers." },
        { title: "Switch to Last 7 Days", description: "Compare revenue over the wider range." },
        { title: "Check the payment split", description: "Cash vs. card breakdown." },
      ],
    },
    tips: {
      good: [
        { text: "Check Discounts Given regularly — a rising number is worth understanding why." },
        { text: "Compare Average Transaction over time, not just total revenue, to spot trends." },
      ],
      watchOutFor: [
        { text: "Reading Today's numbers mid-shift and assuming the day is already final." },
        { text: "Ignoring Tax Collected, which you'll need at filing time." },
      ],
    },
    quiz: [
      {
        question: "What does the period selector control?",
        options: [
          { text: "The time range of every KPI card on the screen", correct: true },
          { text: "Only the payment split", correct: false },
          { text: "Nothing — it's just a label", correct: false },
        ],
        explanation: "Changing the period recalculates every card on the page.",
      },
      {
        question: "Which of these is one of the KPI cards?",
        options: [
          { text: "Average Transaction", correct: true },
          { text: "Employee schedule", correct: false },
          { text: "Reorder level", correct: false },
        ],
        explanation: "Average Transaction is one of the six KPI cards shown.",
      },
      {
        question: "What does the payment split show?",
        options: [
          { text: "Cash vs. card vs. other, in dollars and percentage", correct: true },
          { text: "Only cash transactions", correct: false },
          { text: "Only card transactions", correct: false },
        ],
        explanation: "The payment split covers every tender type side by side.",
      },
    ],
    nextLesson: { lessonId: "rep-2", sectionId: "reports", title: "Reviewing Inventory Reports" },
  },

  "rep-2": {
    id: "rep-2",
    sectionId: "reports",
    title: "Reviewing Inventory Reports",
    minutes: 4,
    badgeId: "inventory-analyst",
    overview: {
      objectives: [
        "Read the Inventory Valuation report",
        "Check the Low Stock and Purchase Order reports",
        "Review return history from Reports",
      ],
      summary: "Below Sales Analytics, the Reports tab breaks down inventory value, low stock, purchase orders, and returns.",
      whyItMatters: "Inventory Valuation in particular is a number your accountant will ask for — it's the dollar value of everything sitting on your shelves.",
    },
    walkthrough: {
      screenLabel: "Inventory Reports (Reports tab)",
      callouts: [
        { label: "1", title: "Inventory Valuation", description: "Every product's stock × average cost, with a grand total at the bottom." },
        { label: "2", title: "Low Stock Report", description: "The same low-stock list from Inventory, viewable here as a report." },
        { label: "3", title: "PO Report & Return History", description: "Purchase order activity and past returns, both reviewable without leaving Reports." },
      ],
    },
    practice: {
      intro: "Open each inventory report and find the total value.",
      steps: [
        { title: "Open Inventory Valuation", description: "Find the grand total." },
        { title: "Check the Low Stock Report", description: "See which items need attention." },
        { title: "Open Return History", description: "Review returns for the period." },
      ],
    },
    tips: {
      good: [
        { text: "Share the Inventory Valuation total with your accountant at period close — it's exactly what they need." },
        { text: "Review Return History periodically to spot a product with an unusually high return rate." },
      ],
      watchOutFor: [
        { text: "Confusing Inventory Valuation (cost basis) with the retail value of your stock." },
        { text: "Skipping these reports because they're collapsed by default — they're one click away." },
      ],
    },
    quiz: [
      {
        question: "What does Inventory Valuation calculate?",
        options: [
          { text: "Stock on hand × average cost, per product", correct: true },
          { text: "Selling price × stock on hand", correct: false },
          { text: "Total sales for the period", correct: false },
        ],
        explanation: "Valuation uses cost, not selling price — it's a books/accounting figure.",
      },
      {
        question: "Why would an accountant want the Inventory Valuation total?",
        options: [
          { text: "It's the dollar value of stock on the books", correct: true },
          { text: "It shows employee hours", correct: false },
          { text: "It shows customer loyalty points", correct: false },
        ],
        explanation: "Inventory valuation is a standard figure accountants need for the books.",
      },
      {
        question: "Where do you review past returns from Reports?",
        options: [
          { text: "Return History", correct: true },
          { text: "The POS screen", correct: false },
          { text: "Employee settings", correct: false },
        ],
        explanation: "Return History under Inventory Reports covers past returns.",
      },
    ],
    nextLesson: null,
  },

  // ── Employees ─────────────────────────────────────────────────
  "emp-1": {
    id: "emp-1",
    sectionId: "employees",
    title: "Adding staff and setting roles",
    minutes: 5,
    badgeId: "staff-builder",
    overview: {
      objectives: [
        "Add a new employee with a PIN",
        "Choose the right role for the job",
        "Reset an employee's PIN",
      ],
      summary: "Every staff member gets a name, an Employee ID, a PIN, and a role — that combination is how they sign in and what they can access.",
      whyItMatters: "The role you pick controls exactly what that person can see and do in WEGN Store.",
    },
    walkthrough: {
      screenLabel: "Staff tab",
      callouts: [
        { label: "1", title: "Employee name & ID", description: "The Employee ID is used alongside the PIN to sign in." },
        { label: "2", title: "PIN (4–6 digits)", description: "Set at creation; can be reset later if forgotten." },
        { label: "3", title: "Role select", description: "Cashier, Manager, or Inventory Clerk — each sees a different set of tabs." },
      ],
    },
    practice: {
      intro: "Add an employee and reset their PIN.",
      steps: [
        { title: "Add an employee", description: "Enter name, ID, and PIN." },
        { title: "Choose a role", description: "Pick Cashier, Manager, or Inventory Clerk." },
        { title: "Reset their PIN", description: "Practice the reset flow." },
      ],
    },
    tips: {
      good: [
        { text: "Pick the role based on the job, not on trust — it's about which screens they need, not how much you trust them." },
        { text: "Write down the Employee ID somewhere the employee can find it — they'll need it every shift." },
      ],
      watchOutFor: [
        { text: "Giving everyone Manager access by default." },
        { text: "Reusing the same PIN across multiple employees." },
      ],
    },
    quiz: [
      {
        question: "What's required to add an employee?",
        options: [
          { text: "Name, Employee ID, and PIN", correct: true },
          { text: "Just a name", correct: false },
          { text: "An email address", correct: false },
        ],
        explanation: "All three fields are required to create a working staff login.",
      },
      {
        question: "What determines what an employee can access?",
        options: [
          { text: "Their assigned role", correct: true },
          { text: "How long they've worked there", correct: false },
          { text: "Their PIN length", correct: false },
        ],
        explanation: "Role, not tenure or PIN, controls tab access.",
      },
      {
        question: "Can an employee's PIN be changed later?",
        options: [
          { text: "Yes, it can be reset", correct: true },
          { text: "No, it's permanent", correct: false },
          { text: "Only by the employee themselves", correct: false },
        ],
        explanation: "PINs can be reset any time from the Staff tab.",
      },
    ],
    nextLesson: { lessonId: "emp-2", sectionId: "employees", title: "Understanding Staff Roles & Permissions" },
  },

  "emp-2": {
    id: "emp-2",
    sectionId: "employees",
    title: "Understanding Staff Roles & Permissions",
    minutes: 4,
    badgeId: "role-expert",
    overview: {
      objectives: [
        "Know what a Cashier can access",
        "Know what a Manager can access",
        "Know what an Inventory Clerk can access",
      ],
      summary: "The three assignable roles each unlock a different set of tabs — matching access to the job keeps the register, the books, and the stockroom all appropriately guarded.",
      whyItMatters: "Assigning the wrong role either blocks someone from doing their job or hands them access they don't need.",
    },
    walkthrough: {
      screenLabel: "Role access comparison",
      callouts: [
        { label: "1", title: "Cashier", description: "Dashboard, POS, and Customers — everything needed to run the register." },
        { label: "2", title: "Manager", description: "Everything a Cashier has, plus Inventory, Purchasing, Cash Drawer, and Reports." },
        { label: "3", title: "Inventory Clerk", description: "Inventory and Purchasing only — no register, no customer data." },
      ],
    },
    practice: {
      intro: "Match each role to what it can access.",
      steps: [
        { title: "Review Cashier access", description: "Dashboard, POS, Customers." },
        { title: "Review Manager access", description: "Everything a Cashier has, plus more." },
        { title: "Review Inventory Clerk access", description: "Inventory and Purchasing only." },
      ],
    },
    tips: {
      good: [
        { text: "When in doubt, start someone as a Cashier and upgrade their role later if the job grows." },
        { text: "Only the account Owner can access Employees and Settings — no assignable role includes them." },
      ],
      watchOutFor: [
        { text: "Assuming Manager includes Employees or Settings access — it doesn't." },
        { text: "Giving an Inventory Clerk POS access they don't have a role for." },
      ],
    },
    quiz: [
      {
        question: "Which role can access the POS?",
        options: [
          { text: "Cashier and Manager", correct: true },
          { text: "Only Manager", correct: false },
          { text: "Only Inventory Clerk", correct: false },
        ],
        explanation: "Both Cashier and Manager roles include POS access.",
      },
      {
        question: "Can a Manager access Employees or Settings?",
        options: [
          { text: "No — only the account Owner can", correct: true },
          { text: "Yes, Managers have full access", correct: false },
          { text: "Only Settings, not Employees", correct: false },
        ],
        explanation: "Employees and Settings are Owner-only, not included in any assignable role.",
      },
      {
        question: "What can an Inventory Clerk access?",
        options: [
          { text: "Inventory and Purchasing only", correct: true },
          { text: "Everything except Settings", correct: false },
          { text: "Only the Dashboard", correct: false },
        ],
        explanation: "Inventory Clerk is scoped tightly to stock and purchasing.",
      },
    ],
    nextLesson: null,
  },

  // ── Troubleshooting ───────────────────────────────────────────
  "ts-1": {
    id: "ts-1",
    sectionId: "troubleshooting",
    title: "Fixing a stuck receipt printer",
    minutes: 3,
    badgeId: "printer-fixer",
    overview: {
      objectives: [
        "Know what's app-side vs. hardware when a receipt won't print",
        "Reprint a receipt after a printer issue",
        "Use email as a fallback",
      ],
      summary: "Printing in WEGN Store sends the receipt to your browser's print dialog — a stuck printer is a hardware problem, but recovering the receipt is always possible from the app.",
      whyItMatters: "A jammed or offline printer shouldn't mean a lost receipt or a stuck checkout.",
    },
    walkthrough: {
      screenLabel: "Sales History — reprint",
      callouts: [
        { label: "1", title: "Physical printer issue", description: "Paper jams, empty paper, and offline printers are fixed at the printer itself, not in the app." },
        { label: "2", title: "Reprint from Sales History", description: "Once the printer's working again, find the sale and print it — nothing was lost." },
        { label: "3", title: "Email as a fallback", description: "Send the receipt by email instead, right now, no printer required." },
      ],
    },
    practice: {
      intro: "Find a completed sale and try both recovery options.",
      steps: [
        { title: "Find a completed sale", description: "Locate it in Sales History." },
        { title: "Reprint its receipt", description: "Send it to the printer again." },
        { title: "Email the receipt instead", description: "Use the fallback option." },
      ],
    },
    tips: {
      good: [
        { text: "Keep a habit of checking paper level at the start of a shift, before the line forms." },
        { text: "Offer to email the receipt immediately rather than making a customer wait on a printer fix." },
      ],
      watchOutFor: [
        { text: "Re-ringing the sale because the receipt didn't print — the sale already went through." },
        { text: "Forgetting a receipt can be reprinted any time later from Sales History." },
      ],
    },
    quiz: [
      {
        question: "Is a paper jam fixed in the app or at the printer?",
        options: [
          { text: "At the printer — it's a hardware issue", correct: true },
          { text: "In Settings", correct: false },
          { text: "By voiding the sale", correct: false },
        ],
        explanation: "The app can't reach into physical hardware — jams are fixed at the printer.",
      },
      {
        question: "If the printer is down, what can you do instead?",
        options: [
          { text: "Email the receipt", correct: true },
          { text: "Cancel the sale", correct: false },
          { text: "Nothing until it's fixed", correct: false },
        ],
        explanation: "Email is a real, immediate fallback that doesn't depend on the printer.",
      },
      {
        question: "Do you need to re-ring a sale if the receipt didn't print?",
        options: [
          { text: "No — reprint it once the printer works, or email it", correct: true },
          { text: "Yes, always start over", correct: false },
          { text: "Only if the customer complains", correct: false },
        ],
        explanation: "The sale already completed; only the receipt needs recovering.",
      },
    ],
    nextLesson: { lessonId: "ts-2", sectionId: "troubleshooting", title: "What to do when the register won't scan" },
  },

  "ts-2": {
    id: "ts-2",
    sectionId: "troubleshooting",
    title: "What to do when the register won't scan",
    minutes: 3,
    badgeId: "scan-troubleshooter",
    overview: {
      objectives: [
        "Tell a scanner problem from a catalog problem",
        "Resolve an unmatched barcode at checkout",
        "Choose between linking and creating a product",
      ],
      summary: "Most \"the scanner won't work\" moments are actually the scanner working fine on a barcode that isn't in the catalog yet.",
      whyItMatters: "Knowing the difference means you fix it in seconds instead of assuming the hardware is broken.",
    },
    walkthrough: {
      screenLabel: "POS — unmatched barcode banner",
      callouts: [
        { label: "1", title: "\"Scanner worked\" banner", description: "WEGN Store tells you directly when the scan succeeded but the barcode isn't linked to a product." },
        { label: "2", title: "Add New Product", description: "Jumps to Inventory with the barcode pre-filled, ready to create the product." },
        { label: "3", title: "Link to Existing Product", description: "Attach the scanned barcode to a product that already exists under a different code." },
      ],
    },
    practice: {
      intro: "Trigger the unmatched-barcode flow and resolve it both ways.",
      steps: [
        { title: "Scan an unrecognized barcode", description: "See the banner appear." },
        { title: "Try Link to Existing Product", description: "Attach it to a known product." },
        { title: "Try Add New Product instead", description: "Create a new product from the barcode." },
      ],
    },
    tips: {
      good: [
        { text: "Read the banner text — it already tells you the scanner worked, so don't waste time re-scanning." },
        { text: "Use Link to Existing Product when you know the item is already in the catalog under a different barcode." },
      ],
      watchOutFor: [
        { text: "Assuming the scanner is broken when the real issue is an unlinked barcode." },
        { text: "Creating a duplicate product instead of linking to the one that already exists." },
      ],
    },
    quiz: [
      {
        question: "What does \"Scanner worked. Barcode not found\" tell you?",
        options: [
          { text: "The scanner read fine; the barcode isn't linked to a product yet", correct: true },
          { text: "The scanner is broken", correct: false },
          { text: "The product is out of stock", correct: false },
        ],
        explanation: "The message is specifically distinguishing a hardware success from a catalog gap.",
      },
      {
        question: "What does Add New Product do from this banner?",
        options: [
          { text: "Jumps to Inventory with the barcode pre-filled", correct: true },
          { text: "Deletes the barcode", correct: false },
          { text: "Voids the sale", correct: false },
        ],
        explanation: "It's a shortcut straight into product creation with the barcode already filled in.",
      },
      {
        question: "When should you use Link to Existing Product instead?",
        options: [
          { text: "When the item already exists in the catalog under a different barcode", correct: true },
          { text: "Every time, always", correct: false },
          { text: "Never — it's only for new items", correct: false },
        ],
        explanation: "Linking avoids creating a duplicate when the product is already there.",
      },
    ],
    nextLesson: null,
  },
};
