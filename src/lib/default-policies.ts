import crypto from "crypto";
import { db } from "@/lib/db";

const BASELINE_FILE = "sellercrew-amazon-policy-baseline.md";

interface BaselineRule {
  category: string;
  title: string;
  ruleText: string;
  severity: "low" | "medium" | "high" | "critical";
  keywords: string[];
}

const BASELINE_RULES: BaselineRule[] = [
  { category: "listing_content_format", title: "Accurate product identity", ruleText: "Represent the exact product being sold and do not describe features, accessories, quantities, variations, or package contents that are not included.", severity: "high", keywords: ["included", "features", "package", "quantity", "model"] },
  { category: "listing_content_format", title: "No promotional title content", ruleText: "Do not include prices, discounts, coupons, shipping claims, urgency, seller contact details, or promotional calls to action in the product title.", severity: "medium", keywords: ["sale", "discount", "free shipping", "buy now", "limited time"] },
  { category: "listing_content_format", title: "Readable non-spam title", ruleText: "Keep the title readable and avoid all-capital wording, decorative symbols, excessive punctuation, and repeated keyword phrases.", severity: "medium", keywords: ["title", "keywords"] },
  { category: "listing_content_format", title: "Evidence-backed bullet points", ruleText: "Use bullet points only for relevant product facts and defensible benefits supported by seller evidence.", severity: "high", keywords: ["bullet", "benefit", "feature"] },
  { category: "listing_content_format", title: "No external contact or links", ruleText: "Do not place phone numbers, email addresses, website URLs, QR codes, social handles, or instructions to transact outside Amazon in listing content or images.", severity: "high", keywords: ["website", "email", "phone", "qr", "contact"] },
  { category: "listing_content_format", title: "No competitor comparison without proof", ruleText: "Do not name competitors or make comparative superiority claims unless the comparison is lawful, objective, current, and reliably substantiated.", severity: "high", keywords: ["better than", "competitor", "leading", "superior"] },
  { category: "listing_content_format", title: "Backend search term integrity", ruleText: "Backend search terms must be relevant and must not contain competitor trademarks, ASINs, false claims, offensive terms, or repeated keyword stuffing.", severity: "high", keywords: ["search terms", "backend", "asin", "trademark"] },
  { category: "listing_content_format", title: "Variation accuracy", ruleText: "Do not combine materially different products into one variation family or use variation names that misrepresent size, color, quantity, model, or style.", severity: "high", keywords: ["variation", "size", "color", "model"] },
  { category: "images_media", title: "Main image white background", ruleText: "Use a clean pure-white background for the main product image unless the applicable category rule explicitly permits otherwise.", severity: "high", keywords: ["main image", "white background"] },
  { category: "images_media", title: "Main image shows only the offer", ruleText: "The main image must show the actual product and only accessories or components included in the customer offer.", severity: "high", keywords: ["main image", "accessories", "included"] },
  { category: "images_media", title: "No main-image overlays", ruleText: "Do not add text, logos not present on the product, badges, borders, watermarks, inset graphics, or promotional elements to the main image.", severity: "high", keywords: ["watermark", "badge", "border", "overlay", "main image"] },
  { category: "images_media", title: "No misleading visual modification", ruleText: "Do not alter the product's color, geometry, proportions, controls, labels, branding, packaging, quantity, or included parts in generated or edited images.", severity: "critical", keywords: ["generated image", "color", "logo", "packaging", "proportions"] },
  { category: "images_media", title: "Readable truthful infographic text", ruleText: "Secondary-image text and graphics must be legible, factually accurate, evidence-backed, and consistent with the delivered product.", severity: "high", keywords: ["infographic", "overlay", "dimensions", "feature"] },
  { category: "images_media", title: "No unsupported scale or results", ruleText: "Do not use visual scale, before-and-after imagery, simulations, or demonstrations that exaggerate product size, performance, capacity, or expected results.", severity: "high", keywords: ["before and after", "results", "scale", "performance"] },
  { category: "images_media", title: "No Amazon endorsement graphics", ruleText: "Do not use Amazon logos, Prime marks, choice badges, best-seller badges, star ratings, review counts, or graphics implying Amazon endorsement.", severity: "critical", keywords: ["amazon choice", "prime", "best seller", "stars"] },
  { category: "health_medical_claims", title: "No unapproved disease claims", ruleText: "Do not claim that a product diagnoses, cures, mitigates, treats, or prevents a disease or medical condition unless the product is legally authorized and the exact claim is permitted and substantiated.", severity: "critical", keywords: ["cure", "treat", "prevent", "disease", "medical"] },
  { category: "health_medical_claims", title: "Substantiate health and performance claims", ruleText: "Do not publish health, safety, efficacy, clinical, scientific, performance, or test-result claims without reliable evidence supporting the exact wording.", severity: "critical", keywords: ["clinically proven", "scientifically proven", "effective", "tested"] },
  { category: "health_medical_claims", title: "No absolute safety guarantees", ruleText: "Do not use absolute claims such as completely safe, risk-free, guaranteed results, zero side effects, or 100 percent effective.", severity: "critical", keywords: ["100% safe", "risk free", "guaranteed", "no side effects"] },
  { category: "health_medical_claims", title: "Certification claim evidence", ruleText: "Use regulatory approvals, certifications, laboratory claims, and compliance marks only when valid for the exact product and supported by current documentation.", severity: "critical", keywords: ["approved", "certified", "fda", "ce", "laboratory"] },
  { category: "restricted_prohibited_products", title: "Restricted-product eligibility", ruleText: "Do not list a restricted product unless the product, seller account, marketplace, shipping method, and required approvals are eligible under the applicable Amazon program.", severity: "critical", keywords: ["restricted", "approval", "eligible"] },
  { category: "restricted_prohibited_products", title: "No illegal or prohibited products", ruleText: "Do not create or publish listings for illegal products or products prohibited by Amazon or applicable Egyptian law.", severity: "critical", keywords: ["illegal", "prohibited"] },
  { category: "restricted_prohibited_products", title: "Weapons and dangerous items review", ruleText: "Route weapons, weapon parts, ammunition, explosives, and dangerous-item content to a human eligibility review and do not publish without explicit marketplace authorization.", severity: "critical", keywords: ["weapon", "gun", "ammunition", "explosive"] },
  { category: "restricted_prohibited_products", title: "Controlled substances review", ruleText: "Do not list controlled substances, narcotics, drug paraphernalia, or products marketed for unlawful drug use.", severity: "critical", keywords: ["narcotic", "controlled substance", "drug"] },
  { category: "restricted_prohibited_products", title: "Tobacco and nicotine review", ruleText: "Route tobacco, nicotine, vaping, and related products to explicit marketplace eligibility review before any listing is created.", severity: "critical", keywords: ["tobacco", "nicotine", "vape"] },
  { category: "ip_trademark_brand", title: "Authorized brand use", ruleText: "Use brand names, logos, copyrighted media, patents, characters, and trademarks only when owned, licensed, or otherwise legally authorized for the product.", severity: "critical", keywords: ["brand", "logo", "copyright", "patent", "trademark"] },
  { category: "ip_trademark_brand", title: "No counterfeit representation", ruleText: "Do not describe, display, or sell a counterfeit, replica, imitation, or unauthorized product as genuine.", severity: "critical", keywords: ["replica", "imitation", "genuine", "authentic"] },
  { category: "ip_trademark_brand", title: "Compatibility wording accuracy", ruleText: "Use another brand name for compatibility only when necessary, accurate, non-confusing, and not presented as endorsement or product ownership.", severity: "high", keywords: ["compatible with", "fits", "for"] },
  { category: "reviews_ratings", title: "No review manipulation", ruleText: "Do not offer compensation, gifts, refunds, discounts, or other incentives in exchange for a review, rating, vote, or removal of negative feedback.", severity: "critical", keywords: ["review", "rating", "refund", "gift", "incentive"] },
  { category: "reviews_ratings", title: "No rating claims in listing", ruleText: "Do not place star ratings, review counts, customer quotations, or claims about customer satisfaction in listing content or images unless explicitly permitted and reliably current.", severity: "high", keywords: ["stars", "reviews", "customers love"] },
  { category: "pricing_offers", title: "No misleading savings claims", ruleText: "Do not use false, unverifiable, outdated, or misleading list prices, savings percentages, discounts, scarcity, or limited-time claims.", severity: "high", keywords: ["save", "discount", "limited time", "only today"] },
  { category: "pricing_offers", title: "No price in creative content", ruleText: "Do not include product price, coupons, shipping promotions, or financing claims in titles, bullets, descriptions, A+ content, or product images.", severity: "medium", keywords: ["price", "coupon", "shipping", "installment"] },
  { category: "product_safety", title: "Required warning accuracy", ruleText: "Include legally required age, choking, electrical, chemical, battery, allergen, hazard, and safe-use warnings accurately and do not obscure or contradict them.", severity: "critical", keywords: ["warning", "choking", "battery", "hazard", "allergen"] },
  { category: "product_safety", title: "No unsafe use depiction", ruleText: "Do not describe or depict an unsafe, illegal, unintended, or manufacturer-prohibited use of the product.", severity: "critical", keywords: ["unsafe", "instructions", "warning"] },
  { category: "product_safety", title: "Material and ingredient accuracy", ruleText: "State materials, ingredients, allergens, capacities, dimensions, and technical specifications only when supported by reliable product documentation.", severity: "high", keywords: ["material", "ingredient", "allergen", "capacity", "dimensions"] },
  { category: "product_safety", title: "Battery and hazardous-goods accuracy", ruleText: "Accurately disclose batteries, chemicals, aerosols, flammables, magnets, liquids, and other dangerous-goods attributes required for storage and fulfillment.", severity: "critical", keywords: ["battery", "chemical", "flammable", "aerosol", "magnet"] },
  { category: "general", title: "No unsupported superlatives", ruleText: "Do not use best, number one, top-rated, fastest, safest, strongest, guaranteed, or similar superiority claims without reliable current substantiation and permission.", severity: "high", keywords: ["best", "number one", "top rated", "fastest", "safest"] },
  { category: "general", title: "Marketplace and category precedence", ruleText: "Apply the most specific current marketplace, category, product-type, dangerous-goods, and legal requirement when it is stricter than this baseline.", severity: "critical", keywords: ["marketplace", "category", "policy"] },
  { category: "general", title: "Escalate uncertain high-risk decisions", ruleText: "Escalate uncertain legal, safety, restricted-product, medical, certification, or intellectual-property decisions to a qualified human reviewer instead of guessing.", severity: "critical", keywords: ["uncertain", "legal", "review"] },
];

function fingerprint(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return crypto.createHash("sha1").update(normalized).digest("hex");
}

export async function ensureDefaultPolicyKnowledgeBase(): Promise<void> {
  const existing = await db.policyDocument.findFirst({ where: { fileName: BASELINE_FILE }, select: { id: true } });
  if (existing) return;

  const rawMarkdown = [
    "# SellerCrew Amazon Listing Policy Baseline",
    "",
    "Operational baseline for automated listing review. Current official marketplace, category, product-type, legal, and account-specific requirements take precedence. Extend this bank with authoritative Amazon policy documents.",
    "",
    ...BASELINE_RULES.map((rule) => `## ${rule.title}\n\n${rule.ruleText}`),
  ].join("\n\n");

  await db.policyDocument.create({
    data: {
      title: "SellerCrew Amazon Listing Policy Baseline",
      fileName: BASELINE_FILE,
      rawMarkdown,
      rules: {
        create: BASELINE_RULES.map((rule) => ({
          ...rule,
          keywords: JSON.stringify(rule.keywords),
          fingerprint: fingerprint(rule.ruleText),
        })),
      },
    },
  });
}
