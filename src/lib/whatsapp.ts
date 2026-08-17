/**
 * WhatsApp Deep Link Helper (wa.me)
 * Uses free wa.me deep links with properly URL-encoded prefilled messages.
 */

export const SYNTHETIX_SUPPORT_WHATSAPP = "+919876543210";

/**
 * Builds a wa.me URL for contacting a shop.
 * Returns undefined if no valid whatsapp/phone number is provided.
 */
export function getShopWhatsAppUrl(
  whatsappOrPhone?: string | null,
  shopName?: string | null,
  itemName?: string | null,
): string | undefined {
  if (!whatsappOrPhone) return undefined;
  const cleanNumber = whatsappOrPhone.replace(/[^0-9]/g, "");
  if (!cleanNumber || cleanNumber.length < 7) return undefined;

  let msg = "Hi! I found your shop on Synthetix.";
  if (itemName) {
    msg = `Hi! I found your shop on Synthetix. Is "${itemName}" currently available in stock?`;
  } else if (shopName) {
    msg = `Hi! I found "${shopName}" on Synthetix. Are items currently available in stock at your store?`;
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
}

/**
 * Builds a wa.me URL for contacting Synthetix merchant support.
 */
export function getSupportWhatsAppUrl(inquiryText?: string): string {
  const cleanNumber = SYNTHETIX_SUPPORT_WHATSAPP.replace(/[^0-9]/g, "");
  const text =
    inquiryText ||
    "Hi Synthetix Support! I am a local store owner interested in merchant tools, inventory parsing, and store listing.";
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}
