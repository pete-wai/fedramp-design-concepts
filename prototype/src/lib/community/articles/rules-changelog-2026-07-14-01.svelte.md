## Release notes

This update clarifies some FedRAMP rules and corrects some issues in the FedRAMP JSON schemas.

### Rules Changes

- **FRD-PAI** (Potential Agency Impact): Added a `note` clarifying that Potential Agency Impact N-rating (PAIN) levels are defined in `VER-EVA-EPA` (Estimate Potential Agency Impact).
- **FRC-CSO-PKG** (FedRAMP Certification Package): Reworked bullets to point to `CPO-CSO-OVR` (Overview of the Cloud Service Offering) and `SDR-CSO-FRR` (FedRAMP Rules) making it easier for users to find more detailed related rules.
- **CPO-CSF-CPM** (Certification Package Maintenance for Rev5): Removed the Class A variant (annual persistent-maintenance obligation) from `varies_by_class`, since Class A certifications are now handled under 20x rather than Rev5.
- **FRC-CLA-MFR**: Clarified in `notes` that providers MUST address the included Key Security Indicators to receive a Class A certification even if they intend to pursue a Rev 5 Program Certification path in the future.
- `CTL.IA.IA-05` control guidance: Reworded class b/c/d guidance to cite "the most recent NIST Digital Identity Guidelines" instead of naming/linking `NIST SP 800-63-3`.
- Terminology rename (display text only, schema key/URL unchanged): `schema.name` for `FRC-CSO-PKG` renamed from "FedRAMP Certification Overview Package" to "FedRAMP Certification Package Overview" across six requirements — `FRC-CSO-PKG`, `CDS-CSO-PUB`, `CDS-CSO-SVC`, `CDS-CSO-UTC`, `MAS-CSO-TPR`, and `SCG-CSO-RSC`.