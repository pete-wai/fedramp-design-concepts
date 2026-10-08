<!-- routes/marketplace/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
  import GiveFeedbackButton from '$lib/components/GiveFeedbackButton.svelte';
  import surveyConfig from '$lib/data/surveys/data.json';
</script>

<GiveFeedbackButton formId={surveyConfig.surveyIds.marketplaceFeedback}></GiveFeedbackButton>
<div class="usa-section--light usa-prose main-content--light">
  {@render children()}
</div>
