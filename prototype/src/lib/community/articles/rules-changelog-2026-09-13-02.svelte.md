## Release notes

This update fixes several typos and minor grammatical issues in the narrative text on the Consolidated
Rules site, and integrates several small readability and clarity tweaks in various FedRAMP Rules.

Several of these updates were contributed by members of the FedRAMP Community on GitHub, including:

- @AllanTaylor314: [Assessor page says listing is an endorsement, inverting the meaning (+ other spelling, grammar, and punctuation fixes)](https://github.com/FedRAMP/2026/issues/96)
- @ktalons: [Should these five rules carry timeframe_type/timeframe_num?](https://github.com/FedRAMP/community/discussions/164)
- @tnnrjmsn-eit: [incident-evaluation-and-communication](https://github.com/FedRAMP/2026/discussions/113#discussioncomment-18192379)
- @mgcas-roxanne: [agency-use](https://github.com/FedRAMP/2026/discussions/110#discussioncomment-18022928)


### Content Changes

- The force of the rule (`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`) now includes a link to the definition with an instant preview any time it appears in the main rule statement.
- [Using the Consolidated Rules](https://www.fedramp.gov/2026/rules/#force-of-the-rule) Force of the Rule section was moved from a table into a series of h4 admonitions for readability; this is the same information that's now also in FedRAMP Definitions.
- Instant preview links no longer have the mouse-pointer icon  after them - this might make it a bit less obvious that there is an instant preview but removes a lot of visual clutter.

### Rules Changes

- `AGU-AGC-LIA`: Updates the Agency Liaison Program reference URL from `/preview/2026/agencies/support/liaisons` to `/2026/agencies/support/liaisons`.
- `AGU-USE-ABU`: Updates the authorization guidance reference URL to `https://www.fedramp.gov/2026/agencies/use`.
- `CCM-OCR-AVL`: Clarifies that listed Ongoing Certification Report contents are required “if applicable,” depending on certification type or class, and adds structured metadata for the existing 3-month reporting interval.
- `CCM-QTR-SAR`: Adds structured timeframe metadata for the existing recommendation to schedule Quarterly Reviews 3–10 business days after releasing an Ongoing Certification Report.
- `CPO-CSO-OVR`, `CPO-CSO-MTD`, `CPO-CSO-OSA`, and `CPO-CSF-CPM`: Moves the Rev5 default grace date from January 1 to July 1, 2027, at `FRR.CPO.info.rev5.effective.date.grace.default`, retaining `until_next_assessment: true`.
- `CPO-CSF-CPM`: Structurally narrows Rev5 subset applicability from classes A–D to B–D at `FRR.CPO.info.rev5.subsets.CSF.applicability.classes`.
- `FRC-CCL-UCC`, `FRC-CCL-DCC`, and `FRC-CCL-DNP`: Structurally narrows certification-class-change applicability from classes A–D to B–D at `FRR.FRC.info.subsets.CCL.applicability.classes`; upgrade and downgrade notes still mention transitions involving Class A.
- `IEC-CSO-OIR`: Removes the duplicated “the” from all four class-specific incident-reporting statements.
- `IVV-CSF-MCA`: Adds structured metadata for the existing requirement to include all applicable Rev5 controls in independent assessments every 3 years.
- `MKT-CAS-RFR`: Adds structured metadata for the existing requirement that advisors respond to FedRAMP or GSA requests within 5 business days.
- `MKT-IIP-DLA`: Adds structured metadata for the existing 2-year deadline to demonstrate a scheduled Class B, C, or D assessment after initial listing.
- `VDR-TFR-NMV`: Adds structured metadata for the existing requirement to verify and validate non-machine-based information resources at least every 3 months.
- Adds definition `FRD-MST` (MUST): an absolute requirement that must be met and documented, with failure potentially requiring corrective action or denial of initial or ongoing certification.
- Adds definition `FRD-MNT` (MUST NOT): an absolute prohibition that must be observed and documented, with the same potential consequences for failure.
- Adds definition `FRD-SHD` (SHOULD): departures may have valid reasons, but parties must carefully weigh the implications and document their decisions.
- Adds definition `FRD-SNT` (SHOULD NOT): the discouraged action may be justified in particular circumstances, but parties must carefully weigh the implications and document their decisions.
- Adds definition `FRD-MAY` (MAY): the rule is optional, and parties should explain their decisions in security documentation.