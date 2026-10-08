<!-- lib/components/FedRAMPFooter.svelte -->
<script>
  import { asset, resolve } from '$lib/utils/paths';
</script>

<div id="fedramp-footer" class="usa-footer bg-primary-dark text-base-lightest link-base-lightest">
  <div class="grid-container-desktop-lg">
    <div class="grid-row">
      <div id="fedramp-disclaimer" class="usa-card desktop:grid-col">
        <div class="usa-card__body">
          <p>
            To receive news and updates, join the GSA’s <span class="no-wrap;">subscriber list.</span>
          </p>
          <p>The FedRAMP name and the FedRAMP logo are the property of the General Services Administration (GSA).</p>
          <p>
            For more information, please see <a class="footer-brand-guide-link" href={resolve('/(pages)/(updates)/disclaimers')}
              >FedRAMP Disclaimers</a
            >.
          </p>
        </div>
      </div>
      <div id="fedramp-interact" class="usa-card desktop:grid-col">
        <div class="usa-card__header">
          <div class="usa-card__heading">
            <h2>Interact with FedRAMP</h2>
          </div>
        </div>
        <div class="usa-card__body">
          <ul class="icon-list">
            <li>
              <a href="https://www.linkedin.com/showcase/gsa-fedramp/about/" class="icon-item">
                <img src={asset('/custom-linkedin-icon.svg')} aria-label="FedRAMP on LinkedIn" alt="LinkedIn Icon" class="custom-icon" />
                <span class="text">LinkedIn</span>
              </a>
            </li>
            <li>
              <a href="https://x.com/fedramp?lang=en" class="icon-item">
                <svg class="usa-icon custom-icon background" aria-labelledby="x-title" role="img">
                  <title id="x-title">FedRAMP on X</title>
                  <use href={asset('/uswds/img/sprite.svg#x')}></use>
                </svg>
                <span>X</span>
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/c/FedRAMP?lang=en" class="icon-item">
                <svg class="usa-icon custom-icon background" aria-labelledby="youtube-title" role="img">
                  <title id="youtube-title">FedRAMP on YouTube</title>
                  <use href={asset('/uswds/img/sprite.svg#youtube')}></use>
                </svg>
                <span>YouTube</span>
              </a>
            </li>
            <li>
              <a href="https://github.com/FedRAMP/community/discussions" class="icon-item">
                <svg class="usa-icon custom-icon background" aria-labelledby="github-title" role="img">
                  <title id="github-title">FedRAMP on GitHub</title>
                  <use href={asset('/uswds/img/sprite.svg#github')}></use>
                </svg>
                <span>GitHub</span>
              </a>
            </li>
            <li>
              <a href="mailto:info@FedRAMP.gov" class="icon-item">
                <svg class="usa-icon custom-icon background" aria-labelledby="email-title" role="img">
                  <title id="email-title">FedRAMP Email Address</title>
                  <use href={asset('/uswds/img/sprite.svg#mail_outline')}></use>
                </svg>
                <span>info@FedRAMP.gov</span>
              </a>
              (monitored by real humans who care)
            </li>
          </ul>
        </div>
      </div>
      <div id="fedramp-contact" class="usa-card desktop:grid-col">
        <div class="usa-card__header">
          <div class="usa-card__heading">
            <h2>Keep Up To Date</h2>
          </div>
        </div>
        <div class="usa-card__body">
          <p>
            To receive news and updates, join the GSA's <span class="no-wrap;">subscriber list.</span>
          </p>
        </div>
        <div class="usa-card__footer">
          <form
            id="contact"
            action="https://public.govdelivery.com/accounts/USGSA/subscriber/topics?qsp=USGSA_2224"
            method="POST"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button class="usa-button usa-button--outline" type="submit" aria-label="Subscribe to FedRAMP updates (opens in new tab)">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds' as uswds;
  #fedramp-footer {
    background: #180e1d;
    padding-top: 1.6rem;
    a {
      color: uswds.color('base-lightest');
    }
    .usa-card__header {
      .usa-card__heading {
        font-family: 'Source Sans Pro Web', sans-serif;
        font-size: 1.5rem;
        h2 {
          font-family: 'Source Sans Pro Web', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: normal;
          margin: 0;
        }
      }
    }
    .usa-card__body {
      color: uswds.color('base-lightest');
    }
    .icon-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 1.3rem;
      padding-left: 0;
      list-style-type: none;
      align-items: start;

      li:last-child {
        grid-column: 1 / -1;
        align-self: center;
      }
    }
    .icon-item {
      display: flex;
      align-items: center;
      width: fit-content;
      .text {
        display: flex;
        align-items: center;
        width: fit-content;
      }
    }
    @media (max-width: 63.99em) {
      .icon-list {
        flex-direction: row;
        flex-wrap: wrap;
        > li {
          width: 48%;
        }
      }
    }
    .usa-button {
      padding: 0.75rem 1.875rem;
      text-decoration: underline;
    }
    .background {
      color: #531d40 !important;
      background: #d9932a;
    }
    .custom-icon {
      height: 1.875rem;
      width: 1.875rem;
      border-radius: 2px;
      margin-right: 1rem;
    }
    .grid-row {
      @media screen and (min-width: uswds.units('desktop')) {
        gap: 1.2rem;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      @media screen and (min-width: uswds.units('tablet')) {
        padding-left: 5rem;
        padding-right: 5rem;
      }
      > div {
        background: #531d40;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
      }
    }
  }
</style>
