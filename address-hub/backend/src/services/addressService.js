/**
 * addressService
 *
 * Static catalog of supported platforms and the manual steps required to
 * change a billing/shipping address on each. The data here is intentionally
 * exhaustive so the frontend never needs a network call to render the
 * instructions panel.
 *
 * Priority ranks how impactful an address change on that platform is — useful
 * for ordering the checklist (banks > retail > rewards).
 */

const PLATFORMS = {
  amazon: {
    key: 'amazon',
    name: 'Amazon',
    category: 'Retail',
    hasAPI: false,
    priority: 2,
    website: 'https://www.amazon.com',
    instructions: [
      'Sign in at amazon.com on a desktop browser.',
      'Hover over "Account & Lists" in the top-right and choose "Your Addresses".',
      'Click "Add address" to enter the new address, or "Edit" on an existing one.',
      'Fill in the full street, city, state, ZIP, and phone number.',
      'Click "Set as Default" so future orders ship there automatically.',
      'Open "Your Orders" and update the shipping address on any orders that have not yet shipped.',
      'Check "Subscribe & Save" under "Your Account" and update the address on each active subscription.',
    ],
  },
  walmart: {
    key: 'walmart',
    name: 'Walmart',
    category: 'Retail',
    hasAPI: false,
    priority: 2,
    website: 'https://www.walmart.com',
    instructions: [
      'Sign in at walmart.com.',
      'Click your name in the top-right and choose "Account".',
      'Select "Addresses" from the left navigation.',
      'Click "Add a new address" and enter the new address.',
      'Mark it as your default shipping address.',
      'Go to "Payment methods" and update the billing address on each saved card.',
      'If you have a Walmart+ subscription, confirm the delivery address is updated under "Walmart+ membership".',
    ],
  },
  costco: {
    key: 'costco',
    name: 'Costco',
    category: 'Retail / Membership',
    hasAPI: false,
    priority: 3,
    website: 'https://www.costco.com',
    instructions: [
      'Sign in at costco.com.',
      'Hover over your name in the header and click "Account".',
      'Open "Address Book" and add or edit the new address.',
      'Set it as the default shipping address.',
      'Open "Membership" and click "Update Membership Information" to change the address on file with your membership.',
      'Visit a warehouse or call Costco Member Services (1-800-774-2678) if the membership address fails to update online.',
      'Update the billing address on saved payment methods under "Order & Returns".',
    ],
  },
  samsclub: {
    key: 'samsclub',
    name: "Sam's Club",
    category: 'Retail / Membership',
    hasAPI: false,
    priority: 3,
    website: 'https://www.samsclub.com',
    instructions: [
      'Sign in at samsclub.com.',
      'Click your name in the header and choose "Account".',
      'Open "Personal information" and update the primary address.',
      'Open "Address book" to add additional shipping addresses if needed.',
      'Mark the new address as default.',
      'Open "Membership" and verify the address on the membership card matches.',
      'Update the billing address on saved cards under "Payment methods".',
    ],
  },
  usps: {
    key: 'usps',
    name: 'USPS',
    category: 'Postal',
    hasAPI: true,
    priority: 1,
    website: 'https://moversguide.usps.com',
    instructions: [
      'Go to moversguide.usps.com.',
      'Select "Individual", "Family", or "Business" depending on who is moving.',
      'Enter the move start date, old address, and new address.',
      'Pay the $1.10 identity verification fee with a credit or debit card whose billing address matches the old address.',
      'Check your email for the confirmation code — keep it in case you need to modify or cancel the request.',
      'Mail forwarding starts within 7 business days; first-class mail forwards for 12 months.',
      'Optional: enroll in Informed Delivery at informeddelivery.usps.com to preview incoming mail.',
    ],
  },
  pnc: {
    key: 'pnc',
    name: 'PNC Bank',
    category: 'Banking',
    hasAPI: true,
    priority: 1,
    website: 'https://www.pnc.com',
    instructions: [
      'Sign in to PNC Online Banking at pnc.com.',
      'Click the gear/settings icon and choose "Customer Service".',
      'Select "Update Contact Information".',
      'Enter the new mailing address. PNC may require verification via a one-time passcode.',
      'Confirm the change applies to all accounts (checking, savings, credit cards, loans).',
      'For PNC credit cards, also update the billing address under "Cards" → "Manage Card".',
      'Expect a confirmation letter mailed to both the old and new address for security.',
      'If you have a safe deposit box, call your local branch (1-888-PNC-BANK) — that record is updated separately.',
    ],
  },
  chase: {
    key: 'chase',
    name: 'Chase Bank',
    category: 'Banking',
    hasAPI: true,
    priority: 1,
    website: 'https://www.chase.com',
    instructions: [
      'Sign in at chase.com.',
      'Click the profile icon in the top-right and choose "Profile & settings".',
      'Open "Personal details" → "Contact information".',
      'Click "Edit" next to "Address" and enter the new address.',
      'Chase will send a one-time passcode to your phone or email to confirm the change.',
      'Choose whether to apply the change to all accounts (recommended) or just specific ones.',
      'For Chase credit cards, the billing address updates automatically once the profile address changes.',
      'Verify the change on the mobile app — Settings → Personal details — and update Zelle if your phone number also changed.',
    ],
  },
  discover: {
    key: 'discover',
    name: 'Discover Card',
    category: 'Credit Card',
    hasAPI: false,
    priority: 1,
    website: 'https://www.discover.com',
    instructions: [
      'Sign in at discover.com.',
      'Click "Profile" in the top-right.',
      'Choose "Personal Information".',
      'Click "Edit" next to your mailing address.',
      'Enter the new address and submit.',
      'Discover may call or text a verification code for security.',
      'The change applies to billing statements, replacement cards, and reward redemptions.',
      'If you have multiple Discover accounts (card + savings), confirm the change applied to each.',
    ],
  },
  applecard: {
    key: 'applecard',
    name: 'Apple Card',
    category: 'Credit Card',
    hasAPI: false,
    priority: 1,
    website: 'https://www.apple.com/apple-card',
    instructions: [
      'Open the Wallet app on your iPhone.',
      'Tap your Apple Card.',
      'Tap the "more" (•••) icon in the top-right.',
      'Tap "Card Details" and authenticate with Face ID / Touch ID.',
      'Tap "Contact Information".',
      'Tap "Address", enter the new address, and tap "Save".',
      'Goldman Sachs (the issuer) will email a confirmation; the new statement will reflect the change.',
      'Also update your Apple ID address at appleid.apple.com so iCloud billing matches.',
    ],
  },
  rakuten: {
    key: 'rakuten',
    name: 'Rakuten Rewards',
    category: 'Rewards',
    hasAPI: false,
    priority: 4,
    website: 'https://www.rakuten.com',
    instructions: [
      'Sign in at rakuten.com.',
      'Click your name in the top-right and choose "Account Settings".',
      'Open the "Account Info" tab.',
      'Update the mailing address — this is where Big Fat Check payments are mailed.',
      'If you receive payouts by check, also confirm the payee name still matches.',
      'Switch to PayPal payouts under "Payment Settings" to skip mailed checks entirely.',
      'Click "Save Changes" at the bottom of the page.',
    ],
  },
};

class AddressService {
  /** Return a single platform's full record (including instructions). */
  getInstructions(platformKey) {
    const platform = PLATFORMS[platformKey];
    if (!platform) return null;
    return {
      platform: platform.key,
      name: platform.name,
      category: platform.category,
      hasAPI: platform.hasAPI,
      priority: platform.priority,
      website: platform.website,
      instructions: platform.instructions,
    };
  }

  /** Return the full catalog of platforms, sorted by priority then name. */
  getAllPlatforms() {
    return Object.values(PLATFORMS)
      .map((p) => ({
        key: p.key,
        name: p.name,
        category: p.category,
        hasAPI: p.hasAPI,
        priority: p.priority,
        website: p.website,
      }))
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }

  /** Return platforms filtered by category (case-insensitive substring match). */
  getPlatformsByCategory(category) {
    const needle = category.toLowerCase();
    return this.getAllPlatforms().filter((p) =>
      p.category.toLowerCase().includes(needle)
    );
  }

  /** Whether a given platform key is recognised. */
  isValidPlatform(platformKey) {
    return Boolean(PLATFORMS[platformKey]);
  }

  /** Map of platform key → hasAPI flag, useful when seeding the accounts table. */
  getApiPlatforms() {
    return Object.values(PLATFORMS)
      .filter((p) => p.hasAPI)
      .map((p) => p.key);
  }
}

module.exports = new AddressService();
module.exports.PLATFORMS = PLATFORMS;
