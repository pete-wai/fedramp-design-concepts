// routes/marketplace/+layout.server.ts

// NOTE: This layout intentionally does NOT return the full marketplace dataset.
// Layout data is inherited and serialized into every descendant page's
// __data.json. Returning fedRAMPData here previously embedded the entire ~3.6 MB
// dataset into all ~950 marketplace pages, causing the prerender step to stall and
// CI to time out. Routes that need the data read it directly from getMarketplaceData().

export const prerender = true;
