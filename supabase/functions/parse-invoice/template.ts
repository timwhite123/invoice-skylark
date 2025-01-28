export const invoiceTemplate = {
  "templateName": "Enhanced Invoice Parser",
  "templateVersion": 3,
  "objects": [
    {
      "name": "vendor_name",
      "type": "field",
      "regex": "(?:Company|Vendor|From|Business|Supplier|Bill\\s*(?:To|From)|Billed\\s*(?:To|From))\\s*[:.]?\\s*([^\\n\\r]{2,50})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "invoice_number",
      "type": "field",
      "regex": "(?:Invoice|Reference|Bill|Document|Order)\\s*(?:#|No\\.?|Number|ID)?\\s*[:.]?\\s*(\\w+[-\\w]*)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "invoice_date",
      "type": "field",
      "regex": "(?:Invoice|Bill|Order|Document)?\\s*(?:Date)\\s*[:.]?\\s*(\\d{1,2}[-/.\\s]\\d{1,2}[-/.\\s]\\d{2,4}|\\d{4}[-/.\\s]\\d{1,2}[-/.\\s]\\d{1,2})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "due_date",
      "type": "field",
      "regex": "(?:Due|Payment|Pay\\s*By|Expires?)\\s*(?:Date)?\\s*[:.]?\\s*(\\d{1,2}[-/.\\s]\\d{1,2}[-/.\\s]\\d{2,4}|\\d{4}[-/.\\s]\\d{1,2}[-/.\\s]\\d{1,2})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "total_amount",
      "type": "field",
      "regex": "(?:Total|Amount|Sum|Balance|Due|Payable)\\s*(?:Due|Amount|Payable)?\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "currency",
      "type": "field",
      "regex": "(USD|EUR|GBP|\\$|€|£)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "tax_amount",
      "type": "field",
      "regex": "(?:Tax|VAT|GST)\\s*(?:Amount)?\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "subtotal",
      "type": "field",
      "regex": "(?:Subtotal|Net\\s*Amount|Amount\\s*Before\\s*Tax)\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "payment_terms",
      "type": "field",
      "regex": "(?:Payment\\s*Terms|Terms|Net)\\s*[:.]?\\s*([^\\n\\r]{2,50})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "purchase_order_number",
      "type": "field",
      "regex": "(?:PO|Purchase\\s*Order|Order)\\s*(?:#|No\\.?|Number)?\\s*[:.]?\\s*(\\w+[-\\w]*)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "billing_address",
      "type": "field",
      "regex": "(?:Bill(?:ing)?\\s*(?:To|Address)|Invoice\\s*Address)\\s*[:.]?\\s*([^\\n\\r]{2,200})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "shipping_address",
      "type": "field",
      "regex": "(?:Ship(?:ping)?\\s*(?:To|Address)|Deliver\\s*To)\\s*[:.]?\\s*([^\\n\\r]{2,200})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "payment_method",
      "type": "field",
      "regex": "(?:Payment\\s*Method|Pay\\s*(?:By|Via|Using))\\s*[:.]?\\s*([^\\n\\r]{2,50})",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "discount_amount",
      "type": "field",
      "regex": "(?:Discount|Reduction)\\s*(?:Amount)?\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "additional_fees",
      "type": "field",
      "regex": "(?:Additional\\s*(?:Fees|Charges)|Surcharge|Extra\\s*Charges)\\s*[:.]?\\s*(?:USD|\\$|€|£)?\\s*(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true, "caseInsensitive": true }
    },
    {
      "name": "notes",
      "type": "field",
      "regex": "(?:Notes|Comments|Remarks|Additional\\s*Information)\\s*[:.]?\\s*([^\\n\\r]{2,500})",
      "options": { "multiline": true, "caseInsensitive": true }
    }
  ]
}