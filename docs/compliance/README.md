# Compliance and reference policy

Read when making decisions affecting tax, invoicing, payments, personal data, licensing or compliance claims.

- Consider applicable legal, tax, payment, privacy, security and licensing obligations in consequential decisions. Distinguish mandatory requirements from engineering guidance and business preferences.
- Never claim the product is compliant merely because it resembles Odoo or follows this document. Compliance requires confirmed applicability, implemented controls and acceptance evidence.
- Maintain a compliance register with requirement, authority/source and effective date, applicability/status, affected workflow, owner, control and evidence. Use statuses such as pending applicability, applicable, not applicable with rationale, and verified.
- For Faisalabad, assess Punjab Revenue Authority requirements as well as any applicable FBR obligations with the business/accountant. Do not assume all restaurants have identical obligations or infer tax rates, exemptions, invoice numbering, retention periods or integration mandates.
- Unresolved fiscal requirements block the affected billing/invoicing release, not unrelated catalogue discovery. Do not silently weaken a mandatory obligation to preserve offline operation or reduce complexity.
- Use official Odoo documentation and the preserved pilot as workflow references. Consult another established POS only for a specific gap. Record what was adopted and why; vendor behavior is not legal authority, and documentation does not prove hardware compatibility.
- Do not copy proprietary vendor code or assume redistribution rights. Review dependency licensing before adoption.
- Keep cardholder data out of the application by default; do not collect/store PANs, CVVs, PINs or track data. Record only approved payment method, amount and safe provider reference. Review PCI applicability before any card integration; external terminals do not automatically establish exemption.
- Minimize personal data, restrict access by role, protect secrets, redact logs and define retention/backups from applicable requirements. LAN deployment does not remove security obligations.

## Sources

- Odoo restaurant workflows: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/restaurant.html
- Odoo POS workflow: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/use.html
- Punjab Revenue Authority portal: https://e.pra.punjab.gov.pk/public/txplogin.xhtml
- FBR POS legal provisions: https://www.fbr.gov.pk/pos-legal-provisions/163085/163086
- PCI SSC standards: https://www.pcisecuritystandards.org/Standards/
- References checked on 2026-10-10. Recheck current authoritative requirements when making affected decisions; applicability is not established by this list.
