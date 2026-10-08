<!-- lib/components/FedRAMPTTSFooter.svelte -->
<script>
  import { asset } from '$lib/utils/paths';
</script>

<div class="usa-identifier">
  <div class="usa-identifier__section usa-identifier__section--masthead" aria-label="Agency identifier" style="padding-bottom: 0;">
    <div class="footer-container">
      <div class="usa-identifier__container">
        <div class="usa-identifier__logos">
          <a href="https://www.gsa.gov/" class="usa-identifier__logo">
            <img class="usa-icon usa-icon--size-6" src={asset('/gsa-star-mark-whtlogo.svg')} alt="GSA logo" />
          </a>
        </div>
        <div class="usa-identifier__identity" aria-label="Agency description">
          <p class="usa-identifier__identity-domain">FedRAMP.gov</p>
          <p class="usa-identifier__identity-disclaimer">
            <span aria-hidden="true">An </span> official website of the GSA’s
            <a href="https://www.gsa.gov/about-us/organization/federal-acquisition-service/technology-transformation-services" class="gov-links"
              >Technology Transformation Services</a
            >
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-container" style="padding-bottom: 0;">
    <nav class="usa-identifier__section usa-identifier__section--required-links" aria-label="Important links,">
      <div class="usa-identifier__container">
        <ul class="usa-identifier__required-links-list">
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/about-us" class="usa-identifier__required-link usa-link">About GSA</a>
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/website-information/accessibility-statement" class="usa-identifier__required-link usa-link"
              >Accessibility statement</a
            >
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/reference/freedom-of-information-act-foia" class="usa-identifier__required-link usa-link">GSA FOIA</a>
          </li>
          <li class="usa-identifier__required-links-item">
            <a
              href="https://www.gsa.gov/reference/civil-rights-programs/notification-and-federal-employee-antidiscrimination-and-retaliation-act-of-2002"
              class="usa-identifier__required-link usa-link">No FEAR Act data</a
            >
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsaig.gov/" class="usa-identifier__required-link usa-link">Office of the Inspector General</a>
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/about-us/newsroom/budget-and-performance" class="usa-identifier__required-link usa-link"
              >Performance reports</a
            >
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/website-information/website-policies#privacy" class="usa-identifier__required-link usa-link"
              >GSA privacy policy</a
            >
          </li>
          <li class="usa-identifier__required-links-item">
            <a href="https://www.gsa.gov/vulnerability-disclosure-policy" class="usa-identifier__required-link usa-link"
              >Vulnerability disclosure policy</a
            >
          </li>
        </ul>
      </div>
    </nav>
  </div>
  <div class="usa-identifier__section usa-identifier__section--usagov" aria-label="U.S. government information and services,">
    <div class="footer-container">
      <div class="usa-identifier__container">
        <div class="usa-identifier__usagov-description" style="margin-left: 0;">Looking for U.S. government information and services?</div>
        <a href="https://www.usa.gov/" class="usa-link gov-links">Visit USA.gov</a>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .usa-identifier {
    background: #180e1d;
    .usa-identifier__container {
      max-width: 75rem;
    }
  }
  p,
  a {
    color: white !important;
  }
</style>
