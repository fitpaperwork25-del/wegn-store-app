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
        "Fix a misread or unknown barcode",
        "Scan multiples of the same item fast",
      ],
      summary:
        "Scanning is the fastest, most accurate way to add items — this lesson covers the scan flow and what to do when it doesn't go smoothly.",
      whyItMatters: "Fewer manual lookups means shorter lines and fewer pricing mistakes.",
    },
    walkthrough: {
      screenLabel: "Scan field on the POS",
      callouts: [
        { label: "1", title: "Scan field", description: "Always focused and ready — just scan, no clicking required." },
        { label: "2", title: "Quantity stepper", description: "Scan the same item again, or bump the quantity directly." },
        { label: "3", title: "Unknown barcode alert", description: "Lets you search for the product manually if the scan doesn't match." },
      ],
    },
    practice: {
      intro: "Try scanning a few items and adjusting quantity.",
      steps: [
        { title: "Scan an item", description: "Add it to the cart with a single scan." },
        { title: "Scan the same item twice", description: "Watch the quantity bump instead of a duplicate line." },
        { title: "Resolve an unknown barcode", description: "Search for the product manually when a scan doesn't match." },
      ],
    },
    tips: {
      good: [
        { text: "Hold the barcode flat and steady, a few inches from the scanner." },
        { text: "Re-scan instead of typing the code by hand — it's faster and avoids typos." },
      ],
      watchOutFor: [
        { text: "Scanning through a phone screen or crumpled label — it often misreads." },
        { text: "Ignoring an unknown-barcode alert instead of resolving it." },
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
        question: "What should you do if a barcode won't scan?",
        options: [
          { text: "Search for the product manually", correct: true },
          { text: "Skip the item", correct: false },
          { text: "Charge a random similar item", correct: false },
        ],
        explanation: "Manual search is the built-in fallback for a bad scan.",
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
    title: "Product Search",
    minutes: 3,
    badgeId: "search-pro",
    overview: {
      objectives: [
        "Find a product without a barcode",
        "Use filters to narrow results",
        "Add a search result to the cart",
      ],
      summary:
        "Not everything has a scannable barcode in hand — search lets you find any product by name, category, or SKU.",
      whyItMatters: "A fast search keeps the line moving when scanning isn't an option.",
    },
    walkthrough: {
      screenLabel: "Search bar on the POS",
      callouts: [
        { label: "1", title: "Search bar", description: "Type a product name, SKU, or partial match." },
        { label: "2", title: "Category filter", description: "Narrow results fast when a search returns too many items." },
        { label: "3", title: "Result row", description: "Tap to add directly to the cart." },
      ],
    },
    practice: {
      intro: "Search for a product and add it using a filter.",
      steps: [
        { title: "Search by name", description: "Type a partial product name and see live results." },
        { title: "Narrow with a category filter", description: "Cut a long list down to what you need." },
        { title: "Add a result to the cart", description: "Tap the correct row to add it." },
      ],
    },
    tips: {
      good: [
        { text: "Search partial words — you don't need the exact full name." },
        { text: "Use category filters when a search returns a long list." },
      ],
      watchOutFor: [
        { text: "Typing the full product name when a few letters would do." },
        { text: "Adding the wrong variant (size/color) from a crowded results list." },
      ],
    },
    quiz: [
      {
        question: "What can you search by besides product name?",
        options: [
          { text: "SKU", correct: true },
          { text: "Only exact name", correct: false },
          { text: "Nothing else", correct: false },
        ],
        explanation: "Search matches names, partial names, and SKUs.",
      },
      {
        question: "When should you use a category filter?",
        options: [
          { text: "When search returns too many results", correct: true },
          { text: "Never", correct: false },
          { text: "Only for reports", correct: false },
        ],
        explanation: "Filters exist to cut a long result list down fast.",
      },
      {
        question: "What's a risk of a crowded results list?",
        options: [
          { text: "Adding the wrong variant", correct: true },
          { text: "Slower scanning", correct: false },
          { text: "No risk at all", correct: false },
        ],
        explanation: "Similar-looking variants are easy to mix up in a long list.",
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
        "Apply a discount to one item",
        "Apply a discount to the whole cart",
        "Remove a discount you applied by mistake",
      ],
      summary:
        "Discounts can go on a single item or the entire cart — this lesson covers both and how to undo one.",
      whyItMatters: "Applying a discount to the wrong scope is one of the most common checkout mistakes.",
    },
    walkthrough: {
      screenLabel: "Cart panel",
      callouts: [
        { label: "1", title: "Item discount button", description: "Applies a discount to just that line." },
        { label: "2", title: "Cart discount button", description: "Applies a discount to the entire order total." },
        { label: "3", title: "Remove discount (×)", description: "Clears a discount you applied by mistake." },
      ],
    },
    practice: {
      intro: "Apply an item discount, then a cart-wide one, then remove it.",
      steps: [
        { title: "Apply a 10% discount to one item", description: "Use the item-level discount button." },
        { title: "Apply a cart-wide discount instead", description: "Switch to the whole-order discount." },
        { title: "Remove the discount you just applied", description: "Use the × to clear it." },
      ],
    },
    tips: {
      good: [
        { text: "Double-check whether a promo applies to one item or the whole cart before applying it." },
        { text: "Read the discount back to the customer before charging." },
      ],
      watchOutFor: [
        { text: "Applying a cart-wide discount when only one item qualifies." },
        { text: "Stacking two discounts that weren't meant to combine." },
      ],
    },
    quiz: [
      {
        question: "Where does an item discount apply?",
        options: [
          { text: "Just that line", correct: true },
          { text: "The whole cart", correct: false },
          { text: "Nowhere until checkout", correct: false },
        ],
        explanation: "Item discounts are scoped to the single line they're applied to.",
      },
      {
        question: "What should you check before applying a discount?",
        options: [
          { text: "Whether it's meant for one item or the whole cart", correct: true },
          { text: "The customer's name", correct: false },
          { text: "The time of day", correct: false },
        ],
        explanation: "Wrong scope is the most common discount mistake.",
      },
      {
        question: "How do you undo a discount you applied by mistake?",
        options: [
          { text: "Use the remove (×) button", correct: true },
          { text: "Void the whole sale", correct: false },
          { text: "Restart the register", correct: false },
        ],
        explanation: "Removing a discount is a single, targeted action — no need to void anything.",
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
        "Take a card payment",
        "Take a cash payment and give correct change",
        "Split a payment across two methods",
      ],
      summary: "WEGN Store accepts card, cash, and split payments — this lesson walks through all three.",
      whyItMatters: "Knowing every payment path means no awkward pauses at checkout, whatever the customer hands you.",
    },
    walkthrough: {
      screenLabel: "Payment screen",
      callouts: [
        { label: "1", title: "Card button", description: "Prompts the card reader — wait for approval before releasing the customer." },
        { label: "2", title: "Cash button", description: "Opens a change calculator based on cash received." },
        { label: "3", title: "Split payment", description: "Divide the total across two or more tender types." },
      ],
    },
    practice: {
      intro: "Take a cash payment, then try a split payment.",
      steps: [
        { title: "Charge a sale with cash", description: "Enter cash received and confirm the change due." },
        { title: "Split a payment", description: "Divide the total between card and cash." },
        { title: "Confirm the sale completes", description: "Check both tenders were applied correctly." },
      ],
    },
    tips: {
      good: [
        { text: "Always wait for card approval before handing over the receipt or goods." },
        { text: "Read the change amount back to the customer." },
      ],
      watchOutFor: [
        { text: "Releasing goods before a card payment is approved." },
        { text: "Miscalculating change on a cash sale." },
      ],
    },
    quiz: [
      {
        question: "What should you wait for before releasing goods on a card sale?",
        options: [
          { text: "Approval", correct: true },
          { text: "Nothing — hand it over right away", correct: false },
          { text: "A printed receipt only", correct: false },
        ],
        explanation: "Releasing goods before approval risks a declined or failed charge.",
      },
      {
        question: "What does the cash button open?",
        options: [
          { text: "A change calculator", correct: true },
          { text: "A discount menu", correct: false },
          { text: "The drawer report", correct: false },
        ],
        explanation: "It calculates change owed based on cash received.",
      },
      {
        question: "Can a sale be split across two payment types?",
        options: [
          { text: "Yes", correct: true },
          { text: "No", correct: false },
          { text: "Only for returns", correct: false },
        ],
        explanation: "Split payments divide the total across two or more tenders.",
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
        "Print a paper receipt",
        "Email a receipt instead",
        "Reprint a receipt for a past sale",
      ],
      summary: "Every completed sale can go out as a printed receipt, an emailed one, or both.",
      whyItMatters: "Customers need proof of purchase for returns — getting this right avoids disputes later.",
    },
    walkthrough: {
      screenLabel: "Receipt options screen",
      callouts: [
        { label: "1", title: "Print button", description: "Sends the receipt to the connected receipt printer." },
        { label: "2", title: "Email field", description: "Send a digital copy instead of, or in addition to, paper." },
        { label: "3", title: "No receipt", description: "Skip printing when the customer declines." },
      ],
    },
    practice: {
      intro: "Print a receipt, then try emailing one instead.",
      steps: [
        { title: "Print a paper receipt", description: "Send it straight to the printer." },
        { title: "Email a receipt", description: "Send a digital copy to a customer instead." },
        { title: "Reprint from Sales History", description: "Find a past sale and print it again." },
      ],
    },
    tips: {
      good: [
        { text: "Confirm the email address back to the customer before sending." },
        { text: "Offer both print and email if the customer isn't sure." },
      ],
      watchOutFor: [
        { text: "Sending a receipt to the wrong email address." },
        { text: "Forgetting a declined receipt can still be reprinted later from Sales History." },
      ],
    },
    quiz: [
      {
        question: "What should you confirm before emailing a receipt?",
        options: [
          { text: "The email address", correct: true },
          { text: "The tax rate", correct: false },
          { text: "The register number", correct: false },
        ],
        explanation: "A wrong address sends someone else's proof of purchase to a stranger.",
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
          { text: "It can still be reprinted later", correct: true },
          { text: "It's gone forever", correct: false },
          { text: "The sale is voided", correct: false },
        ],
        explanation: "Declining a receipt at checkout doesn't erase the sale record.",
      },
    ],
    nextLesson: { lessonId: "suspend-resume-sale", sectionId: "getting-started", title: "Suspending and Resuming a Sale" },
  },

  "suspend-resume-sale": {
    id: "suspend-resume-sale",
    sectionId: "getting-started",
    title: "Suspending and Resuming a Sale",
    minutes: 4,
    badgeId: "hold-and-resume",
    overview: {
      objectives: [
        "Suspend a sale in progress",
        "Resume a suspended sale later",
        "Know what happens to a suspended cart",
      ],
      summary:
        "Sometimes a sale needs to pause — a forgotten wallet, a call to a manager. Suspending holds the cart so you can help the next customer.",
      whyItMatters: "Without this, an interrupted sale either blocks the register or gets lost entirely.",
    },
    walkthrough: {
      screenLabel: "Cart panel",
      callouts: [
        { label: "1", title: "Suspend button", description: "Holds the current cart and clears the screen for the next customer." },
        { label: "2", title: "Suspended sales list", description: "Shows every held sale, oldest first." },
        { label: "3", title: "Resume", description: "Brings a suspended cart right back where you left off." },
      ],
    },
    practice: {
      intro: "Suspend a sale, ring up someone else, then resume it.",
      steps: [
        { title: "Add an item and suspend the sale", description: "Hold the cart instead of finishing it." },
        { title: "Start and complete a different sale", description: "Serve the next customer normally." },
        { title: "Resume the suspended sale", description: "Pick it back up and finish it." },
      ],
    },
    tips: {
      good: [
        { text: "Suspend instead of voiding when a customer just needs a minute." },
        { text: "Check the suspended list at the end of a shift — nothing should be left sitting there." },
      ],
      watchOutFor: [
        { text: "Forgetting a suspended sale is still open and expected to be paid." },
        { text: "Suspending instead of using discounts or holds meant for other situations." },
      ],
    },
    quiz: [
      {
        question: "What does suspending a sale do?",
        options: [
          { text: "Holds the cart for later", correct: true },
          { text: "Cancels it", correct: false },
          { text: "Emails a receipt", correct: false },
        ],
        explanation: "Suspending pauses a sale without canceling it.",
      },
      {
        question: "Where do you find a suspended sale later?",
        options: [
          { text: "The suspended sales list", correct: true },
          { text: "Reports", correct: false },
          { text: "Settings", correct: false },
        ],
        explanation: "Every held sale shows up in the suspended sales list, oldest first.",
      },
      {
        question: "What should you check at the end of a shift?",
        options: [
          { text: "That no suspended sales are left open", correct: true },
          { text: "The receipt printer paper", correct: false },
          { text: "Employee schedules", correct: false },
        ],
        explanation: "A leftover suspended sale carries into the next shift unresolved.",
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
