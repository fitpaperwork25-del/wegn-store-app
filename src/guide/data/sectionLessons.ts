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
    nextLesson: { lessonId: "do-3", sectionId: "daily-operations", title: "Understanding Your Dashboard" },
  },

  "do-3": {
    id: "do-3",
    sectionId: "daily-operations",
    title: "Understanding Your Dashboard",
    minutes: 4,
    badgeId: "dashboard-reader",
    overview: {
      objectives: [
        "Know what a Cashier's Dashboard shows vs. an Owner/Manager's",
        "Use the four Today's Priorities action cards",
        "Tell Dashboard's live snapshot apart from Reports' historical detail",
      ],
      summary: "The Dashboard is the tab everyone lands on — but a Cashier and an Owner/Manager see genuinely different screens built for their job.",
      whyItMatters: "Dashboard is a navigation hub, not just a KPI display — knowing its shortcuts saves a trip through the full menu.",
    },
    walkthrough: {
      screenLabel: "Dashboard tab",
      callouts: [
        { label: "1", title: "Cashier view", description: "Quick Actions to POS and Customers, a My Drawer status card, and a My Recent Sales table — scoped to that cashier only." },
        { label: "2", title: "Owner/Manager: Today's Priorities", description: "Four action cards — Buy Today, Receive Today, Inventory Alerts, Yesterday's Summary — each with a button straight into Reorder Center, Purchasing, Inventory, or the EOD Report." },
        { label: "3", title: "Live snapshot, not history", description: "Revenue Today and Cash Drawer status are today-only, lighter-weight numbers — Reports and the Cash Drawer tab hold the full historical and reconciliation detail." },
      ],
    },
    practice: {
      intro: "Find each of the four priority cards and know where its button goes.",
      steps: [
        { title: "Find the Buy Today card", description: "Note its button goes to the Reorder Center." },
        { title: "Find the Yesterday's Summary card", description: "See it's a separate figure from today's revenue." },
        { title: "Compare to Reports", description: "Notice Dashboard is a snapshot; Reports is the historical drill-down." },
      ],
    },
    tips: {
      good: [
        { text: "Use the priority-card buttons as shortcuts instead of navigating the full menu each time." },
        { text: "Check Yesterday's Summary first thing — it's a distinct figure from Revenue Today." },
      ],
      watchOutFor: [
        { text: "Expecting a Cashier's Dashboard to show revenue or profit — it's scoped to their own sales and shift only." },
        { text: "Treating Dashboard's live numbers as the final historical record — Reports and Cash Drawer hold the full detail." },
      ],
    },
    quiz: [
      {
        question: "What does a Cashier's Dashboard show that an Owner's doesn't include?",
        options: [
          { text: "Nothing extra — it's a reduced view with no revenue/EOD figures at all", correct: true },
          { text: "The full Profit Report", correct: false },
          { text: "Every employee's sales", correct: false },
        ],
        explanation: "Cashier Dashboard is scoped to their own shift — Quick Actions and My Recent Sales, no financial KPIs.",
      },
      {
        question: "Where does the \"Buy Today\" card's button take you?",
        options: [
          { text: "The Reorder Center", correct: true },
          { text: "The Employees tab", correct: false },
          { text: "Settings", correct: false },
        ],
        explanation: "Buy Today is a low-stock shortcut straight into reordering.",
      },
      {
        question: "Is Dashboard's \"Revenue Today\" the same detail level as Reports?",
        options: [
          { text: "No — Dashboard is a lighter live snapshot; Reports has the full historical breakdown", correct: true },
          { text: "Yes, they're identical", correct: false },
          { text: "Dashboard has more detail than Reports", correct: false },
        ],
        explanation: "Dashboard is built for a glance and quick action, not deep analysis.",
      },
    ],
    nextLesson: { lessonId: "do-4", sectionId: "daily-operations", title: "Cash Drawer Reports & Paid Outs" },
  },

  "do-4": {
    id: "do-4",
    sectionId: "daily-operations",
    title: "Cash Drawer Reports & Paid Outs",
    minutes: 4,
    badgeId: "drawer-reporter",
    overview: {
      objectives: [
        "Record a paid out during an open drawer session",
        "Read the End-of-Day Summary",
        "Tell a session's live reconciliation apart from the calendar-day EOD figures",
      ],
      summary: "Beyond opening and closing, the Cash Drawer tab tracks paid outs during a shift and gives a full End-of-Day Summary independent of whether the drawer is still open.",
      whyItMatters: "A shift that spans midnight, or a safe drop mid-shift, needs a place to record it — this is that place.",
    },
    walkthrough: {
      screenLabel: "Cash Drawer tab",
      callouts: [
        { label: "1", title: "Record Paid Out", description: "Log an amount and a reason (e.g. a safe drop) against the open session — it reduces Expected Cash immediately." },
        { label: "2", title: "End-of-Day Summary toggle", description: "Shows Sales, Payment & Loyalty, and Drawer Reconciliation cards for the day — available whether or not a drawer is currently open." },
        { label: "3", title: "Session vs. calendar day", description: "Drawer Reconciliation figures are labeled Open or Closed and may differ from the live cards above if the current session started on a different calendar day." },
      ],
    },
    practice: {
      intro: "Record a paid out, then open the End-of-Day Summary.",
      steps: [
        { title: "Record a paid out", description: "Enter an amount and a reason." },
        { title: "Check Expected Cash updated", description: "Confirm it reflects the paid out." },
        { title: "Open End-of-Day Summary", description: "Review the Sales, Payment, and Reconciliation cards." },
      ],
    },
    tips: {
      good: [
        { text: "Always enter a real reason for a paid out — 'safe drop' or the actual purpose, not a placeholder." },
        { text: "Check the End-of-Day Summary even on a day the drawer never closed — it's available independently." },
      ],
      watchOutFor: [
        { text: "Confusing the live Drawer Reconciliation figures with the calendar-day EOD figures when a shift spans midnight." },
        { text: "Forgetting a paid out reduces Expected Cash — an unrecorded one will show up as a mystery variance later." },
      ],
    },
    quiz: [
      {
        question: "What does recording a paid out do?",
        options: [
          { text: "Reduces Expected Cash for the session immediately", correct: true },
          { text: "Nothing until the drawer closes", correct: false },
          { text: "Voids the day's sales", correct: false },
        ],
        explanation: "A paid out is reflected in Expected Cash right away, not just at close-out.",
      },
      {
        question: "Can you view the End-of-Day Summary if the drawer is currently closed?",
        options: [
          { text: "Yes — it's independent of whether a session is open", correct: true },
          { text: "No, only while a drawer session is open", correct: false },
          { text: "Only a manager can ever view it", correct: false },
        ],
        explanation: "The EOD Summary toggle works regardless of drawer-session state.",
      },
      {
        question: "Why might live Drawer Reconciliation differ from the calendar-day EOD figures?",
        options: [
          { text: "Because the current session may have started on a different day than \"today\"", correct: true },
          { text: "They never differ", correct: false },
          { text: "Because Reconciliation only counts card sales", correct: false },
        ],
        explanation: "A session-scoped figure and a calendar-day figure can diverge when a shift spans midnight.",
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
    nextLesson: { lessonId: "inv-4", sectionId: "inventory", title: "Editing, Deactivating, and Organizing Products" },
  },

  "inv-4": {
    id: "inv-4",
    sectionId: "inventory",
    title: "Editing, Deactivating, and Organizing Products",
    minutes: 5,
    badgeId: "catalog-curator",
    overview: {
      objectives: [
        "Edit an existing product's price, reorder level, and category",
        "Deactivate a product so it stops appearing at checkout",
        "Manage categories, including why some can't be deleted",
      ],
      summary: "Once a product exists, the Catalog table is where you fix its details, retire it, and keep categories organized.",
      whyItMatters: "A wrong price or a product that should no longer sell needs a real fix, not a workaround — and categories have rules that block mistakes before they happen.",
    },
    walkthrough: {
      screenLabel: "Products & Stock table (Inventory tab)",
      callouts: [
        { label: "1", title: "Edit (··· menu)", description: "Change name, price, reorder level, category, or margin settings. Cost price and initial stock aren't editable here — only at creation or via receiving." },
        { label: "2", title: "Deactivate", description: "Removes the product from POS entirely — asks for confirmation first. There's no hard delete for products." },
        { label: "3", title: "Categories", description: "Add, edit, or deactivate a category — but you can't delete or deactivate one that still has products assigned to it." },
      ],
    },
    practice: {
      intro: "Edit a product, then try to deactivate a category that's still in use.",
      steps: [
        { title: "Edit a product's price", description: "Open Edit and change the selling price." },
        { title: "Deactivate a product", description: "Confirm it disappears from POS." },
        { title: "Try deactivating a category with products in it", description: "See it get blocked." },
      ],
    },
    tips: {
      good: [
        { text: "Deactivate instead of trying to delete a discontinued product — there's no delete option by design." },
        { text: "Reassign products to a different category before trying to retire the old one." },
      ],
      watchOutFor: [
        { text: "Expecting to edit cost price or initial stock from the Edit form — those aren't editable there." },
        { text: "Assuming a category can be deleted while products still reference it." },
      ],
    },
    quiz: [
      {
        question: "What happens when you deactivate a product?",
        options: [
          { text: "It stops appearing in POS", correct: true },
          { text: "It's permanently deleted", correct: false },
          { text: "Its stock is reset to zero", correct: false },
        ],
        explanation: "Deactivation is a status flag, not a delete — the product record stays intact.",
      },
      {
        question: "Can you edit a product's cost price from the Edit Product form?",
        options: [
          { text: "No — cost is set at creation or updated via receiving", correct: true },
          { text: "Yes, freely", correct: false },
          { text: "Only the Owner can", correct: false },
        ],
        explanation: "The Edit form covers price, reorder level, and category — not cost price or initial stock.",
      },
      {
        question: "Why might deactivating a category be blocked?",
        options: [
          { text: "Because products are still assigned to it", correct: true },
          { text: "Categories can never be deactivated", correct: false },
          { text: "Only the category name can change", correct: false },
        ],
        explanation: "A category with assigned products can't be deactivated or deleted until they're reassigned.",
      },
    ],
    nextLesson: { lessonId: "inv-5", sectionId: "inventory", title: "Printing Barcode Labels" },
  },

  "inv-5": {
    id: "inv-5",
    sectionId: "inventory",
    title: "Printing Barcode Labels",
    minutes: 3,
    badgeId: "label-printer",
    overview: {
      objectives: [
        "Print a barcode label for a product",
        "Know what's on the label",
        "Understand that barcode lookup only checks your own catalog",
      ],
      summary: "Any product with a barcode can get a printed label — straight from the browser's print dialog, one at a time.",
      whyItMatters: "A mislabeled shelf or a missing barcode label slows down every future scan of that product.",
    },
    walkthrough: {
      screenLabel: "Products & Stock table — Print Barcode",
      callouts: [
        { label: "1", title: "Print Barcode (··· menu)", description: "Disabled if the product has no barcode. Opens a preview with the barcode, product name, price, and SKU." },
        { label: "2", title: "One label at a time", description: "This prints a single product's label per run — there's no bulk/batch label printing." },
        { label: "3", title: "Not an external lookup", description: "Scanning or typing a barcode on Add Product only checks your own catalog for a match — it doesn't pull data from a manufacturer database." },
      ],
    },
    practice: {
      intro: "Print a label for a product that has a barcode.",
      steps: [
        { title: "Open the ··· menu on a product with a barcode", description: "Find Print Barcode." },
        { title: "Preview the label", description: "Check the name, price, and SKU shown." },
        { title: "Print it", description: "Send it to the browser's print dialog." },
      ],
    },
    tips: {
      good: [
        { text: "If a product has no barcode yet, WEGN Store will auto-generate an internal one when you leave the barcode field blank at creation." },
        { text: "Reprint a label any time the price changes — the old sticker will show the wrong price." },
      ],
      watchOutFor: [
        { text: "Expecting to print labels for multiple products in one run — it's one at a time." },
        { text: "Assuming a scanned barcode will auto-fill details from an outside product database — it only matches products already in your catalog." },
      ],
    },
    quiz: [
      {
        question: "What's on a printed barcode label?",
        options: [
          { text: "Product name, barcode, price, and SKU", correct: true },
          { text: "Just the barcode", correct: false },
          { text: "Supplier name and cost", correct: false },
        ],
        explanation: "The label includes enough to identify and price the product at a glance.",
      },
      {
        question: "Can you print labels for several products in one batch?",
        options: [
          { text: "No — it's one product's label per print run", correct: true },
          { text: "Yes, select as many as you want", correct: false },
          { text: "Only for products in the same category", correct: false },
        ],
        explanation: "Barcode label printing is a single-product action from the row menu.",
      },
      {
        question: "Does scanning a barcode on Add Product pull data from an external database?",
        options: [
          { text: "No — it only checks whether that barcode already exists in your own catalog", correct: true },
          { text: "Yes, it looks up a national product database", correct: false },
          { text: "It always creates a brand-new product automatically", correct: false },
        ],
        explanation: "Auto-fill only works for barcodes your business has already used — there's no external lookup.",
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
    nextLesson: { lessonId: "pur-3", sectionId: "purchasing", title: "Managing Suppliers" },
  },

  "pur-3": {
    id: "pur-3",
    sectionId: "purchasing",
    title: "Managing Suppliers",
    minutes: 5,
    badgeId: "supplier-manager",
    overview: {
      objectives: [
        "Add, edit, and deactivate a supplier",
        "Know when a supplier can and can't be deleted",
        "Read a supplier's Performance metrics",
      ],
      summary: "Every PO belongs to a supplier record — this lesson covers keeping that list accurate, not just creating POs against it.",
      whyItMatters: "A supplier you can't delete, or one deactivated by mistake, both have real consequences for ordering.",
    },
    walkthrough: {
      screenLabel: "Suppliers panel",
      callouts: [
        { label: "1", title: "Add / Edit Supplier", description: "Name is required; contact person, phone, email, and notes are optional." },
        { label: "2", title: "Deactivate vs. Delete", description: "Deactivating hides a supplier from PO creation. Delete is hard and permanent — but blocked entirely if the supplier has any PO on record, even a cancelled one." },
        { label: "3", title: "Performance badge", description: "Good / Attention / No Activity, based on the share of that supplier's POs that were actually received." },
      ],
    },
    practice: {
      intro: "Add a supplier, then check why an active supplier can't be deleted.",
      steps: [
        { title: "Add a supplier", description: "Enter a name and contact info." },
        { title: "Try to delete a supplier with existing POs", description: "See it get blocked." },
        { title: "Deactivate the supplier instead", description: "Confirm it drops out of the PO creation list." },
      ],
    },
    tips: {
      good: [
        { text: "Deactivate a supplier you've stopped using instead of trying to delete it — deletion is blocked once any PO exists." },
        { text: "Check the Performance badge before assigning a low-stock item to a supplier with a history of not delivering." },
      ],
      watchOutFor: [
        { text: "Trying to delete a supplier that has any PO on record, even a cancelled one — it will be blocked." },
        { text: "Deactivating a supplier that's still assigned to open purchase orders." },
      ],
    },
    quiz: [
      {
        question: "What's required to add a supplier?",
        options: [
          { text: "Just a name", correct: true },
          { text: "Name, phone, and email all required", correct: false },
          { text: "A signed contract on file", correct: false },
        ],
        explanation: "Only the name field is required — contact details and notes are optional.",
      },
      {
        question: "When is deleting a supplier blocked?",
        options: [
          { text: "If the supplier has any purchase order on record, even a cancelled one", correct: true },
          { text: "It's never blocked", correct: false },
          { text: "Only if they have an open PO right now", correct: false },
        ],
        explanation: "Any PO history at all — including cancelled POs — blocks a hard delete.",
      },
      {
        question: "What does a supplier's Performance badge reflect?",
        options: [
          { text: "The share of their POs that were actually received", correct: true },
          { text: "How long they've been a supplier", correct: false },
          { text: "Their outstanding invoice balance", correct: false },
        ],
        explanation: "Performance is calculated from received-vs-total PO history.",
      },
    ],
    nextLesson: { lessonId: "pur-4", sectionId: "purchasing", title: "Canceling, Printing, and Signing POs; Supplier Statements" },
  },

  "pur-4": {
    id: "pur-4",
    sectionId: "purchasing",
    title: "Canceling, Printing, and Signing POs; Supplier Statements",
    minutes: 6,
    badgeId: "po-lifecycle-pro",
    overview: {
      objectives: [
        "Cancel or delete a PO, and know when each is allowed",
        "Print, email, and sign a purchase order",
        "Record a supplier payment from a Supplier Statement",
      ],
      summary: "Beyond create-and-receive, a PO can be cancelled, deleted, printed, emailed, and signed — and every supplier has a running statement of what they're owed.",
      whyItMatters: "Knowing exactly what Cancel, Delete, and Email PO actually do (and don't do) prevents a surprise later.",
    },
    walkthrough: {
      screenLabel: "PO detail — more actions",
      callouts: [
        { label: "1", title: "Cancel vs. Delete", description: "Cancel works on draft or ordered POs only — once anything has been received, it can't be cancelled. Delete is a hard remove, draft-only." },
        { label: "2", title: "Email PO", description: "Downloads a PDF and opens a pre-filled email — it does not actually attach or send the file for you; you attach the just-downloaded PDF yourself." },
        { label: "3", title: "Supplier Statement", description: "Shows Total Invoiced, Total Paid, and Outstanding per supplier, with a Record Payment form for PO-linked invoices." },
      ],
    },
    practice: {
      intro: "Try cancelling a draft PO, then open a supplier's statement.",
      steps: [
        { title: "Cancel a draft PO", description: "Confirm the status changes to Cancelled." },
        { title: "Open a supplier's Statement", description: "Check Total Invoiced vs. Outstanding." },
        { title: "Record a payment", description: "Apply it against an invoice and watch Outstanding drop." },
      ],
    },
    tips: {
      good: [
        { text: "Print or sign a PO before sending it to a supplier who expects a paper trail." },
        { text: "Check the Statement's Outstanding total before assuming a supplier invoice is fully paid." },
      ],
      watchOutFor: [
        { text: "Assuming Email PO actually sends the file — you still have to attach the downloaded PDF yourself." },
        { text: "Trying to cancel a PO that's already partially received — it's blocked once inventory has moved." },
      ],
    },
    quiz: [
      {
        question: "Can you cancel a partially received PO?",
        options: [
          { text: "No — cancellation only works on draft or ordered POs", correct: true },
          { text: "Yes, any time", correct: false },
          { text: "Only the Owner can", correct: false },
        ],
        explanation: "Once inventory has moved from a receive, the PO can no longer be cancelled.",
      },
      {
        question: "What does \"Email PO\" actually do?",
        options: [
          { text: "Downloads a PDF and opens a pre-filled email — you attach the file yourself", correct: true },
          { text: "Sends the PO automatically with the PDF attached", correct: false },
          { text: "Faxes the supplier directly", correct: false },
        ],
        explanation: "It's a shortcut to drafting the email, not a full send-with-attachment.",
      },
      {
        question: "What does a Supplier Statement's Outstanding figure show?",
        options: [
          { text: "What's still owed to that supplier across their invoices", correct: true },
          { text: "The supplier's total lifetime revenue with you", correct: false },
          { text: "The number of open POs", correct: false },
        ],
        explanation: "Outstanding is Total Invoiced minus Total Paid.",
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
        "Understand how customers earn points automatically — and when they don't",
        "Redeem points at checkout",
        "Read a customer's points history",
      ],
      summary: "Loyalty points aren't something you configure — a sale attached to a customer earns points automatically, at about 1 point per $1 of the discounted, pre-tax subtotal. Points redeem for a discount at checkout at a fixed rate.",
      whyItMatters: "Knowing the real conversion rate — and the one big exception — means you can explain it to a customer with confidence instead of guessing.",
    },
    walkthrough: {
      screenLabel: "Checkout — loyalty section",
      callouts: [
        { label: "1", title: "Automatic earning", description: "Attaching a customer to a sale earns them points automatically — about 1 point per $1 of the discounted, pre-tax subtotal." },
        { label: "2", title: "Earn OR redeem, not both", description: "If any points are redeemed on a sale, that same sale earns zero points — earning and redeeming don't stack on one transaction." },
        { label: "3", title: "Redeem Points field", description: "At checkout, enter how many points to redeem — 100 points = $1.00 off, capped at the customer's balance." },
      ],
    },
    practice: {
      intro: "Attach a customer to a sale, then see earning and redemption in action.",
      steps: [
        { title: "Attach a customer to a sale", description: "Look them up at checkout." },
        { title: "Complete a sale with no points redeemed", description: "Confirm points were earned on it." },
        { title: "Redeem points on a different sale", description: "Confirm that sale earns zero new points." },
      ],
    },
    tips: {
      good: [
        { text: "Tell the customer their points balance before they ask — it's shown right at checkout." },
        { text: "Check Points History if a customer questions their balance." },
      ],
      watchOutFor: [
        { text: "Trying to redeem more points than the customer has available — checkout blocks it." },
        { text: "Assuming a sale earns points even when the customer redeemed points on it — it doesn't; earning and redeeming are mutually exclusive per sale." },
      ],
    },
    quiz: [
      {
        question: "How are loyalty points normally earned?",
        options: [
          { text: "Automatically, about 1 point per $1 of the discounted, pre-tax subtotal", correct: true },
          { text: "A manager must award them manually", correct: false },
          { text: "Only on the customer's birthday", correct: false },
        ],
        explanation: "Points accrue automatically whenever a customer is attached to a sale — as long as the sale doesn't also redeem points.",
      },
      {
        question: "What happens to points earned on a sale where the customer also redeems points?",
        options: [
          { text: "That sale earns zero new points", correct: true },
          { text: "It earns points as normal, on top of the redemption", correct: false },
          { text: "The redemption is cancelled instead", correct: false },
        ],
        explanation: "Earning and redeeming are mutually exclusive on a single sale — redeeming any points means that sale earns none.",
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
    ],
    nextLesson: { lessonId: "cust-3", sectionId: "customers", title: "Editing and Deactivating Customers" },
  },

  "cust-3": {
    id: "cust-3",
    sectionId: "customers",
    title: "Editing and Deactivating Customers",
    minutes: 4,
    badgeId: "customer-caretaker",
    overview: {
      objectives: [
        "Edit a customer's name, phone, or email",
        "Deactivate a customer and know what that does at POS",
        "Know what happens to points when a sale is voided or returned",
      ],
      summary: "Beyond adding a customer, Owners and Managers can edit their details or deactivate them — and loyalty points have real, sometimes permanent, consequences on void and return.",
      whyItMatters: "A deactivated customer disappears from checkout lookup entirely, and redeemed points are never restored on a return — both are easy to get wrong once.",
    },
    walkthrough: {
      screenLabel: "Customers tab — row actions",
      callouts: [
        { label: "1", title: "Edit (Owner/Manager only)", description: "Update name, phone, or email — Cashiers can add a customer but can't edit one." },
        { label: "2", title: "Deactivate", description: "Removes the customer from POS lookup and, if they're attached to the sale in progress, removes them from it too. There's no delete — only deactivate/reactivate." },
        { label: "3", title: "Points on void/return", description: "Voiding a sale reverses 100% of points it earned. A return reverses points proportionally to what was returned. Redeemed points are never restored either way." },
      ],
    },
    practice: {
      intro: "Edit a customer, then deactivate one and check POS lookup.",
      steps: [
        { title: "Edit a customer's phone number", description: "Save the change." },
        { title: "Deactivate a customer", description: "Confirm the prompt." },
        { title: "Search for them at POS", description: "Confirm they no longer appear in lookup." },
      ],
    },
    tips: {
      good: [
        { text: "Double-check a phone number edit — it's the main way customers get looked up." },
        { text: "Explain to a customer that redeemed points aren't refunded if they later return that purchase." },
      ],
      watchOutFor: [
        { text: "Assuming a Cashier can edit or deactivate a customer — that's Owner/Manager only." },
        { text: "Assuming a return restores redeemed points — it doesn't; only earned points ever reverse." },
      ],
    },
    quiz: [
      {
        question: "Who can edit or deactivate a customer record?",
        options: [
          { text: "Owner or Manager only", correct: true },
          { text: "Any Cashier", correct: false },
          { text: "Only the customer themselves", correct: false },
        ],
        explanation: "Adding a customer is open to Cashiers too, but editing and deactivating are Owner/Manager-only.",
      },
      {
        question: "What happens if a sale that redeemed points is later returned?",
        options: [
          { text: "The redeemed points are not restored to the customer", correct: true },
          { text: "The points are automatically credited back", correct: false },
          { text: "The customer's whole balance is reset", correct: false },
        ],
        explanation: "Only earned points ever reverse on a return — redeemed points are gone regardless.",
      },
      {
        question: "What happens if you deactivate a customer who's attached to the sale currently in progress?",
        options: [
          { text: "They're removed from that in-progress sale", correct: true },
          { text: "The sale is automatically voided", correct: false },
          { text: "Nothing changes on that sale", correct: false },
        ],
        explanation: "Deactivating clears them from any sale currently being rung up.",
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
        { label: "2", title: "KPI cards", description: "Revenue, Transactions, Avg Transaction, Items Sold, Discounts Given, Tax Collected." },
        { label: "3", title: "Payment split", description: "Cash and Card always show, in dollars and as a percentage of revenue; Other only appears once there's an Other-tender sale to report." },
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
        { text: "Compare Avg Transaction over time, not just total revenue, to spot trends." },
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
          { text: "Avg Transaction", correct: true },
          { text: "Employee schedule", correct: false },
          { text: "Reorder level", correct: false },
        ],
        explanation: "Avg Transaction is one of the six KPI cards shown.",
      },
      {
        question: "When does the payment split show an \"Other\" row?",
        options: [
          { text: "Only once there's an Other-tender sale in the period", correct: true },
          { text: "Always, even at $0", correct: false },
          { text: "Never — only cash and card exist", correct: false },
        ],
        explanation: "Cash and Card always show; Other is conditional on having actual Other-tender revenue.",
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
    nextLesson: { lessonId: "rep-3", sectionId: "reports", title: "Understanding the Profit Report" },
  },

  "rep-3": {
    id: "rep-3",
    sectionId: "reports",
    title: "Understanding the Profit Report",
    minutes: 5,
    badgeId: "profit-reader",
    overview: {
      objectives: [
        "Read the Profit Report's KPI cards",
        "Understand Gross Margin vs. Gross Profit",
        "Use Top Profit Products and Lowest Margin Products",
      ],
      summary: "Below the other Inventory Reports, the Profit Report breaks revenue down all the way to margin — its own period selector, separate from Sales Analytics.",
      whyItMatters: "Revenue tells you what came in; the Profit Report tells you what you actually kept after cost of goods.",
    },
    walkthrough: {
      screenLabel: "Profit Report (Reports tab)",
      callouts: [
        { label: "1", title: "Its own period selector", description: "Today / Last 7 Days / Last 30 Days / All Time — independent of where you left Sales Analytics." },
        { label: "2", title: "KPI cards", description: "Gross Sales, Discounts, Returns, Net Sales (Pre-Tax), COGS, Gross Profit, Gross Margin, Tax Collected, Total Collected (Including Tax)." },
        { label: "3", title: "Top Profit / Lowest Margin Products", description: "Two tables ranking products by actual profit contribution and by margin — not just by units sold." },
      ],
    },
    practice: {
      intro: "Read the KPI cards, then check the Lowest Margin Products table.",
      steps: [
        { title: "Find Gross Profit and Gross Margin", description: "Note the difference — one's a dollar amount, one's a percentage." },
        { title: "Switch the period", description: "See the cards recalculate independently of Sales Analytics." },
        { title: "Open Lowest Margin Products", description: "Spot a product that sells well but earns little." },
      ],
    },
    tips: {
      good: [
        { text: "Check Lowest Margin Products periodically — a bestseller can still be a weak earner." },
        { text: "Remember COGS relies on average cost, so keep receiving costs accurate to keep this report trustworthy." },
      ],
      watchOutFor: [
        { text: "Confusing Gross Profit (a dollar figure) with Gross Margin (a percentage)." },
        { text: "Assuming the Profit Report's period matches whatever you last set on Sales Analytics — it's independent." },
      ],
    },
    quiz: [
      {
        question: "What's the difference between Gross Profit and Gross Margin?",
        options: [
          { text: "Gross Profit is a dollar amount; Gross Margin is a percentage", correct: true },
          { text: "They're the same thing", correct: false },
          { text: "Gross Margin includes tax, Gross Profit doesn't", correct: false },
        ],
        explanation: "Profit is the dollar figure kept after COGS; Margin expresses that as a percentage of sales.",
      },
      {
        question: "Does the Profit Report share its period selector with Sales Analytics?",
        options: [
          { text: "No — it has its own, independent period selector", correct: true },
          { text: "Yes, they're always synced", correct: false },
          { text: "There's no period selector on the Profit Report", correct: false },
        ],
        explanation: "The Profit Report's period selector is separate from Sales Analytics' own.",
      },
      {
        question: "What does Lowest Margin Products help you spot?",
        options: [
          { text: "A product that sells well but earns little profit per sale", correct: true },
          { text: "Products that are out of stock", correct: false },
          { text: "The most expensive products in the catalog", correct: false },
        ],
        explanation: "It ranks by margin, not by units sold, surfacing weak earners even if they're popular.",
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
        { label: "1", title: "Cashier", description: "Dashboard, POS, and Customers — everything needed to run the register. No Wegn AI." },
        { label: "2", title: "Manager", description: "Everything a Cashier has, plus Inventory, Purchasing, Cash Drawer, Reports, and Wegn AI." },
        { label: "3", title: "Inventory Clerk", description: "Inventory and Purchasing only — no register, no customer data, no Wegn AI." },
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
        { text: "Assuming Cashier or Inventory Clerk can use Wegn AI — only Owner and Manager can." },
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
    nextLesson: { lessonId: "emp-3", sectionId: "employees", title: "Editing and Deactivating Staff" },
  },

  "emp-3": {
    id: "emp-3",
    sectionId: "employees",
    title: "Editing and Deactivating Staff",
    minutes: 4,
    badgeId: "staff-caretaker",
    overview: {
      objectives: [
        "Edit an employee's ID or role",
        "Deactivate and reactivate an employee",
        "Know there's no way to delete an employee outright",
      ],
      summary: "Staff records change over time — a role gets promoted, an Employee ID needs correcting, or someone leaves. Every one of those is Owner-only.",
      whyItMatters: "Editing an Employee ID changes their login credential — worth knowing before you do it while they're mid-shift.",
    },
    walkthrough: {
      screenLabel: "Staff tab — row actions",
      callouts: [
        { label: "1", title: "Edit", description: "Changes Employee ID and Role together in one action. Name and PIN are not editable here." },
        { label: "2", title: "Deactivate / Activate", description: "A single toggle button; deactivating asks for confirmation and, if that employee is the active cashier at POS, clears them from it automatically." },
        { label: "3", title: "No delete", description: "There is no \"remove employee\" feature — only deactivate, which keeps their history intact." },
      ],
    },
    practice: {
      intro: "Edit an employee's role, then deactivate and reactivate them.",
      steps: [
        { title: "Edit an employee's role", description: "Change it and save." },
        { title: "Deactivate the employee", description: "Confirm the prompt." },
        { title: "Reactivate them", description: "Toggle it back — no confirmation needed this time." },
      ],
    },
    tips: {
      good: [
        { text: "Warn an employee before changing their Employee ID — it's also their login credential." },
        { text: "Deactivate instead of trying to find a delete option — there isn't one, by design, to keep history intact." },
      ],
      watchOutFor: [
        { text: "Deactivating the employee who's currently the active cashier at POS without expecting them to be cleared from it." },
        { text: "Forgetting that editing Employee ID changes what that person types in to sign in next shift." },
      ],
    },
    quiz: [
      {
        question: "What can be changed in the Edit flow for an employee?",
        options: [
          { text: "Employee ID and Role", correct: true },
          { text: "Name and PIN", correct: false },
          { text: "Everything, including PIN", correct: false },
        ],
        explanation: "Name and PIN have their own separate flows (PIN reset); Edit covers ID and Role.",
      },
      {
        question: "Is there a way to delete an employee record?",
        options: [
          { text: "No — only deactivate, which preserves their history", correct: true },
          { text: "Yes, a hard delete option exists", correct: false },
          { text: "Only the employee can delete themselves", correct: false },
        ],
        explanation: "WEGN Store has no employee-deletion feature — deactivation is the only removal path.",
      },
      {
        question: "What happens if you deactivate the employee currently active as cashier at POS?",
        options: [
          { text: "They're automatically cleared as the active cashier", correct: true },
          { text: "The current sale is voided", correct: false },
          { text: "Nothing — they stay active until logout", correct: false },
        ],
        explanation: "Deactivation immediately clears them from the active-cashier slot.",
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
        "Know that email isn't a fallback option — it doesn't exist yet",
      ],
      summary: "Printing in WEGN Store sends the receipt to your browser's print dialog — a stuck printer is a hardware problem, but the sale record and reprint are always safe in the app.",
      whyItMatters: "A jammed or offline printer shouldn't mean a lost receipt or a stuck checkout — but also shouldn't lead to promising a customer an email that can't be sent.",
    },
    walkthrough: {
      screenLabel: "Sales History — reprint",
      callouts: [
        { label: "1", title: "Physical printer issue", description: "Paper jams, empty paper, and offline printers are fixed at the printer itself, not in the app." },
        { label: "2", title: "Reprint from Sales History", description: "Once the printer's working again, find the sale and print it — nothing was lost." },
        { label: "3", title: "No email fallback", description: "There's no email-receipt option anywhere in WEGN Store — printing (now or later) is the only way to give a customer a copy." },
      ],
    },
    practice: {
      intro: "Find a completed sale and reprint it.",
      steps: [
        { title: "Find a completed sale", description: "Locate it in Sales History." },
        { title: "Reprint its receipt", description: "Send it to the printer again." },
        { title: "Explain there's no email option", description: "Practice what you'd tell a customer instead." },
      ],
    },
    tips: {
      good: [
        { text: "Keep a habit of checking paper level at the start of a shift, before the line forms." },
        { text: "Tell the customer the sale went through and offer to reprint once the printer's fixed — don't promise an email." },
      ],
      watchOutFor: [
        { text: "Re-ringing the sale because the receipt didn't print — the sale already went through." },
        { text: "Promising to email a receipt as a workaround — that feature doesn't exist." },
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
        question: "If the printer is down, what's the real recovery option?",
        options: [
          { text: "Reprint the receipt once the printer works again", correct: true },
          { text: "Email the receipt instead", correct: false },
          { text: "Nothing — the sale is lost", correct: false },
        ],
        explanation: "There's no email option in WEGN Store — reprinting later is the only recovery path, and the sale itself was never at risk.",
      },
      {
        question: "Do you need to re-ring a sale if the receipt didn't print?",
        options: [
          { text: "No — reprint it once the printer works", correct: true },
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
    nextLesson: { lessonId: "settings-1", sectionId: "settings", title: "Configuring Your Business Profile" },
  },

  // ── Settings ──────────────────────────────────────────────────
  "settings-1": {
    id: "settings-1",
    sectionId: "settings",
    title: "Configuring Your Business Profile",
    minutes: 5,
    badgeId: "profile-configurator",
    overview: {
      objectives: [
        "Edit your Business Profile and Selling Policy",
        "Set your region, currency, timezone, and date format in Business Configuration",
        "Know that only the Owner can change any of this",
      ],
      summary: "Settings is where your store's identity and rules live — name, contact info, tax rate, selling policy, and regional formatting. It's all Owner-only.",
      whyItMatters: "Business Configuration feeds POS, Dashboard, Reports, Inventory, Purchasing, Customers, Cash Drawer, receipts, and Wegn AI — getting it right once avoids wrong numbers everywhere else.",
    },
    walkthrough: {
      screenLabel: "Settings tab — Business Profile",
      callouts: [
        { label: "1", title: "Business Profile", description: "Name (required), phone, email, address, and tax rate — edit and save as a group." },
        { label: "2", title: "Selling Policy", description: "Fixed Prices, Negotiated Prices, or Negotiated with Approval — the last one's approval workflow is explicitly labeled \"coming soon,\" not a working feature yet." },
        { label: "3", title: "Business Configuration", description: "Country/region, currency code and symbol, timezone, date format, and default tax rate — auto-filled by country but always editable." },
      ],
    },
    practice: {
      intro: "Edit your Business Profile, then check the Selling Policy options.",
      steps: [
        { title: "Edit the Business Profile", description: "Update the tax rate and save." },
        { title: "Review the three Selling Policy options", description: "Note which one is marked coming soon." },
        { title: "Open Business Configuration", description: "Check the currency and timezone fields." },
      ],
    },
    tips: {
      good: [
        { text: "Set your real tax rate here once — it feeds every sale, report, and receipt from then on." },
        { text: "Don't promise a customer an approval workflow on negotiated pricing — that part isn't built yet." },
      ],
      watchOutFor: [
        { text: "Expecting a Manager to be able to change any of this — Settings is Owner-only, full stop." },
        { text: "Assuming Negotiated with Approval already has a working approval step — the UI says \"coming soon.\"" },
      ],
    },
    quiz: [
      {
        question: "Who can edit Business Profile or Business Configuration?",
        options: [
          { text: "Only the Owner", correct: true },
          { text: "Owner or Manager", correct: false },
          { text: "Any role with Settings access", correct: false },
        ],
        explanation: "Settings is excluded from every assignable role — only Owner has it.",
      },
      {
        question: "What does the Selling Policy \"Negotiated with Approval\" option actually do today?",
        options: [
          { text: "Nothing yet — its approval workflow is labeled \"coming soon\"", correct: true },
          { text: "Routes every negotiated price to a manager for approval", correct: false },
          { text: "Blocks all negotiated pricing", correct: false },
        ],
        explanation: "It's a real option in the UI, but the approval logic behind it isn't built yet.",
      },
      {
        question: "What does Business Configuration feed, according to the app itself?",
        options: [
          { text: "POS, Dashboard, Reports, Inventory, Purchasing, Customers, Cash Drawer, receipts, and Wegn AI", correct: true },
          { text: "Only the receipt printer", correct: false },
          { text: "Nothing else in the app", correct: false },
        ],
        explanation: "Currency, timezone, and tax settings here are used almost everywhere in the app.",
      },
    ],
    nextLesson: { lessonId: "settings-2", sectionId: "settings", title: "Registering Devices & Receipt Settings" },
  },

  "settings-2": {
    id: "settings-2",
    sectionId: "settings",
    title: "Registering Devices & Receipt Settings",
    minutes: 4,
    badgeId: "device-registrar",
    overview: {
      objectives: [
        "Register a shared device for Staff Mode",
        "Revoke a device that shouldn't have access anymore",
        "Know what Receipt Settings does and doesn't do today",
      ],
      summary: "Device Management turns a shared physical device into a Staff Mode terminal — sign in with an Employee ID and PIN, no owner login needed. Receipt Settings is a preview only.",
      whyItMatters: "Registering a device from the wrong browser hands that browser over to Staff Mode — this is meant to be done on the physical device itself.",
    },
    walkthrough: {
      screenLabel: "Settings tab — Registered Devices",
      callouts: [
        { label: "1", title: "Register This Device", description: "Label it (e.g. \"Front Register\") and register — this switches the CURRENT browser's session into Staff Mode, so do this from the physical device, not your own." },
        { label: "2", title: "Revoke", description: "Removes a device's access; unlike registering, revoking doesn't affect your own current session." },
        { label: "3", title: "Receipt Settings", description: "A read-only preview of what prints on a receipt — logo upload and printer setup are explicitly labeled \"coming in v2,\" not available yet." },
      ],
    },
    practice: {
      intro: "Review the device list and the Receipt Settings preview.",
      steps: [
        { title: "Open Registered Devices", description: "Review the label/status/date columns." },
        { title: "Find the Revoke button", description: "Note it only shows for active devices." },
        { title: "Open Receipt Settings", description: "Confirm it's a preview with no edit controls." },
      ],
    },
    tips: {
      good: [
        { text: "Register a shared till or tablet from that device itself, not from your own laptop." },
        { text: "Revoke a device immediately if it's lost or a device is retired." },
      ],
      watchOutFor: [
        { text: "Registering a device from your own owner browser by mistake — it will switch your session to Staff Mode." },
        { text: "Looking for a logo upload or printer setup in Receipt Settings — neither exists yet." },
      ],
    },
    quiz: [
      {
        question: "What happens to your current browser session when you register a device?",
        options: [
          { text: "It switches to Staff Mode for that new device", correct: true },
          { text: "Nothing changes", correct: false },
          { text: "It logs you out entirely", correct: false },
        ],
        explanation: "Registering is meant to be done on the physical shared device — it hands that session to Staff Mode.",
      },
      {
        question: "Does revoking a device affect your own current session?",
        options: [
          { text: "No — revoke only targets the device being revoked", correct: true },
          { text: "Yes, it logs you out too", correct: false },
          { text: "It switches your session to Staff Mode", correct: false },
        ],
        explanation: "Revoke and register behave differently — only register touches the current browser's session.",
      },
      {
        question: "What can you do in Receipt Settings today?",
        options: [
          { text: "View a read-only preview — logo/printer setup is \"coming in v2\"", correct: true },
          { text: "Upload a custom logo", correct: false },
          { text: "Configure a receipt printer driver", correct: false },
        ],
        explanation: "Receipt Settings is currently preview-only, with the editable features explicitly marked as not yet built.",
      },
    ],
    nextLesson: null,
  },

  // ── AI Assistant ──────────────────────────────────────────────
  "ai-1": {
    id: "ai-1",
    sectionId: "ai-assistant",
    title: "Reading the Executive Briefing",
    minutes: 4,
    badgeId: "briefing-reader",
    overview: {
      objectives: [
        "Read the Wegn AI Executive Briefing's health cards and alerts",
        "Know which cards are Owner/Manager-only",
        "Use the Recommended Actions shortcuts",
      ],
      summary: "The top of the Wegn AI page is a static, always-current briefing — not a chat response — built from the same data as the rest of the app.",
      whyItMatters: "It's the fastest single screen to spot a stock problem or check if the drawer's open, without a single question typed.",
    },
    walkthrough: {
      screenLabel: "Wegn AI — Executive Briefing",
      callouts: [
        { label: "1", title: "Overall Store Health cards", description: "Today's Sales (everyone), Today's Profit (Owner/Manager only), Inventory Health, and Cash Drawer status." },
        { label: "2", title: "Priority Alerts", description: "Low-stock, out-of-stock, and expiring-batch alerts, most severe first — up to 5 at a time." },
        { label: "3", title: "Recommended Actions", description: "Three fixed shortcut buttons into Inventory and Purchasing — not AI-generated suggestions, just quick navigation." },
      ],
    },
    practice: {
      intro: "Find each health card and the alerts list.",
      steps: [
        { title: "Check Today's Sales", description: "Available to every role that can see this tab." },
        { title: "Check Today's Profit", description: "Note it's Owner/Manager only." },
        { title: "Review Priority Alerts", description: "See what's flagged most severe first." },
      ],
    },
    tips: {
      good: [
        { text: "Check the Briefing first before typing a question to the chat below it — it may already have your answer." },
        { text: "Use the Recommended Actions buttons as shortcuts instead of navigating the full menu." },
      ],
      watchOutFor: [
        { text: "Expecting the Briefing to update in response to a question — it's a static summary, not part of the chat." },
        { text: "Assuming a Cashier or Inventory Clerk can see this page at all — Wegn AI is Owner/Manager only." },
      ],
    },
    quiz: [
      {
        question: "Is the Executive Briefing generated by the AI model?",
        options: [
          { text: "No — it's a static, computed summary from the same data as the rest of the app", correct: true },
          { text: "Yes, it's an AI-written summary", correct: false },
          { text: "It's random sample data", correct: false },
        ],
        explanation: "The Briefing is deliberately not routed through the AI — it's a fast, deterministic dashboard.",
      },
      {
        question: "Who can see the Today's Profit card?",
        options: [
          { text: "Owner and Manager only", correct: true },
          { text: "Every role", correct: false },
          { text: "Only the Owner", correct: false },
        ],
        explanation: "Profit is gated the same way as everywhere else — Owner/Manager only.",
      },
      {
        question: "What do the Recommended Actions buttons do?",
        options: [
          { text: "Navigate to Inventory or Purchasing — they're fixed shortcuts, not AI suggestions", correct: true },
          { text: "Automatically create a purchase order", correct: false },
          { text: "Message the supplier directly", correct: false },
        ],
        explanation: "They're navigation shortcuts, not actions the AI performs on your behalf.",
      },
    ],
    nextLesson: { lessonId: "ai-2", sectionId: "ai-assistant", title: "Asking Wegn AI" },
  },

  "ai-2": {
    id: "ai-2",
    sectionId: "ai-assistant",
    title: "Asking Wegn AI",
    minutes: 5,
    badgeId: "ai-questioner",
    overview: {
      objectives: [
        "Ask Wegn AI a question about sales, stock, or suppliers",
        "Know that Wegn AI is read-only — it cannot create, edit, or approve anything",
        "Know that chat history doesn't persist across a page reload",
      ],
      summary: "Wegn AI answers questions using your store's real data — sales, low stock, supplier balances, and more — but it can only look things up, never act on them.",
      whyItMatters: "Trusting Wegn AI to actually place an order, adjust stock, or process anything would be a mistake — it can't; overselling what it can do sets up a real failure.",
    },
    walkthrough: {
      screenLabel: "Ask Wegn AI — chat",
      callouts: [
        { label: "1", title: "Ask a question", description: "e.g. \"What are my top sellers this week?\" or \"Which products are low on stock?\" — answered from real data, never guessed." },
        { label: "2", title: "Read-only, always", description: "Every tool behind Wegn AI only looks up data — it cannot create a PO, adjust inventory, apply a discount, or process a return." },
        { label: "3", title: "No memory across reloads", description: "Refreshing the page starts a brand-new conversation — nothing from before is remembered." },
      ],
    },
    practice: {
      intro: "Ask Wegn AI a real question, then note what it can't do.",
      steps: [
        { title: "Ask about today's sales", description: "See it answer from real data." },
        { title: "Ask it to do something write-based", description: "e.g. \"create a purchase order for me\" — see it explain it can't." },
        { title: "Reload the page", description: "Confirm the conversation starts fresh." },
      ],
    },
    tips: {
      good: [
        { text: "Ask specific questions — \"low stock items\" or \"supplier balance for X\" — it's built to answer exactly those kinds of lookups." },
        { text: "If Wegn AI says it can't find or report something, trust that — it's told to say so rather than guess." },
      ],
      watchOutFor: [
        { text: "Asking Wegn AI to take an action (create a PO, adjust stock, apply a discount) — it has no write tools at all." },
        { text: "Expecting it to remember an earlier conversation after a page reload — it doesn't." },
      ],
    },
    quiz: [
      {
        question: "Can Wegn AI create a purchase order for you?",
        options: [
          { text: "No — it has no write/action tools, only read-only lookups", correct: true },
          { text: "Yes, just ask it to", correct: false },
          { text: "Only if you're the Owner", correct: false },
        ],
        explanation: "Every tool available to Wegn AI is read-only — nothing it does changes your data.",
      },
      {
        question: "What happens to your conversation if you reload the page?",
        options: [
          { text: "It starts a brand-new conversation — nothing is remembered", correct: true },
          { text: "It picks up exactly where you left off", correct: false },
          { text: "It's saved permanently to your profile", correct: false },
        ],
        explanation: "Chat history is session-only and doesn't persist across reloads.",
      },
      {
        question: "What should you do if Wegn AI says it can't find or report a number?",
        options: [
          { text: "Trust it — it's designed to say so rather than guess", correct: true },
          { text: "Assume it's broken and ask again the same way", correct: false },
          { text: "Assume the number is zero", correct: false },
        ],
        explanation: "The system is explicitly told never to estimate — an honest \"I can't find that\" is by design.",
      },
    ],
    nextLesson: null,
  },
};
