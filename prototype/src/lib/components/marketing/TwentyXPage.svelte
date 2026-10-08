<script lang="ts">
  import { resolve, asset } from '$lib/utils/paths';
  import EmphasisBlockquote from '$lib/components/EmphasisBlockquote.svelte';
  import PhaseTimelineItem from '$lib/components/PhaseTimelineItem.svelte';
  import UnifiedTimeline from '$lib/components/UnifiedTimeline.svelte';

  let {copy} = $props();
  const {principles, unifiedTimelineEvents, phase1Blogs, phase1Videos, phase2Videos} = $derived(copy);

  // Deep paths under /2026 are Zensical-generated static files, not typed
  // SvelteKit routes, so `resolve` needs the same widening cast the /brand
  // pages use.
  const resolvePath = resolve as (path: string) => string;

  type TimelineEvent = {
    date: string;
    title: string;
    text?: string;
    color: string;
    type: 'history' | 'phase';
    status: 'completed' | 'active' | 'future';
    phaseNumber?: number;
  };






  let expandedPhase = $state(3);

  function togglePhase(phaseNumber: number) {
    expandedPhase = expandedPhase === phaseNumber ? 0 : phaseNumber;
  }
</script>

<article class="tx-page">
  <section class="tx-section tx-intro" aria-labelledby="overview">
    <p class="section-kicker">{copy.aDifferentModelForCloudAssurance}</p>
    <h1 id="overview">{copy.fedramp20x}</h1>
    <p class="lede">{copy.aNewApproachToCloudSecurity}</p>
    <p>{copy.weDesignedFedRAMP20xForBusinesses}</p>

    <div class="tx-quote">
      <EmphasisBlockquote
        source={copy.sourceOMBMemorandumM2415}
        text={copy.textWhileDefinedComplianceProceduresCan}
      />
    </div>
  </section>

  <section class="tx-section tx-intro" aria-labelledby="available-now">
    <p class="section-kicker">{copy.fedramp20xIsHere}</p>
    <h2 id="available-now">{copy.availableNow}</h2>
    <p class="lede">
      <a href={resolve('/2026')} target="_blank">{copy.theFullRulesForFedRAMP20x}</a>.
    </p>
    <div class="certification-grid" aria-label="FedRAMP 20x certification classes">
      <article class="certification-card class-a">
        <div class="class-card-header">
          <span class="class-mark" aria-hidden="true">{copy.a}</span>
          <h3><a href={resolvePath('/2026/reference/20x/a/')} target="_blank">{copy.classA}</a></h3>
          <span class="class-status">{copy.availableNow2}</span>
        </div>
        <p>{copy.classACertificationsAreForCloud}</p>
      </article>
      <article class="certification-card class-b">
        <div class="class-card-header">
          <span class="class-mark" aria-hidden="true">{copy.b}</span>
          <h3><a href={resolvePath('/2026/reference/20x/b/')} target="_blank">{copy.classB}</a></h3>
          <span class="class-status">{copy.availableNow2}</span>
        </div>
        <p>{copy.classBCertificationsAreForCloud}</p>
      </article>
      <article class="certification-card class-c">
        <div class="class-card-header">
          <span class="class-mark" aria-hidden="true">{copy.c}</span>
          <h3><a href={resolvePath('/2026/reference/20x/c/')} target="_blank">{copy.classC}</a></h3>
          <span class="class-status">{copy.availableNow2}</span>
        </div>
        <p>{copy.classCCertificationsAreForCloud}</p>
      </article>
      <article class="certification-card class-d">
        <div class="class-card-header">
          <span class="class-mark" aria-hidden="true">{copy.d}</span>
          <h3>{copy.classD}</h3>
          <span class="class-status future-label">{copy.phase4}</span>
        </div>
        <p>{copy.classDCertificationsWillBeDeveloped}</p>
      </article>
    </div>

    <div class="tx-quote">
      <EmphasisBlockquote
        source={copy.sourceOMBMemorandumM2415}
        text={copy.textFedRAMPWillEstablishCriteriaFor}
      />
    </div>
  </section>

  <section class="tx-section" aria-labelledby="core-principles">
    <p class="section-kicker">{copy.whatGuidesTheWork}</p>
    <h2 id="core-principles">{copy.corePrinciples}</h2>
    <p class="lede lede-small">{copy.fiveIdeasMoveAssuranceAwayFrom}</p>

    <div class="principles-strip">
      {#each principles as principle (principle.id)}
        <article class="principle-card">
          <span class="principle-number" aria-hidden="true">{principle.number}</span>
          <h3>{principle.title}</h3>
          <p>{principle.body}</p>
        </article>
      {/each}
    </div>

    <div class="tx-quote">
      <EmphasisBlockquote
        source={copy.sourceOMBMemorandumM2415}
        text={copy.textFedRAMPShouldNotIncentivizeOr}
      />
    </div>
  </section>

  <section class="tx-section" aria-labelledby="context-matters">
    <p class="section-kicker">{copy.whyThisWorks}</p>
    <h2 id="context-matters">{copy.contextMatters}</h2>
    <p class="lede lede-small">{copy.securityDecisionsAreComplexTheRight}</p>
    <div class="tx-quote">
      <EmphasisBlockquote
        source={copy.sourceOMBMemorandumM2415}
        text={copy.textTheFedRAMPPMOIsResponsible}
      />
    </div>
    <div class="editorial-copy">
      <div>
        <p>{copy.theGovernmentHasManyNeedsFor}</p>
        <p>{copy.requiringEveryServiceToMeetRequirements}</p>

        <p>{copy.insteadOfDecidingIfACloud}</p>
      </div>
      <div class="use-case-panel">
        <p class="panel-label">{copy.twoServicesDifferentNeeds}</p>
        <p>{copy.aPublicWebsiteMightNeedHigh}</p>
        <p>{copy.the20xApproachLetsAgenciesUnderstand}</p>
      </div>
    </div>
  </section>

  <section class="tx-section" aria-labelledby="phased-implementation">
    <p class="section-kicker">{copy.builtInPublicDeliveredInIncrements}</p>
    <h2 id="phased-implementation">{copy.phasedImplementation}</h2>
    <p class="lede lede-small">{copy.eachPhaseRespondsToMeasurableImpact}</p>

    <div class="phase-notice">
      <span class="live-dot" aria-hidden="true"></span>
      <p>
        <strong>{copy.fedramp20xIsCurrentlyInPhase}</strong>{copy.futureDatesAreEstimatesForPublic}</p>
    </div>

    <div class="phases-cards">
      <PhaseTimelineItem
        phaseNumber={1}
        phaseName="20x Low Pilot and Proof of Concept"
        status="COMPLETED"
        timeline="FY25 Q3 to FY25 Q4"
        deliveryGoal="Test the concepts behind FedRAMP 20x with industry and demonstrate the feasibility of automation-based assessment and validation for potential Low impact cloud services."
        outcome="Demonstrated feasibility and demand with substantial industry interest and support."
        expanded={expandedPhase === 1}
        onToggle={() => togglePhase(1)}
      >
        <div class="phase-recap">
          <h3>{copy.phase1Recap}</h3>
          <p>{copy.thePhase1PilotRanFrom}</p>
          <p>{copy.fedrampReceived26CompletePackagesBetween}</p>
          <p>{copy.unexpectedDemandMeantFedRAMPCompleted13}</p>

          <h4>{copy.keyLessons}</h4>
          <ol class="lessons-list">
            <li>{copy.keySecurityIndicatorsCanDemonstrateSecurity}</li>
            <li>{copy.industryDemandForANewApproach}</li>
            <li>{copy.independentAssessmentMustMoveBeyondTraditional}</li>
            <li>{copy.cloudProvidersNeedDeepEngagementFrom}</li>
            <li>{copy.aFullyOpenPilotWithMinimal}</li>
            <li>{copy.noParticipantsActivelyReusedExistingFramework}</li>
            <li>{copy.programAuthorizationWithoutAnAgencySponsor}</li>
          </ol>

          <div class="recap-collection">
            <div class="recap-heading">
              <div>
                <p class="collection-label">{copy.watch}</p>
                <h4>{copy.communityUpdates}</h4>
              </div>
              <p class="carousel-hint">{copy.scrollForMore}<span aria-hidden="true">→</span></p>
            </div>
            <ul class="carousel-track video-carousel" aria-label="Phase 1 community update videos">
              {#each phase1Videos as video (video.href)}
                <li>
                  <a class="media-card video-card" href={video.href} target="_blank" rel="noopener">
                    <span class="play-icon" aria-hidden="true">▶</span>
                    <span class="media-meta">{video.date}</span>
                    <strong>{video.title}</strong>
                    <span class="media-action">{copy.watchVideo}<span aria-hidden="true">↗</span></span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>

          <div class="recap-collection">
            <div class="recap-heading">
              <div>
                <p class="collection-label">{copy.read}</p>
                <h4>{copy.phase1BlogPosts}</h4>
              </div>
              <p class="carousel-hint">{copy.scrollForMore}<span aria-hidden="true">→</span></p>
            </div>
            <ul class="carousel-track blog-carousel" aria-label="Phase 1 blog posts">
              {#each phase1Blogs as blog (blog.title)}
                <li>
                  <a class="media-card blog-card" href={(resolve as (path: string) => string)(blog.permalink)}>
                    <img src={(asset as (path: string) => string)(blog.image)} alt="" loading="lazy" />
                    <span class="media-copy">
                      <span class="media-meta">{blog.date}</span>
                      <strong>{blog.title}</strong>
                      <span class="media-description">{blog.description}</span>
                      <span class="media-action">{copy.readPost}<span aria-hidden="true">→</span></span>
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </PhaseTimelineItem>

      <PhaseTimelineItem
        phaseNumber={2}
        phaseName="20x Moderate Pilot"
        status="COMPLETED"
        timeline="FY26 Q1 to FY26 Q2"
        deliveryGoal="Add the requirements needed for FedRAMP Moderate and test whether automated validation could scale to a higher impact level."
        outcome="Expanded capabilities and coverage and completed initial Moderate testing."
        expanded={expandedPhase === 2}
        onToggle={() => togglePhase(2)}
      >
        <div class="phase-recap">
          <h3>{copy.phase2Recap}</h3>
          <p>{copy.thePhase2PilotRanFrom}</p>
          <p>{copy.fedrampReceived14QualifyingSubmissionsThe}</p>

          <div class="lesson-columns">
            <div>
              <h4>{copy.lessonsLearned}</h4>
              <ul>
                <li>{copy.theKeySecurityIndicatorApproachAdapts}</li>
                <li>{copy.automatedValidationsCanIntegrateIntoExisting}</li>
                <li>{copy.authorizedByFedRAMPRequirementsPresentedAs}</li>
                <li>{copy.bespokeDemonstrationsFosterCreativityAndFree}</li>
                <li>{copy.fastReviewsSharedSeveralTraitsTimely}</li>
                <li>{copy.assessorsNeedClearerGuidanceSupportAnd}</li>
                <li>{copy.trendingValidationDataOverTimePromotes}</li>
              </ul>
            </div>
            <div class="vibes-panel">
              <h4>{copy.phase2Vibes}</h4>
              <ul>
                <li>{copy.theWorldSeesThePotentialOf}</li>
                <li>{copy.noMoreRacingToFinishPaperwork}</li>
                <li>{copy.participantsValuedThePilotSFreedom}</li>
                <li>{copy.increasedAssessorEngagementThroughoutTheProcess}</li>
                <li>{copy.assessorsValuedCollaborationButNeededMore}</li>
                <li>{copy.clearInformativeNonStaticDepictionsOf}</li>
              </ul>
            </div>
          </div>

          <div class="recap-collection">
            <div class="recap-heading">
              <div>
                <p class="collection-label">{copy.watchListen}</p>
                <h4>{copy.phase2Updates}</h4>
              </div>
              <p class="carousel-hint">{copy.scrollForMore}<span aria-hidden="true">→</span></p>
            </div>
            <ul class="carousel-track video-carousel" aria-label="Phase 2 videos and podcasts">
              {#each phase2Videos as video (video.href)}
                <li>
                  <a class="media-card video-card" href={video.href} target="_blank" rel="noopener">
                    <span class="play-icon" aria-hidden="true">▶</span>
                    <span class="media-meta">{video.date}</span>
                    <strong>{video.title}</strong>
                    <span class="media-action">{copy.openMedia}<span aria-hidden="true">↗</span></span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </PhaseTimelineItem>

      <PhaseTimelineItem
        phaseNumber={3}
        phaseName="Wide-scale Adoption of FedRAMP 20x"
        status="ACTIVE"
        timeline="FY26 Q3 to FY26 Q4"
        deliveryGoal="Formalize FedRAMP 20x requirements from the Phase 1 and 2 outcomes and provide wide-scale agency support and training for the new Certification types."
        expanded={expandedPhase === 3}
        onToggle={() => togglePhase(3)}
      >
        <div class="phase-recap phase-three">
          <p class="phase-declaration">{copy.thePilotsAreOverFedRAMP20x}</p>
          <p>{copy.phase3FocusesOnTheFinal}</p>
          <ul>
            <li>{copy.theFedRAMPConsolidatedRulesFor2026}</li>
            <li>{copy.theSubmissionPipelineIsPlannedTo}</li>
            <li>{copy.fedramp20xWillInitiallySupportClass}</li>
          </ul>
          <p>{copy.followThe}<a href={resolve('/(pages)/(updates)/events')}>{copy.communityUpdates2}</a>, <a href={resolve('/(pages)/blog')}>{copy.blog}</a>{copy.and}<a href={resolve('/(pages)/(updates)/notices')}>{copy.publicNotices}</a>{copy.forCurrentProgress}</p>
        </div>
      </PhaseTimelineItem>

      <PhaseTimelineItem
        phaseNumber={4}
        phaseName="20x Class D (High) Pilot"
        status="FUTURE"
        timeline="FY27 Q1 to FY27 Q2 · estimated"
        deliveryGoal="Continue wide-scale adoption while piloting a path for 20x Class D (High) services."
        expanded={false}
        onToggle={() => togglePhase(4)}
      />

      <PhaseTimelineItem
        phaseNumber={5}
        phaseName="End of Life for FedRAMP New Rev5 Certifications"
        status="FUTURE"
        timeline="FY27 Q3 to FY27 Q4 · estimated"
        deliveryGoal="FedRAMP will stop accepting new Rev5 Certifications on June 11, 2027, and provide a clear transition path and timeline for existing Rev5 offerings by the end of Phase 5."
        expanded={false}
        onToggle={() => togglePhase(5)}
      />
    </div>
  </section>

  <section class="tx-section" aria-labelledby="timeline">
    <p class="section-kicker">{copy.thePathToFedRAMP20x}</p>
    <h2 id="timeline">{copy.timeline}</h2>
    <p class="lede lede-small">{copy.thePolicyPilotAndDeliveryMilestones}</p>

    <div class="timeline-panel">
      <UnifiedTimeline events={unifiedTimelineEvents} ariaLabel="FedRAMP 20x history and roadmap" />
    </div>
  </section>

  <section class="tx-section" aria-labelledby="lets-go">
    <p class="section-kicker">{copy.getInTheFedRAMPGame}</p>
    <h2 id="lets-go">{copy.letSGo}</h2>
    <p class="lede lede-small">{copy.fedramp20xSimplifiesThePathTo}</p>
    <div class="lets-go-grid">
      <p><a href={resolve('/2026')}>{copy.consolidatedRulesFor2026}</a></p>
      <p><a href={resolve('/(pages)/(updates)/community')}>{copy.communityDiscussionsOnGitHub}</a></p>
      <p><a href={resolve('/(pages)/(updates)/events')}>{copy.communityEvents}</a></p>
      <p><a href={resolve('/(pages)/blog')}>{copy.theFedRAMPBlog}</a></p>
      <p><a href={resolve('/(pages)/(updates)/notices')}>{copy.publicNotices}</a></p>
      <p><a href={resolve('/(pages)/(updates)/rfcs')}>{copy.requestsForComment}</a></p>
    </div>
    <div class="lets-go-footer">
      <p>{copy.andAllOurSocialsInThe}</p>
      <p>{copy.seeYouSoon}</p>
    </div>
  </section>
</article>

<style lang="scss">
  .tx-page {
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: 1rem;
    line-height: 1.7;
  }

  .tx-page,
  .tx-page * {
    box-sizing: border-box;
  }

  .tx-page a {
    color: var(--tx-accent-warm-light);
    text-decoration-color: rgba(255, 192, 142, 0.45);
    text-underline-offset: 0.18em;
  }

  .tx-page a:hover {
    color: #fff;
    text-decoration-color: var(--tx-accent-warm);
  }

  .tx-page a:focus-visible {
    outline: 3px solid var(--tx-accent-warm);
    outline-offset: 3px;
    border-radius: 3px;
  }

  .tx-section {
    padding: clamp(2.75rem, 6vw, 5rem) 0;
    border-bottom: 1px solid rgba(196, 160, 232, 0.14);
    scroll-margin-top: 2rem;
  }

  .tx-section:first-child {
    padding-top: 1rem;
  }

  .tx-section:last-child {
    border-bottom: 0;
  }

  h1,
  h2,
  h3,
  h4,
  p {
    color: inherit;
  }

  h1,
  h2 {
    max-width: 18ch;
    margin: 0;
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: clamp(2.35rem, 6vw, 5.6rem);
    font-weight: 850;
    letter-spacing: -0.055em;
    line-height: 0.98;
    text-wrap: balance;
  }

  h3 {
    margin: 0 0 0.8rem;
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: clamp(1.35rem, 3vw, 2rem);
    line-height: 1.15;
  }

  h4 {
    margin: 1.8rem 0 0.65rem;
    color: var(--tx-text-primary);
    font-family: var(--tx-font-sans);
    font-size: 1.05rem;
  }

  p {
    max-width: 76ch;
  }

  .section-kicker,
  .collection-label,
  .panel-label {
    margin: 0 0 0.7rem;
    color: var(--tx-accent-warm);
    font-family: var(--tx-font-mono);
    font-size: 0.73rem;
    font-weight: 850;
    letter-spacing: 0.14em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .lede {
    max-width: 36ch;
    margin: 1.7rem 0 clamp(2rem, 4vw, 3rem);
    color: var(--tx-text-primary);
    font-size: clamp(1.35rem, 3vw, 2.25rem);
    font-weight: 460;
    letter-spacing: -0.02em;
    line-height: 1.35;
  }

  .lede-small {
    max-width: 47ch;
    font-size: clamp(1.15rem, 2.3vw, 1.65rem);
  }

  .tx-quote {
    max-width: 48rem;
    margin: 2rem 0;
  }

  .tx-quote :global(blockquote) {
    position: relative;
    margin: 0;
    padding: 1.5rem 2rem 1.5rem 3.2rem;
    overflow: hidden;
    border: 1px solid var(--tx-border);
    border-left: 3px solid var(--tx-accent-warm);
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(255, 146, 72, 0.08), rgba(196, 160, 232, 0.05));
    color: var(--tx-text-primary);
  }

  .tx-quote :global(.left-large-quotation-mark) {
    top: 0.42rem;
    left: 0.55rem;
    color: rgba(255, 146, 72, 0.32);
    font-size: 4rem;
    line-height: 1;
  }

  .tx-quote :global(.right-large-quotation-mark) {
    display: none;
  }

  .tx-quote :global(.quote) {
    display: block;
    font-size: 1rem;
    line-height: 1.7;
  }

  .tx-quote :global(.quote p) {
    margin: 0;
  }

  .tx-quote :global(.quote-source) {
    display: block;
    margin-top: 0.85rem;
    color: var(--tx-text-secondary);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .principles-strip {
    display: flex;
    gap: 0.75rem;
  }

  .certification-grid {
    display: grid;
    margin: clamp(2rem, 4vw, 3rem) 0 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .certification-card {
    position: relative;
    min-width: 0;
    padding: 1.25rem;
    overflow: hidden;
    border: 1px solid var(--tx-border);
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(196, 160, 232, 0.07), transparent 55%), var(--tx-surface);
  }

  .certification-card::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    background: var(--class-color);
    content: '';
  }

  .class-a {
    --class-color: #c4a0e8;
  }

  .class-b {
    --class-color: #ffb16f;
  }

  .class-c {
    --class-color: #75d99e;
  }

  .class-d {
    --class-color: #777789;
    border-style: dashed;
    opacity: 0.76;
  }

  .class-card-header {
    display: grid;
    margin-bottom: 0.9rem;
    grid-template-columns: auto 1fr auto;
    gap: 0.7rem;
    align-items: center;
  }

  .class-card-header h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .class-mark {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--class-color) 68%, transparent);
    border-radius: 9px;
    background: color-mix(in srgb, var(--class-color) 12%, transparent);
    color: var(--class-color);
    font-family: var(--tx-font-mono);
    font-size: 0.88rem;
    font-weight: 850;
  }

  .class-status {
    padding: 0.24rem 0.55rem;
    border: 1px solid rgba(117, 217, 158, 0.38);
    border-radius: 999px;
    background: rgba(117, 217, 158, 0.08);
    color: var(--tx-status-active);
    font-family: var(--tx-font-mono);
    font-size: 0.6rem;
    font-weight: 750;
    letter-spacing: 0.05em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .future-label {
    border-color: var(--tx-border-strong);
    background: rgba(119, 119, 137, 0.08);
    color: var(--tx-future-text);
  }

  .certification-card > p {
    margin: 0;
    color: var(--tx-text-secondary);
    font-size: 0.9rem;
    line-height: 1.62;
  }

  .principle-card {
    position: relative;
    min-width: 0;
    flex: 1 1 0;
    padding: 1.25rem 1rem 1.4rem;
    overflow: hidden;
    border: 1px solid var(--tx-border);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(42, 26, 53, 0.9), rgba(30, 18, 38, 0.8));
  }

  .principle-card::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--tx-accent-warm), var(--tx-accent-cool));
    content: '';
  }

  .principle-number {
    color: var(--tx-accent-warm);
    font-family: var(--tx-font-mono);
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.12em;
  }

  .principle-card h3 {
    margin: 1.6rem 0 0.75rem;
    font-size: clamp(1rem, 1.7vw, 1.3rem);
  }

  .principle-card p {
    margin: 0;
    color: var(--tx-text-secondary);
    font-size: clamp(0.76rem, 1vw, 0.88rem);
    line-height: 1.55;
  }

  .editorial-copy {
    display: grid;
    margin: 2.6rem 0;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.82fr);
    gap: clamp(1.5rem, 5vw, 4rem);
    align-items: start;
  }

  .editorial-copy p:first-child {
    margin-top: 0;
  }

  .use-case-panel,
  .vibes-panel {
    padding: 1.3rem;
    border: 1px solid var(--tx-border);
    border-radius: 12px;
    background: linear-gradient(150deg, rgba(196, 160, 232, 0.08), transparent 65%), var(--tx-surface);
  }

  .use-case-panel p {
    color: var(--tx-text-secondary);
    font-size: 0.92rem;
    line-height: 1.65;
  }

  .use-case-panel .panel-label {
    color: var(--tx-accent-cool);
  }

  .phase-notice {
    display: flex;
    max-width: 860px;
    margin: 0 0 2.25rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(117, 217, 158, 0.35);
    border-radius: 10px;
    background: rgba(117, 217, 158, 0.06);
    gap: 0.75rem;
    align-items: flex-start;
  }

  .phase-notice p {
    margin: 0;
    color: var(--tx-text-secondary);
    font-size: 0.86rem;
    line-height: 1.55;
  }

  .phase-notice strong {
    color: var(--tx-status-active);
  }

  .live-dot {
    width: 9px;
    height: 9px;
    flex: 0 0 9px;
    margin-top: 0.36rem;
    border-radius: 50%;
    background: var(--tx-status-active);
    box-shadow: 0 0 0 5px rgba(117, 217, 158, 0.12);
  }

  .phases-cards {
    max-width: 980px;
    min-width: 0;
  }

  .timeline-panel {
    max-width: 940px;
    margin-top: clamp(2rem, 4vw, 3rem);
    padding: clamp(1rem, 3vw, 2rem);
    border: 1px solid var(--tx-border);
    border-radius: 16px;
    background: radial-gradient(circle at 15% 10%, rgba(117, 38, 96, 0.15), transparent 22rem), rgba(30, 18, 38, 0.58);
  }

  .lets-go-grid {
    display: grid;
    max-width: 58rem;
    margin-top: 0.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    counter-reset: lets-go-link;
  }

  .lets-go-grid p {
    width: 100%;
    min-width: 0;
    max-width: none;
    margin: 0;
    color: transparent;
    font-size: 0;
    counter-increment: lets-go-link;
  }

  .lets-go-grid a {
    position: relative;
    display: grid;
    width: 100%;
    min-height: 5.25rem;
    padding: 1rem 3.25rem 1rem 3.5rem;
    align-items: center;
    border: 1px solid var(--tx-border);
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(196, 160, 232, 0.08), transparent 55%), var(--tx-surface);
    color: var(--tx-text-primary);
    font-size: 0.95rem;
    font-weight: 750;
    line-height: 1.35;
    text-decoration: none;
    transition:
      border-color 180ms ease,
      background-color 180ms ease,
      transform 180ms ease;
  }

  .lets-go-grid a::before {
    position: absolute;
    left: 1rem;
    color: var(--tx-accent-warm);
    content: counter(lets-go-link, decimal-leading-zero);
    font-family: var(--tx-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
  }

  .lets-go-grid a::after {
    position: absolute;
    right: 1rem;
    color: var(--tx-accent-warm-light);
    content: '→';
    font-size: 1rem;
    transition: transform 180ms ease;
  }

  .lets-go-grid a:hover {
    border-color: var(--tx-border-strong);
    background-color: var(--tx-surface-raised);
    color: #fff;
    transform: translateY(-2px);
  }

  .lets-go-grid a:hover::after {
    transform: translateX(3px);
  }

  .lets-go-footer {
    display: flex;
    max-width: 58rem;
    margin-top: 1rem;
    padding-top: 1rem;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid rgba(196, 160, 232, 0.16);
    color: var(--tx-text-secondary);
  }

  .lets-go-footer p {
    margin: 0;
  }

  .lets-go-footer p:last-child {
    color: var(--tx-accent-warm-light);
    font-weight: 800;
  }

  .phase-recap {
    color: var(--tx-text-secondary);
  }

  .phase-recap h3,
  .phase-recap h4,
  .phase-recap strong {
    color: var(--tx-text-primary);
  }

  .phase-recap p,
  .phase-recap li {
    font-size: 0.92rem;
    line-height: 1.68;
  }

  .phase-recap > p:first-of-type {
    margin-top: 0;
  }

  .lessons-list {
    display: grid;
    margin: 1rem 0 0;
    padding: 0;
    counter-reset: lessons;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    list-style: none;
  }

  .lessons-list li {
    position: relative;
    min-height: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 1px solid var(--tx-border);
    border-radius: 9px;
    background: rgba(15, 10, 20, 0.24);
    counter-increment: lessons;
  }

  .lessons-list li::before {
    position: absolute;
    top: 0.95rem;
    left: 1rem;
    color: var(--tx-accent-warm);
    font-size: 0.72rem;
    font-weight: 850;
    content: counter(lessons, decimal-leading-zero);
  }

  .lesson-columns {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(250px, 0.8fr);
    gap: 1.25rem;
    align-items: start;
  }

  .lesson-columns ul,
  .phase-three ul {
    padding-left: 1.2rem;
  }

  .lesson-columns li,
  .phase-three li {
    margin-bottom: 0.55rem;
    padding-left: 0.3rem;
  }

  .lesson-columns li::marker,
  .phase-three li::marker {
    color: var(--tx-accent-warm);
  }

  .vibes-panel h4 {
    margin-top: 0;
  }

  .phase-declaration {
    color: var(--tx-accent-warm-light);
    font-size: 1.25rem !important;
    font-weight: 750;
  }

  .recap-collection {
    margin-top: 2.2rem;
  }

  .recap-heading {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
    margin-bottom: 0.75rem;
  }

  .recap-heading h4,
  .recap-heading .collection-label {
    margin: 0;
  }

  .collection-label {
    margin-bottom: 0.25rem !important;
    color: var(--tx-accent-warm);
  }

  .carousel-hint {
    margin: 0;
    color: var(--tx-text-secondary);
    font-size: 0.72rem !important;
    white-space: nowrap;
  }

  .carousel-track {
    display: flex;
    margin: 0;
    padding: 0 0 0.75rem;
    overflow-x: auto;
    gap: 0.75rem;
    list-style: none;
    scroll-padding-inline: 0.25rem;
    scroll-snap-type: x mandatory;
    scrollbar-color: var(--tx-border-strong) transparent;
    scrollbar-width: thin;
  }

  .carousel-track > li {
    min-width: 0;
    flex: 0 0 clamp(210px, 27vw, 255px);
    scroll-snap-align: start;
  }

  .media-card {
    display: flex;
    min-height: 100%;
    overflow: hidden;
    border: 1px solid var(--tx-border);
    border-radius: 10px;
    background: rgba(15, 10, 20, 0.42);
    color: var(--tx-text-primary) !important;
    text-decoration: none;
    transition:
      border-color 160ms ease,
      transform 160ms ease,
      background-color 160ms ease;
  }

  .media-card:hover {
    border-color: var(--tx-accent-warm);
    background: rgba(255, 146, 72, 0.06);
    transform: translateY(-2px);
  }

  .media-card strong {
    display: block;
    font-size: 0.88rem;
    line-height: 1.38;
  }

  .media-meta,
  .media-description,
  .media-action {
    display: block;
  }

  .media-meta {
    margin-bottom: 0.35rem;
    color: var(--tx-text-secondary);
    font-size: 0.65rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .media-description {
    margin-top: 0.45rem;
    color: var(--tx-text-secondary);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .media-action {
    margin-top: auto;
    padding-top: 0.75rem;
    color: var(--tx-accent-warm-light);
    font-size: 0.72rem;
    font-weight: 750;
  }

  .blog-card {
    flex-direction: column;
  }

  .blog-card img {
    width: 100%;
    height: 105px;
    object-fit: cover;
    opacity: 0.82;
    filter: saturate(0.85) contrast(1.05);
  }

  .media-copy {
    display: flex;
    min-height: 155px;
    padding: 0.85rem;
    flex: 1;
    flex-direction: column;
  }

  .video-card {
    min-height: 168px;
    padding: 1rem;
    flex-direction: column;
  }

  .play-icon {
    display: grid;
    width: 2rem;
    height: 2rem;
    margin-bottom: 1.1rem;
    place-items: center;
    border: 1px solid rgba(255, 146, 72, 0.55);
    border-radius: 50%;
    background: rgba(255, 146, 72, 0.1);
    color: var(--tx-accent-warm);
    font-size: 0.7rem;
  }

  @media (max-width: 1180px) {
    .principles-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .principle-card:nth-child(4),
    .principle-card:nth-child(5) {
      grid-column: span 1;
    }
  }

  @media (max-width: 900px) {
    .lesson-columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    .recap-heading {
      align-items: start;
      flex-direction: column;
    }

    .certification-grid {
      grid-template-columns: 1fr;
    }

    .principles-strip {
      display: flex;
      width: 100%;
      flex-direction: column;
    }

    .principle-card {
      width: 100%;
      min-height: auto;
      flex: none;
      padding: 1.4rem 1.25rem 1.5rem;
    }

    .principle-card h3 {
      margin-top: 1rem;
      font-size: 1.3rem;
    }

    .principle-card p {
      font-size: 0.96rem;
      line-height: 1.65;
    }

    .editorial-copy,
    .lessons-list {
      grid-template-columns: 1fr;
    }

    .tx-quote :global(blockquote) {
      padding: 1.2rem 1.1rem 1.2rem 2.5rem;
    }

    .carousel-track > li {
      flex-basis: min(78vw, 245px);
    }

    .timeline-panel {
      padding: 1rem 0.85rem;
    }

    .lets-go-grid {
      grid-template-columns: 1fr;
    }

    .lets-go-grid a {
      min-height: 4.75rem;
    }

    .lets-go-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 420px) {
    .tx-section {
      padding: 2.5rem 0;
    }

    h1,
  h2 {
      font-size: clamp(2.15rem, 13vw, 3rem);
    }

    .phase-notice {
      padding: 0.85rem;
    }

    .class-card-header {
      grid-template-columns: auto 1fr;
    }

    .class-status {
      width: max-content;
      grid-column: 2;
    }

    .carousel-track > li {
      flex-basis: min(84vw, 260px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .media-card {
      transition: none;
    }

    .media-card:hover {
      transform: none;
    }
  }
</style>
