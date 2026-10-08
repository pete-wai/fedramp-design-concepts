---
title: Requests for Comment
tabTitle: Requests for Comment
permalink: /rfcs/
redirect_from: /updates/rfcs/
---

<script lang="ts">
  import { resolve, asset } from '$lib/utils/paths';
  import { formatDateToNumeric } from '$lib/utils/functions.js';
  import USAInPageNav from '$lib/components/USAInPageNav.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let openRfcs = data.openRfcs;
  let closedRfcs = data.closedRfcs;

  const headings = [
    { id: 'open-fedramp-requests-for-comment-rfcs', text: 'Open RFCs', href: '#open-fedramp-requests-for-comment-rfcs', level: 2 },
    { id: 'closed-fedramp-requests-for-comment-rfcs', text: 'Closed RFCs', href: '#closed-fedramp-requests-for-comment-rfcs', level: 2 },
    { id: 'how-will-fedramp-request-comments', text: 'How FedRAMP requests comments', href: '#how-will-fedramp-request-comments', level: 2 },
    { id: 'why-should-i-submit-rfc-feedback', text: 'Why submit RFC feedback?', href: '#why-should-i-submit-rfc-feedback', level: 2 },
  ];
</script>

<div class="usa-in-page-nav-container">
  <USAInPageNav {headings} title="On this page" />

  <main id="main-content" class="main-content usa-prose">

## Open FedRAMP Requests for Comment (RFCs)

{#if openRfcs.length > 0}
  <table class="rfc-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Request for Comment On</th>
        <th>Description</th>
        <th>Opened</th>
        <th>Closing</th>
      </tr>
    </thead>
    <tbody>
      {#each openRfcs as openRfc}
        <tr>
          <td>
            {#if openRfc.slug}
              <a href={resolve(openRfc.permalink)}>{openRfc.slug}</a>
            {:else}
              {openRfc.id}
            {/if}
          </td>
          <td>
            <a href={resolve(openRfc.permalink)}>{openRfc.indexTitle}</a>
          </td>
          <td>
            {@html openRfc.descriptionHtml}
            {#if openRfc.videos && openRfc.videos.length > 0}
              <div class="video-buttons">
                {#each openRfc.videos as video}
                  <button
                    class="usa-button usa-button--dark-outline video-button-spacing"
                    onclick={() => window.open(video.link, '_blank')}
                  >
                    <svg class="usa-icon" aria-hidden="true">
                      <use href={asset("/uswds/img/sprite.svg#youtube")}></use>
                    </svg>
                    {video.title}
                  </button>
                {/each}
              </div>
            {/if}
          </td>
          <td class="text-no-wrap">
            {formatDateToNumeric(openRfc.startDate, 'en-CA')}
          </td>
          <td class="text-no-wrap">
            {formatDateToNumeric(openRfc.closeDate, 'en-CA')}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>There are no open Requests for Comment at this time.</p>
{/if}

## Closed FedRAMP Requests for Comment (RFCs)

{#if closedRfcs.length > 0}
  <table class="rfc-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Request for Comment On</th>
        <th>Description</th>
        <th>Closed</th>
      </tr>
    </thead>
    <tbody>
      {#each closedRfcs as closedRfc}
        <tr>
          <td>
            {#if closedRfc.slug}
              <a href={resolve(closedRfc.permalink)}>{closedRfc.slug}</a>
            {:else}
              {closedRfc.id}
            {/if}
          </td>
          <td>
            <a href={resolve(closedRfc.permalink)}>{closedRfc.indexTitle}</a>
          </td>
          <td>
            {@html closedRfc.descriptionHtml}
            {#if closedRfc.videos && closedRfc.videos.length > 0}
              <div class="video-buttons">
                {#each closedRfc.videos as video}
                  <button
                    class="usa-button usa-button--dark-outline video-button-spacing"
                    onclick={() => window.open(video.link, '_blank')}
                  >
                    <svg class="usa-icon" aria-hidden="true">
                      <use href={asset("/uswds/img/sprite.svg#youtube")}></use>
                    </svg>
                    {video.title}
                  </button>
                {/each}
              </div>
            {/if}
          </td>
          <td class="text-no-wrap">
            {formatDateToNumeric(closedRfc.closeDate, 'en-CA')}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>There are no closed Requests for Comment at this time.</p>
{/if}

## How will FedRAMP request comments?

FedRAMP will communicate to the public about open RFCs via its various social
channels, including blogs, email lists, and more. Multiple RFCs may be run
simultaneously by the team.

### Providing feedback

There are multiple ways to provide feedback on a full RFC:

- Participate in the Discussion in the rfcs repository on GitHub
- Follow the instructions in the RFC to use alternative mechanisms for public
  feedback, such as online forms or email.

It is important that each bit of feedback is _concise_ and _actionable_,
providing enough information to allow the document maintainers to adequately
address the feedback.

### How FedRAMP will participate

The FedRAMP team may interact with the public discussion repository in a limited
manner, similar to a digital town hall, by:

- Requesting clarification or additional information if the content of a comment
  is not clear to the FedRAMP reviewer.
- Acknowledging that comments have been reviewed.
- Responding to requests for clarification from the public when that
  clarification would be relevant to a significant portion of the public.

> FedRAMP will consider only the content of the message when responding, and
> will not prioritize or otherwise consider the individual or organization when
> determining which messages to respond to. A response from FedRAMP is not an
> endorsement and does not represent concurrence with the content.

Each public comment request may have multiple rounds, with comments being
addressed in no smaller than 30-day increments.

The end of the public comment period **does not mean the policy will be
immediately implemented.** Other governance activities and final approval will
be required; when ready for adoption or publication, final policies or documents
will be shared publicly with appropriate implementation activities.

_Currently, only members of the FedRAMP team can initiate the formal RFC
process._

## Why should I submit RFC feedback?

FedRAMP stakeholders, including cloud service providers (CSPs), security
professionals, government agencies, and industry experts, may provide public
feedback on these documents for several key reasons.

- Influencing Policy and Framework Development: FedRAMP documents, such as
  updates to security guidelines, assessment frameworks, or requirements impact
  stakeholders directly. By providing feedback, stakeholders have an opportunity
  to shape the policies to ensure they are practical, effective, and align with
  industry standards. This can help ensure that the requirements and guidelines
  are feasible for implementation and improve overall security.
- Addressing Practical Implementation Challenges: Stakeholders who are directly
  involved in the FedRAMP authorization or in the process of securing federal
  cloud use may experience unanticipated practical challenges. Public feedback
  allows these stakeholders to highlight real-world issues, propose solutions,
  and ensure that policies are aligned with technological trends and operational
  realities.
- Advocating for Cost-Effectiveness and Efficiency: Cloud service providers and
  other affected parties are often concerned about the costs and administrative
  burden associated with meeting FedRAMP requirements. Providing feedback allows
  stakeholders to advocate for streamlined processes, suggest more efficient
  frameworks, or raise concerns about requirements that might be too expensive
  or complex.
- Ensuring Transparency and Accountability: Public feedback fosters an open
  dialogue between the government and industry. It promotes transparency and
  ensures that stakeholders are part of the decision-making process. This
  collaboration helps build trust between federal agencies and private sector
  participants and ensures that the government remains accountable for
  considering diverse perspectives.
- Mitigating Security Risks: Security professionals may provide feedback to
  ensure that FedRAMP security guidelines are rigorous enough to mitigate
  evolving cybersecurity threats. Their insights help ensure that the
  government's security posture remains up-to-date and effective in protecting
  sensitive data.
- Encouraging Innovation: By participating in the public feedback process,
  stakeholders can propose innovative approaches, highlight emerging
  technologies, and suggest ways to incorporate these into improving FedRAMP.
  This ensures that the program remains adaptive to the fast-paced evolution of
  cloud technologies.

Ultimately, public feedback helps ensure that FedRAMP documents and policies
reflect the needs and expertise of both government and private sector entities,
fostering a more secure, efficient, and collaborative cloud security
environment.

  </main>
</div>

<style>
  @media (max-width: 640px) {
    /* Styles for screens up to 768px wide */
    table {
      font-size: 0.8rem !important; /* Reduce font size */
      padding: 5px !important; /* Reduce padding */
    }

    th,
    td {
      padding: 5px !important; /* Reduce cell padding */
    }
  }

  .video-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  /* Add spacing to the buttons */
  .video-button-spacing {
    margin-bottom: 1rem;
  }
</style>
